import OptionsSync from 'webext-options-sync';

const optionsStorage = new OptionsSync({
	defaults: {
		serverPort: 4001,
		notifyOnConnect: true,
	},
});

export default optionsStorage;
