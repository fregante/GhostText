// https://github.com/bfred-it/webext-dynamic-content-scripts
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.DCS = global.DCS || {})));
}(this, (function (exports) { 'use strict';

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var webextContentScriptPing = createCommonjsModule(function (module) {
// https://github.com/bfred-it/webext-content-script-ping

/**
 * Ping responder
 */
document.__webextContentScriptLoaded = true;

/**
 * Pinger
 */
function pingContentScript(tab) {
	return new Promise((resolve, reject) => {
		chrome.tabs.executeScript(tab.id || tab, {
			code: 'document.__webextContentScriptLoaded',
			runAt: 'document_start'
		}, hasScriptAlready => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(Boolean(hasScriptAlready[0]));
			}
		});
	});
}

if (typeof module === 'object') {
	module.exports = pingContentScript;
}
});

var pingContentScript = interopDefault(webextContentScriptPing);

async function p(fn, ...args) {
	return new Promise((resolve, reject) => fn(...args, r => {
		if (chrome.runtime.lastError) {
			reject(chrome.runtime.lastError);
		} else {
			resolve(r);
		}
	}));
}

async function addToTab(tab, contentScripts) {
	if (typeof tab !== 'object' && typeof tab !== 'number') {
		throw new TypeError('Specify a Tab or tabId');
	}

	if (!contentScripts) {
		// Get all scripts from manifest.json
		contentScripts = chrome.runtime.getManifest().content_scripts;
	} else if (!Array.isArray(contentScripts)) {
		// Single script object, make it an array
		contentScripts = [contentScripts];
	}

	try {
		const tabId = tab.id || tab;
		if (!await pingContentScript(tabId)) {
			const injections = [];
			for (const group of contentScripts) {
				const allFrames = group.all_frames;
				const runAt = group.run_at;
				for (const file of group.css) {
					injections.push(p(chrome.tabs.insertCSS, tabId, {file, allFrames, runAt}));
				}
				for (const file of group.js) {
					injections.push(p(chrome.tabs.executeScript, tabId, {file, allFrames, runAt}));
				}
			}
			return Promise.all(injections);
		}
	} catch (err) {
		// Probably the domain isn't permitted.
		// It's easier to catch this than do 2 queries
	}
}

function addToFutureTabs(scripts) {
	chrome.tabs.onUpdated.addListener((tabId, {status}) => {
		if (status === 'loading') {
			addToTab(tabId, scripts);
		}
	});
}

var index = {
	addToTab,
	addToFutureTabs
};

exports.addToTab = addToTab;
exports.addToFutureTabs = addToFutureTabs;
exports['default'] = index;

Object.defineProperty(exports, '__esModule', { value: true });

})));
