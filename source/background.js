import addDomainPermissionToggle from 'webext-permission-toggle';
import oneEvent from 'one-event';
import optionsStorage from './options-storage.js';

const browser = globalThis.browser ?? globalThis.chrome;

const browserAction = browser.action ?? browser.browserAction;

// Firefox hates iframes on activeTab
// https://bugzilla.mozilla.org/show_bug.cgi?id=1653408
// https://github.com/fregante/GhostText/pull/285
if (navigator.userAgent.includes('Firefox/')) {
	// eslint-disable-next-line unicorn/prefer-top-level-await -- I specifically want to not stop the extension in case of errors
	(async () => {
		addDomainPermissionToggle({
			title: 'Grant access to iframes',
		});
	})();
}

function stopGT(tab) {
	browser.scripting.executeScript({
		target: {tabId: tab.id},
		func: () => stopGT(),
	});
}

async function handleAction({id}) {
	const defaultTarget = {
		target: {tabId: id, allFrames: true},
	};
	const defaults = {
		...defaultTarget,
		injectImmediately: true,
	};

	const [topFrame] = await browser.scripting.executeScript({
		...defaults,
		func: () => typeof window.startGT === 'function',
	});

	const alreadyInjected = topFrame.result;

	if (!alreadyInjected) {
		try {
			await Promise.all([
				browser.scripting.insertCSS({...defaultTarget, files: ['/ghost-text.css']}),
				browser.scripting.executeScript({...defaults, files: ['/ghost-text.js']}),
			]);
		} catch (error) {
			console.error(error);
		}
	}

	await browser.scripting.executeScript({...defaults, func: () => startGT()});
}

function handlePortListenerErrors(listener) {
	return async port => {
		try {
			await listener(port);
		} catch (error) {
			let {message} = error;
			console.log({message});
			if ([
				'Failed to fetch',
				'Load failed', // Safari
				'NetworkError when attempting to fetch resource.',
				'Could not connect to the server.',
			].includes(message)) {
				message = 'Unable to connect to the editor. <a href="https://ghosttext.fregante.com/troubleshooting/#unable-to-connect">Need help?</a>';
			}

			port.postMessage({error: message});
		}
	};
}

browser.runtime.onConnect.addListener(handlePortListenerErrors(async port => {
	console.assert(port.name === 'new-field');
	const options = await optionsStorage.getAll();
	const response = await fetch(`http://localhost:${options.serverPort}`);
	const {ProtocolVersion, WebSocketPort} = await response.json();
	if (ProtocolVersion !== 1) {
		throw new Error('Incompatible protocol version');
	}

	console.log('will open socket');
	const socket = new WebSocket('ws://localhost:' + WebSocketPort);
	await Promise.race([
		oneEvent(socket, 'open'),
		oneEvent(socket, 'error'),
	]);

	const onSocketClose = () => port.postMessage({close: true});
	socket.addEventListener('close', onSocketClose);
	socket.addEventListener('message', event => port.postMessage({message: event.data}));
	socket.addEventListener('error', event => console.error('error!', event));

	port.onMessage.addListener(message => {
		console.log('got message from script', message);
		socket.send(message);
	});
	port.onDisconnect.addListener(() => {
		socket.removeEventListener('close', onSocketClose);
		socket.close();
	});
	port.postMessage({ready: true});
}));

function handleMessages({code, count}, {tab}) {
	if (code === 'connection-count') {
		let text = '';
		if (count === 1) {
			text = '✓';
		} else if (count > 1) {
			text = String(count);
		}

		browserAction.setBadgeText({
			text,
			tabId: tab.id,
		});
	} else if (code === 'focus-tab') {
		browser.tabs.update(tab.id, {active: true});
		browser.windows.update(tab.windowId, {focused: true});
	}
}

// Temporary code from https://github.com/fregante/GhostText/pull/267
async function saveShortcut() {
	const storage = await browser.storage.local.get('shortcut');
	if (storage.shortcut) {
		// Already saved
		return;
	}

	const shortcuts = await browser.commands.getAll();
	for (const item of shortcuts) {
		if (item.shortcut) {
			// eslint-disable-next-line no-await-in-loop -- Intentional
			await browser.storage.local.set({shortcut: item.shortcut});
			return;
		}
	}
}

async function getActiveTab() {
	const [activeTab] = await browser.tabs.query({active: true, currentWindow: true});
	return activeTab;
}

function init() {
	browserAction.onClicked.addListener(handleAction);
	browser.runtime.onMessage.addListener(handleMessages);
	browser.contextMenus.create({
		id: 'stop-gt',
		title: 'Disconnect GhostText on this page',
		contexts: ['action'],
	});
	browser.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
		if (menuItemId === 'stop-gt') {
			stopGT(tab);
		} else if (menuItemId === 'start-gt-editable') {
			handleAction(tab);
		}
	});
	browser.commands.onCommand.addListener(async (command, tab = getActiveTab()) => {
		if (command === 'open') {
			handleAction(await tab);
		} else if (command === 'close') {
			stopGT(await tab);
		}
	});

	browser.contextMenus.create({
		id: 'start-gt-editable',
		title: 'Activate GhostText on field',
		contexts: ['editable'],
	});

	browserAction.setBadgeBackgroundColor({
		color: '#008040',
	});

	browser.runtime.onInstalled.addListener(async ({reason}) => {
		// Only notify on install
		if (reason === 'install') {
			const {installType} = await browser.management.getSelf();
			if (installType === 'development') {
				return;
			}

			await browser.tabs.create({
				url: 'https://ghosttext.fregante.com/welcome/',
				active: true,
			});
		}
	});

	saveShortcut();
}

init();
