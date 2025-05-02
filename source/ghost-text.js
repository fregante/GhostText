import GThumane from './humane-ghosttext.js';
import optionsStorage from './options-storage.js';

const knownElements = new Map();
const activeFields = new Map();
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
		this.connectionId = null;
		this.title = document.title;
		this.url = window.location.href;
		this.toolbar = null;
	}

	createToolbar() {
		if (this.toolbar) return;

		// 计算当前 field 的编号
		const index = Array.from(activeFields.keys()).indexOf(this.connectionId) + 1;

		const toolbar = document.createElement('div');
		toolbar.className = 'gt-toolbar';
		toolbar.innerHTML = `
			<span class="gt-connection-id">#${index}</span>
			<button class="gt-btn" title="Focus Editor">
				<svg viewBox="0 0 24 24" width="16" height="16">
					<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
				</svg>
			</button>
			<button class="gt-btn" title="Disconnect">
				<svg viewBox="0 0 24 24" width="16" height="16">
					<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
				</svg>
			</button>
		`;

		const style = document.createElement('style');
		style.textContent = `
			.gt-toolbar {
				position: fixed;
				background: white;
				padding: 8px;
				border-radius: 4px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.15);
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 8px;
				z-index: 999999;
				transition: z-index 0.2s;
			}
			.gt-toolbar:hover {
				z-index: 1000000;
			}
			.gt-connection-id {
				font-family: monospace;
				font-size: 12px;
				color: #666;
				white-space: nowrap;
				font-weight: bold;
			}
			.gt-btn {
				background: none;
				border: none;
				padding: 4px;
				cursor: pointer;
				border-radius: 4px;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 24px;
				height: 24px;
			}
			.gt-btn:hover {
				background: #f0f0f0;
			}
			.gt-btn svg {
				fill: #666;
			}
		`;
		document.head.appendChild(style);

		toolbar.querySelectorAll('.gt-btn').forEach((btn, index) => {
			btn.addEventListener('click', () => {
				if (index === 0) {
					this.bringEditorToFront();
				} else if (index === 1) {
					this.deactivate();
				}
			});
		});

		// 将工具栏添加到 body
		document.body.appendChild(toolbar);
		this.toolbar = toolbar;

		// 计算并设置工具栏位置
		const updatePosition = () => {
			if (!this.field.el.isConnected) {
				this.deactivate();
				return;
			}
			const rect = this.field.el.getBoundingClientRect();
			toolbar.style.left = `${rect.left - toolbar.offsetWidth - 10}px`;
			toolbar.style.top = `${rect.top}px`;
		};

		// 初始位置
		updatePosition();

		// 监听滚动和窗口大小变化
		window.addEventListener('scroll', updatePosition);
		window.addEventListener('resize', updatePosition);

		// 监听 field 的位置变化
		const observer = new MutationObserver(updatePosition);
		observer.observe(this.field.el, {
			attributes: true,
			attributeFilter: ['style', 'class'],
			childList: false,
			subtree: false
		});

		// 监听 field 的父元素变化
		const parentObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of mutation.removedNodes) {
					if (node === this.field.el || node.contains(this.field.el)) {
						this.deactivate();
						return;
					}
				}
			}
		});
		parentObserver.observe(document.body, {
			childList: true,
			subtree: true
		});

		// 监听滚动容器的变化
		const scrollObserver = new MutationObserver(updatePosition);
		let currentParent = this.field.el.parentElement;
		while (currentParent) {
			if (currentParent.scrollHeight > currentParent.clientHeight) {
				currentParent.addEventListener('scroll', updatePosition);
			}
			currentParent = currentParent.parentElement;
		}

		this.observers = [observer, parentObserver, scrollObserver];
		this.updatePosition = updatePosition;
	}

	async activate() {
		if (this.state === 'active') {
			return;
		}

		this.state = 'active';

		this.field.dataset.gtField = 'loading';

		this.port = chrome.runtime.connect({name: 'new-field'});
		this.port.onMessage.addListener(async packet => {
			console.log('packet', packet);
			if (packet.message) {
				this.receive({data: packet.message});
			} else if (packet.close) {
				this.deactivate(false);
				updateCount();
			} else if (packet.ready) {
				this.connectionId = packet.connectionId;
				activeFields.set(this.connectionId, this);
				const options = await optionsPromise;
				if (options.notifyOnConnect) {
					notify('log', 'Connected! You can switch to your editor');
				}

				this.field.addEventListener('input', this.send);
				this.field.dataset.gtField = 'enabled';
				this.createToolbar();

				// Send first value to init tab
				this.send();
				updateCount();
			} else if (packet.error) {
				notify('warn', packet.error);
				this.deactivate(false);
			}
		});
	}

	bringEditorToFront() {
		this.port.postMessage(JSON.stringify({type: "bringEditorToFront"}));
	}

	send(event) {
		if (event && event.detail?.ghostTextSyntheticEvent) {
			return;
		}

		if (this.field.value === undefined) {
			console.log('field value is undefined');
			console.log(this.field);
			return;
		}

		console.info('sending', this.field.value.length, 'characters');
			const payload = JSON.stringify({
				title: this.title,
				url: this.url,
				syntax: '', // TODO: move to first fetch
				text: this.field.value,
				connectionId: this.connectionId,
				selections: [
					{
						start: this.field.selectionStart || 0,
						end: this.field.selectionEnd || 0,
					},
				],
		});
		console.log('payload', payload);
		this.port.postMessage(payload);
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
		if (this.connectionId) {
			activeFields.delete(this.connectionId);
		}
		this.port.disconnect();
		this.field.removeEventListener('input', this.send);
		this.field.dataset.gtField = '';

		if (this.toolbar) {
			window.removeEventListener('scroll', this.updatePosition);
			window.removeEventListener('resize', this.updatePosition);
			
			// 移除滚动容器的监听
			let currentParent = this.field.el.parentElement;
			while (currentParent) {
				if (currentParent.scrollHeight > currentParent.clientHeight) {
					currentParent.removeEventListener('scroll', this.updatePosition);
				}
				currentParent = currentParent.parentElement;
			}

			if (this.observers) {
				this.observers.forEach(observer => observer.disconnect());
			}
			this.toolbar.remove();
			this.toolbar = null;
		}

		const options = await optionsPromise;
		if (options.focusOnDisconnect) {
			chrome.runtime.sendMessage({
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
		for (const field of activeFields.values()) {
			field.deactivate();
		}
	}
}

async function updateCount() {
	chrome.runtime.sendMessage({
		code: 'connection-count',
		count: activeFields.size
	});

	if (activeFields.size === 0) {
		const options = await optionsPromise;
		if (options.notifyOnConnect) {
			notify('log', 'Disconnected! \n <a href="https://github.com/fregante/GhostText/issues" target="_blank">Report issues</a>');
		}
	}
}

const selector = `
	textarea,
	[contenteditable=""],
	[contenteditable="true"]
`;
function registerElements() {
	for (const element of document.querySelectorAll(selector)) {
		// TODO: Only handle areas that are visible
		//  && element.getBoundingClientRect().width > 20
		if (!knownElements.has(element)) {
			knownElements.set(element, new GhostTextField(element));
		}
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
	message = message.replaceAll('\n', '<br>');
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

function getFocusedFieldStatus() {
	clearTimeout(timeoutHandle);

	registerElements();
	const focusedField = knownElements.get(document.activeElement);
	return {
		isExists: focusedField !== undefined,
		isActive: focusedField && activeFields.has(focusedField.connectionId)
	}
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
	if (focusedField && !activeFields.has(focusedField.connectionId)) {
		focusedField.activate();
		return;
	}

	// Automatically activate the only inactive field on the page
	const inactiveFields = [...knownElements.values()].filter(field => !activeFields.has(field.connectionId));
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

function dummy() {}

window.startGT = startGT;
window.stopGT = stopGT;
window.getFocusedFieldStatus = getFocusedFieldStatus;
window.dummy = dummy;

// setTimeout(startGT, 100);

// https://github.com/fregante/GhostText/pull/324
window.gtInterval ??= setInterval(() => {
	chrome.runtime.sendMessage({
		code: 'Keep alive',
	});
}, 5000);

// 添加消息监听
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('Received message in content script:', message);
	if (message.type === 'get-connections') {
		console.log(activeFields);
		const connections = Array.from(activeFields.entries()).map(([id, field]) => ({
			id,
			url: field.url,
			title: field.title
		}));
		console.log('Sending connections:', connections);
		sendResponse(connections);
	} else if (message.type === 'disconnect') {
		const field = activeFields.get(message.connectionId);
		if (field) {
			field.deactivate();
			sendResponse(true);
		} else {
			sendResponse(false);
		}
	} else if (message.type === 'focus-fields') {
		const field = activeFields.get(message.connectionId);
		if (field) {
			console.log('Focusing field:', field);
			field.field.el.focus();
			sendResponse(true);
		} else {
			sendResponse(false);
		}
	} else if (message.type === 'focus-editor') {
		console.log('Focusing editor:', message);
		const field = activeFields.get(message.connectionId);
		if (field) {
			field.bringEditorToFront();
			sendResponse(true);
		} else {
			sendResponse(false);
		}
	}
	return true; // 保持消息通道开放
});
