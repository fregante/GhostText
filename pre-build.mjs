// Parcel changes names unless they're in web_accessible_resources
// `npm run build` creates additional files with hashed names
// Xcode can't handle dynamically-created filenames, so we need to keep this list here

import {readdir} from 'node:fs/promises';
import DotJson from 'dot-json';

const list = await readdir('./source', {withFileTypes: true});
const excludes = new Set([
	'options.css', // Inlined, but only if excluded
	'advanced-editors-messenger.js', // Inlined
	'manifest.json', // Not necessary
]);
const resources = [];
for (const item of list) {
	if (excludes.has(item.name)) {
		continue;
	}

	if (item.isDirectory()) {
		resources.push(item.name + '/*');
	} else {
		resources.push(item.name);
	}
}

const manifest = new DotJson('source/manifest.json');
manifest.set('web_accessible_resources', resources);
manifest.save();
