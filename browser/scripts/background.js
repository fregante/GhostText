function inCurrentTab(callback) {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, tabs => callback(tabs[0]));
}

async function start(tab) {
	await window.DCS.addToTab(tab, {
		run_at: 'document_start',
		all_frames: true,
		css: [
			'vendor/humane-ghosttext.css'
		],
		js: [
			'vendor/webext-dynamic-content-scripts.js',
			'vendor/humane-ghosttext.min.js',
			'vendor/one-event.browser.js',
			'scripts/content.js'
		]
	});

	chrome.tabs.executeScript(tab.id, {
		code: 'startGT()'
	});
}

function init() {
	chrome.browserAction.onClicked.addListener(start);
	chrome.commands.onCommand.addListener(command => {
		if (command === 'toggle') {
			inCurrentTab(start);
		}
	});

	/* globals OptionsSync */
	new OptionsSync().define({
		defaults: {
			serverPort: 4001
		}
	});
}

init();
