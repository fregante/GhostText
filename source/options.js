import optionsStorage from './options-storage.js';

optionsStorage.syncForm(document.querySelector('form'));

if (location.protocol.startsWith('moz-')) {
	document.documentElement.classList.add('firefox');
} else if (location.protocol.startsWith('chrome-')) {
	document.documentElement.classList.add('chrome');
}
