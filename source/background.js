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
	injectScripts().then(
		() => {
			chrome.scripting.executeScript({
				target: {tabId: tab.id},
				func: () => stopGT(),
			});
		}
	);
}

function startGT({id}) {
	injectScripts().then(
		() => {
			chrome.scripting.executeScript({
				target: {tabId: id},
				func: () => startGT(),
			});
		}
	);
}

// this function is used to inject scripts into the tab
// not all iframe are injected, so we need to run it periodically
async function injectScripts() {
	console.log('injecting scripts!');
	const tab = await getActiveTab();
	const tabId = tab.id;
	const frames = await chrome.scripting.executeScript({
		target: {tabId, allFrames: true},
		injectImmediately: true,
		func: () => {
			// if the script is already injected, it will return true
			try {
				dummy();
				return true;
			} catch {
				return false;
			}
		},
	});

	const virginFrames = frames.filter(({result}) => !result).map(({frameId}) => frameId);

	console.log(`Get ${virginFrames.length} virgin frames`);

	if (virginFrames.length === 0) {
		return;
	}

	// Firefox won't resolve this Promise, so don't await it
	await chrome.scripting.insertCSS({
		files: ['/ghost-text.css'],
		target: {tabId, frameIds: virginFrames},
	});

	await chrome.scripting.executeScript({
		files: ['/ghost-text.js'],
		target: {tabId, frameIds: virginFrames},
		injectImmediately: true,
	});

	await chrome.scripting.executeScript({
		files: ['/advanced-editors-messenger.js'],
		target: {tabId, frameIds: virginFrames},
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

	const connectionId = Date.now().toString();

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
	port.postMessage({ready: true, connectionId});
}));

// 获取目标标签页
function getTargetTab(sender) {
	if (sender.tab) {
		return Promise.resolve(sender.tab);
	}
	return chrome.tabs.query({active: true, currentWindow: true})
		.then(tabs => tabs[0]);
}

// 执行页面脚本
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.code === 'disconnect-connection') {
		getTargetTab(sender).then(targetTab => {
			if (!targetTab) {
				sendResponse({success: false, error: 'No target tab found'});
				return;
			}

			// 通知页面停用特定连接
			chrome.tabs.sendMessage(targetTab.id, {
				type: 'disconnect',
				connectionId: message.connectionId
			}, response => {
				if (chrome.runtime.lastError) {
					console.error('Error sending disconnect message:', chrome.runtime.lastError);
					sendResponse({success: false, error: chrome.runtime.lastError.message});
					return;
				}
				sendResponse({success: true});
			});
		});
		return true;
	} else if (message.code === 'get-connections') {
		getTargetTab(sender).then(targetTab => {
			if (!targetTab) {
				sendResponse({connections: []});
				return;
			}

			// 从 content script 获取连接信息
			chrome.tabs.sendMessage(targetTab.id, {
				type: 'get-connections'
			}, response => {
				if (chrome.runtime.lastError) {
					console.error('Error getting connections:', chrome.runtime.lastError);
					sendResponse({connections: []});
					return;
				}
				console.log('Received connections from content script:', response);
				sendResponse({connections: response || []});
			});
		});
		return true;
	} else if (message.code === 'focus-fields') {
		getTargetTab(sender).then(targetTab => {
			if (!targetTab) {
				sendResponse({success: false, error: 'No target tab found'});
				return;
			}
			// 从 content script 获取连接信息
			chrome.tabs.sendMessage(targetTab.id, {
				type: 'focus-fields',
				connectionId: message.connectionId
			}, response => {
				if (chrome.runtime.lastError) {
					console.error('Error getting connections:', chrome.runtime.lastError);
					sendResponse({success: false, error: chrome.runtime.lastError.message});
					return;
				}
				console.log('Received focus-fields from content script:', response);
				sendResponse({success: true});
			});
		});
		return true;
	} else if (message.code === 'focus-editor') {
		getTargetTab(sender).then(targetTab => {
			if (!targetTab) {
				sendResponse({success: false, error: 'No target tab found'});
				return;
			}
			// 从 content script 获取连接信息
			chrome.tabs.sendMessage(targetTab.id, {
				type: 'focus-editor',
				connectionId: message.connectionId
			}, response => {
				if (chrome.runtime.lastError) {
					console.error('Error getting connections:', chrome.runtime.lastError);
					sendResponse({success: false, error: chrome.runtime.lastError.message});
					return;
				}
				console.log('Received focus-editor from content script:', response);
				sendResponse({success: true});
			});
		});
		return true;
	} else if (message.code === 'handle-action') {
		startGT({id: message.id});
		return true;
	} else if (message.code === 'connection-count') {
		// 更新图标上的连接数
		chrome.action.setBadgeText({
			text: message.count > 0 ? String(message.count) : '',
			tabId: sender.tab.id
		});
		return true;
	}
});

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

async function toggleField(tab) {
	if (!tab) return;

	await injectScripts();
	// 获取当前聚焦的 field 状态
	const [result] = await chrome.scripting.executeScript({
		target: {tabId: tab.id},
		func: () => getFocusedFieldStatus()
	});
	if (!result.result.isExists) {
		return;
	}
	if (result.result.isActive) {
		stopGT(tab);
	} else {
		startGT(tab);
	}
}

function init() {
	chrome.action.onClicked.addListener(startGT);
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
			startGT(tab);
		}
	});

	chrome.commands.onCommand.addListener(async (command, tab = getActiveTab()) => {
		if (command === 'open') {
			startGT(await tab);
		} else if (command === 'close') {
			stopGT(await tab);
		} else if (command === 'toggle') {
			toggleField(await tab);
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

(() => {
  let ws = new WebSocket('ws://127.0.0.1:8000/.devd.livereload');
  ws.onmessage = () => {
    // reload current tab with some delay
    // require permissions in manifest
    // chrome.tabs.executeScript(null, {
    //   code: 'setTimeout(function() { document.location.reload(); }, 200);'
    // });

    // reload extension
    chrome.runtime.reload();
  };
})();