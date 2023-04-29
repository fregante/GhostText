import GThumane from './humane-ghosttext.js';
import advancedEditors from './advanced-editors-messenger.js';
import optionsStorage from './options-storage.js';

const knownElements = new Map();
const activeFields = new Set();
const eventOptions = {bubbles: true};
const optionsPromise = optionsStorage.getAll();

let isWaitingForActivation = false;
const startTimeout = 15_000;
let timeoutHandle;

class ContentEditableWrapper {
	constructor(element) {
		this.el = element;
		this.dataset = element.dataset;
		this.addEventListener = element.addEventListener.bind(element);
		this.removeEventListener = element.removeEventListener.bind(element);
		this.dispatchEvent = element.dispatchEvent.bind(element);
	}

	get value() {
		return this.el.innerHTML;
	}

	set value(html) {
		this.el.innerHTML = html;
	}
}

class AdvancedTextWrapper {
	constructor(element, visualElement) {
		this.el = element;
		this.dataset = visualElement.dataset;
		this.el.addEventListener('gt:input', event => {
			this._value = event.detail.value;
		});
		this.el.dispatchEvent(
			new CustomEvent('gt:get', {
				bubbles: true,
			}),
		);
	}

	addEventListener(type, callback) {
		this.el.addEventListener(`gt:${type}`, callback);
	}

	removeEventListener(type, callback) {
		this.el.removeEventListener(`gt:${type}`, callback);
	}

	get value() {
		return this._value;
	}

	set value(value) {
		if (this._value !== value) {
			this._value = value;
			this.el.setAttribute('gt-value', value);
			this.el.dispatchEvent(new CustomEvent('gt:transfer'));
		}
	}

	kill() {
		this.el.dispatchEvent(new CustomEvent('gt:kill'));
	}
}

function wrapField(field) {
	const monaco = field.closest('.monaco-editor');
	if (monaco) {
		const visualElement = monaco.querySelector('.monaco-editor-background');
		return new AdvancedTextWrapper(monaco, visualElement);
	}

	const cm6 = field.closest('.cm-content');
	if (cm6) {
		return new AdvancedTextWrapper(cm6, cm6);
	}

	if (field.classList.contains('ace_text-input')) {
		const ace = field.parentNode;
		const visualElement = ace.querySelector('.ace_scroller');
		return new AdvancedTextWrapper(ace, visualElement);
	}

	// If `field` is inside CodeMirror widget, it should be handled independently of it
	const cm = field.closest('.CodeMirror, .CodeMirror-linewidget');
	if (cm && cm.matches('.CodeMirror')) {
		const visualElement = cm.querySelector('.CodeMirror-sizer');
		return new AdvancedTextWrapper(cm, visualElement);
	}

	if (field.isContentEditable) {
		return new ContentEditableWrapper(field);
	}

	return field;
}

class GhostTextField {
	constructor(field) {
		this.field = wrapField(field);
		this.field.dataset.gtField = '';
		this.send = this.send.bind(this);
		this.receive = this.receive.bind(this);
		this.deactivate = this.deactivate.bind(this);
		this.tryFocus = this.tryFocus.bind(this);
		field.addEventListener('focus', this.tryFocus);
		this.state = 'inactive';
	}

	async activate() {
		if (this.state === 'active') {
			return;
		}

		this.state = 'active';
		activeFields.add(this);

		this.field.dataset.gtField = 'loading';

		this.port = browser.runtime.connect({name: 'new-field'});
		this.port.onMessage.addListener(async packet => {
			if (packet.message) {
				this.receive({data: packet.message});
			} else if (packet.close) {
				this.deactivate(false);
				updateCount();
			} else if (packet.ready) {
				const options = await optionsPromise;
				if (options.notifyOnConnect) {
					notify('log', 'Connected! You can switch to your editor');
				}

				this.field.addEventListener('input', this.send);
				this.field.dataset.gtField = 'enabled';

				// Send first value to init tab
				this.send();
				updateCount();
			} else if (packet.error) {
				notify('warn', packet.error);
				this.deactivate(false);
			}
		});
	}

	send(event) {
		if (event && event.detail?.ghostTextSyntheticEvent) {
			return;
		}

		console.info('sending', this.field.value.length, 'characters');
		this.port.postMessage(
			JSON.stringify({
				title: document.title, // TODO: move to first fetch
				url: location.host, // TODO: move to first fetch
				syntax: '', // TODO: move to first fetch
				text: this.field.value,
				selections: [
					{
						start: this.field.selectionStart || 0,
						end: this.field.selectionEnd || 0,
					},
				],
			}),
		);
	}

	receive(event) {
		const packet = JSON.parse(event.data);

		if ('text' in packet && this.field.value !== packet.text) {
			this.field.value = packet.text;

			if (this.field.dispatchEvent) {
				// These are in the right order
				this.field.dispatchEvent(new KeyboardEvent('keydown'), eventOptions);
				this.field.dispatchEvent(new KeyboardEvent('keypress'), eventOptions);
				this.field.dispatchEvent(new CompositionEvent('textInput'), eventOptions);
				this.field.dispatchEvent(new CustomEvent('input', { // InputEvent doesn't support custom data
					...eventOptions,
					detail: {
						ghostTextSyntheticEvent: true,
					},
				}));
				this.field.dispatchEvent(new KeyboardEvent('keyup'), eventOptions);
			}
		}

		if (packet.selections && typeof packet.selections[0] === 'object') {
			this.field.selectionStart = packet.selections[0].start;
			this.field.selectionEnd = packet.selections[0].end;
			// TODO: Pass the whole selections array instead and have the field deal with it, they could support multiple selections
		}
	}

	async deactivate(wasSuccessful = true) {
		if (this.state === 'inactive') {
			return;
		}

		this.state = 'inactive';
		console.log('Disabling field');
		activeFields.delete(this);
		this.port.disconnect();
		this.field.removeEventListener('input', this.send);
		this.field.kill?.();
		this.field.dataset.gtField = '';

		const options = await optionsPromise;
		if (options.focusOnDisconnect) {
			browser.runtime.sendMessage({
				code: 'focus-tab',
			});
		}

		if (wasSuccessful) {
			updateCount();
		}
	}

	tryFocus() {
		if (isWaitingForActivation && this.state === 'inactive') {
			clearTimeout(timeoutHandle);
			this.activate();
			isWaitingForActivation = false;
			document.body.classList.remove('GT--waiting');
		}
	}

	static deactivateAll() {
		for (const field of activeFields) {
			field.deactivate();
		}
	}
}

async function updateCount() {
	browser.runtime.sendMessage({
		code: 'connection-count',
		count: activeFields.size,
	});

	if (activeFields.size === 0) {
		const options = await optionsPromise;
		if (options.notifyOnConnect) {
			notify('log', 'Disconnected! \n <a href="https://github.com/fregante/GhostText/issues" target="_blank">Report issues</a>');
		}
	}
}

const registeredFrames = new Set([document]);
function injectCSS(root) {
	// Injects ghost-text.css into iframe document roots
	if (!registeredFrames.has(root)) {
		const cssLink = root.createElement("link")
		cssLink.href = browser.runtime.getURL('ghost-text.css');
		cssLink .rel = "stylesheet";
		cssLink.type = "text/css";
		registeredFrames.add(root);
		root.body.appendChild(cssLink);
	}
}

const selector = `
	textarea,
	[contenteditable=""],
	[contenteditable="true"]
`;


function registerElements(root = document) {
	injectCSS(root); // only if the CSS hasn't already been injected
	for (const element of root.querySelectorAll(selector)) {
		// TODO: Only handle areas that are visible
		//  && element.getBoundingClientRect().width > 20
		if (!knownElements.has(element)) {
			knownElements.set(element, new GhostTextField(element));
		}
	}
	for (const iframe of root.getElementsByTagName("iframe")) {
		// recursively search for elements inside iframes
		registerElements(iframe.contentWindow.document)
	}
}

function getMessageDisplayTime(message) {
	const wpm = 100; // 180 is the average words read per minute, make it slower
	// Add reaction time
	return 2000 + (message.split(' ').length / wpm * 60_000);
}

function notify(type, message, timeout = getMessageDisplayTime(message)) {
	console[type]('GhostText:', message);
	GThumane.remove();
	message = message.replace(/\n/g, '<br>');
	const notification = GThumane.log(message, {
		timeout,
		addnCls: type === 'log' ? '' : 'ghost-text-message-error',
	});
	document.addEventListener('click', () => {
		// Allow selections
		if (!window.getSelection().isCollapsed) {
			return;
		}

		notification.remove();
	}, {once: true});
}

function startGT() {
	clearTimeout(timeoutHandle);

	registerElements();
	console.info(knownElements.size + ' fields on the page');
	if (knownElements.size === 0) {
		notify('warn', 'No supported fields found. <a href="https://ghosttext.fregante.com/troubleshooting/#no-supported-fields">Need help?</a>');
		return;
	}

	if (knownElements.size === activeFields.size) {
		notify('log', 'All the fields on the page are active. Right-click the GhostText icon if you want to stop the connection');
		return;
	}

	// Automatically activate the focused field, unless it's already is active
	const focusedField = knownElements.get(document.activeElement);
	if (focusedField && !activeFields.has(focusedField)) {
		focusedField.activate();
		return;
	}

	// Automatically activate the only inactive field on the page
	const inactiveFields = [...knownElements.values()].filter(field => !activeFields.has(field));
	if (inactiveFields.length === 1 && !document.querySelector('iframe')) {
		inactiveFields[0].activate();
		return;
	}

	isWaitingForActivation = true;
	document.body.classList.add('GT--waiting');

	if (activeFields.size === 0) {
		notify('log', 'Click on the desired element to activate it.', startTimeout);
	} else {
		notify('log', 'Click on the desired element to activate it or right-click the GhostText icon to stop the connection.', startTimeout);
	}

	clearTimeout(timeoutHandle);
	timeoutHandle = setTimeout(stopGT, startTimeout);
}

function stopGT() {
	GhostTextField.deactivateAll();
	isWaitingForActivation = false;
	document.body.classList.remove('GT--waiting');
}

function init() {
	const script = document.createElement('script');
	script.textContent = '(' + advancedEditors.toString() + ')()';
	document.head.append(script);
}

window.startGT = startGT;
window.stopGT = stopGT;

init();
