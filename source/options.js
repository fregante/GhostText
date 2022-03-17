import(chrome.runtime.getURL('shared.js')).then(({OptionsSync}) => {
	new OptionsSync().syncForm(document.querySelector('form'));
});

