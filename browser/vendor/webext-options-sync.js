// https://github.com/bfred-it/webext-options-sync

class OptionsSync {
	constructor(storageName = 'options') {
		this.storageName = storageName;
	}

	define(defs) {
		defs = Object.assign({
			defaults: {},
			migrations: [],
		}, defs);

		if (chrome.runtime.onInstalled) { // In background script
			chrome.runtime.onInstalled.addListener(() => this._applyDefinition(defs));
		} else { // In content script, discouraged
			this._applyDefinition(defs);
		}
	}

	async _applyDefinition(defs) {
		const options = await this.getAll();

		console.info('Existing options:', options);
		if (defs.migrations.length > 0) {
			console.info('Running', defs.migrations.length, 'migrations');
			defs.migrations.forEach(migrate => migrate(options, defs.defaults));
		}

		const newOptions = Object.assign(defs.defaults, options);
		this.setAll(newOptions);
	}

	_parseNumbers(options) {
		for (const name of Object.keys(options)) {
			if (options[name] === String(Number(options[name]))) {
				options[name] = Number(options[name]);
			}
		}
		return options;
	}

	getAll() {
		return new Promise(resolve => {
			chrome.storage.sync.get(this.storageName,
				keys => resolve(keys[this.storageName] || {})
			);
		}).then(this._parseNumbers);
	}

	setAll(newOptions) {
		return new Promise(resolve => {
			chrome.storage.sync.set({
				[this.storageName]: newOptions,
			}, resolve);
		});
	}

	async set(newOptions) {
		const options = await this.getAll();
		this.setAll(Object.assign(options, newOptions));
	}

	syncForm(form) {
		if (typeof form === 'string') {
			form = document.querySelector(form);
		}
		this.getAll().then(options => OptionsSync._applyToForm(options, form));
		form.addEventListener('input', e => this._handleFormUpdates(e));
		form.addEventListener('change', e => this._handleFormUpdates(e));
	}

	static _applyToForm(options, form) {
		for (const name of Object.keys(options)) {
			const els = form.querySelectorAll(`[name="${name}"]`);
			const [field] = els;
			if (field) {
				console.info('Set option', name, 'to', options[name]);
				switch (field.type) {
					case 'checkbox':
						field.checked = options[name];
						break;
					case 'radio': {
						const [selected] = [...els].filter(el => el.value === options[name]);
						if (selected) {
							selected.checked = true;
						}
						break;
					}
					default:
						field.value = options[name];
						break;
				}
			} else {
				console.warn('Stored option {', name, ':', options[name], '} was not found on the page');
			}
		}
	}

	_handleFormUpdates({target: el}) {
		const name = el.name;
		let value = el.value;
		if (!name || !el.validity.valid) {
			return;
		}
		switch (el.type) {
			case 'select-one':
				value = el.options[el.selectedIndex].value;
				break;
			case 'checkbox':
				value = el.checked;
				break;
			default: break;
		}
		console.info('Saving option', el.name, 'to', value);
		this.set({
			[name]: value,
		});
	}
}

OptionsSync.migrations = {
	removeUnused(options, defaults) {
		for (const key of Object.keys(options)) {
			if (!(key in defaults)) {
				delete options[key];
			}
		}
	}
};

if (typeof module === 'object') {
	module.exports = OptionsSync;
}
