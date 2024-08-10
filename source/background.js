import addDomainPermissionToggle from 'webext-permission-toggle';
import oneEvent from 'one-event';
import optionsStorage from './options-storage.js';

const browser = globalThis.chrome ?? globalThis.chrome;

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
	chrome.scripting.executeScript({
		target: {tabId: tab.id},
		func: () => stopGT(),
	});
}

async function handleAction({id}) {
	const frames = await chrome.scripting.executeScript({
		target: {tabId: id, allFrames: true},
		injectImmediately: true,
		// eslint-disable-next-line object-shorthand -- Chrome hates it
		func: () => {
			try {
				// eslint-disable-next-line no-undef -- Different context
				startGT();
				return true;
			} catch {
				return false;
			}
		},
	});

	const virginFrames = frames.filter(({result}) => !result).map(({frameId}) => frameId);

	if (virginFrames.length === 0) {
		return;
	}

	// Firefox won't resolve this Promise, so don't await it
	chrome.scripting.insertCSS({
		files: ['/ghost-text.css'],
		target: {tabId: id, frameIds: virginFrames},
	});

	chrome.scripting.executeScript({
		files: ['/ghost-text.js'],
		target: {tabId: id, frameIds: virginFrames},
		injectImmediately: true,
	});

	chrome.scripting.executeScript({
		files: ['/advanced-editors-messenger.js'],
		target: {tabId: id, frameIds: virginFrames},
		world: 'MAIN',
		injectImmediately: true,
	});
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

chrome.runtime.onConnect.addListener(handlePortListenerErrors(async port => {
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

	const onSocketClose = () => {
		port.postMessage({close: true});
	};

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

// https://github.com/fregante/GhostText/pull/324
chrome.runtime.onMessage.addListener(() => {
	// What is my purpose?
	// You pass the butter.
	// Oh my god.
	// Yeah, welcome to the club, pal.
});

function handleMessages({code, count}, {tab}) {
	if (code === 'connection-count') {
		let text = '';
		if (count === 1) {
			text = '✓';
		} else if (count > 1) {
			text = String(count);
		}

		chrome.action.setBadgeText({
			text,
			tabId: tab.id,
		});
	} else if (code === 'focus-tab') {
		chrome.tabs.update(tab.id, {active: true});
		chrome.windows.update(tab.windowId, {focused: true});
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
	chrome.action.onClicked.addListener(handleAction);
	chrome.runtime.onMessage.addListener(handleMessages);
	chrome.contextMenus.create({
		id: 'stop-gt',
		title: 'Disconnect GhostText on this page',
		contexts: ['action'],
	});
	chrome.contextMenus.create({
		id: 'start-gt-editable',
		title: 'Activate GhostText on field',
		contexts: ['editable'],
	});
	chrome.contextMenus.onClicked.addListener(({menuItemId}, tab) => {
		if (menuItemId === 'stop-gt') {
			stopGT(tab);
		} else if (menuItemId === 'start-gt-editable') {
			handleAction(tab);
		}
	});

	chrome.commands.onCommand.addListener(async (command, tab = getActiveTab()) => {
		if (command === 'open') {
			handleAction(await tab);
		} else if (command === 'close') {
			stopGT(await tab);
		}
	});

	chrome.action.setBadgeBackgroundColor({
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
