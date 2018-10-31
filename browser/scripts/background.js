function inCurrentTab(callback) {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, tabs => callback(tabs[0]));
}
function handleClose(info, tab) {
	chrome.tabs.executeScript(tab.id, {
		code: 'stopGT()'
	});
}

async function handleAction(tab) {
	await window.DCS.addToTab(tab, {
		/* eslint-disable camelcase */
		run_at: 'document_start',
		all_frames: true,
		css: [
			'vendor/humane-ghosttext.css',
			'scripts/content.css'
		],
		js: [
			'vendor/webext-dynamic-content-scripts.js',
			'vendor/humane-ghosttext.min.js',
			'vendor/one-event.browser.js',
			'scripts/content.js'
		]
	});

	chrome.tabs.executeScript(tab.id, {
		code: 'startGT()',
		allFrames: true
	});
}

function handleMessages({code, count}, {tab}) {
	if (code === 'connection-count') {
		let text = '';
		if (count === 1) {
			text = /OS X/i.test(navigator.userAgent) ? '✓' : 'ON';
		} else if (count > 1) {
			text = String(count);
		}
		chrome.browserAction.setBadgeText({
			text,
			tabId: tab.id
		});
	}
}

function init() {
	chrome.browserAction.onClicked.addListener(handleAction);
	chrome.runtime.onMessage.addListener(handleMessages);
	chrome.contextMenus.create({
		id: 'stop-gt',
		title: 'Disconnect GhostText on this page',
		contexts: ['browser_action'],
		onclick: handleClose
	});
	chrome.commands.onCommand.addListener(command => {
		if (command === 'open') {
			inCurrentTab(handleAction);
		}
	});

	chrome.browserAction.setBadgeBackgroundColor({
		color: '#008040'
	});

	/* globals OptionsSync */
	new OptionsSync().define({
		defaults: {
			serverPort: 4001
		}
	});
}

init();
