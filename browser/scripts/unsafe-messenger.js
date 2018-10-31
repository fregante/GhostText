/**
 * To access the CodeMirror's and Ace's instances, this code needs to be run
 * as "unsafe" code, bridging the extension's sandbox and the website's libraries.
 *
 * ACE and CodeMirror's implementation vary oh-so-slightly and
 * it's not worth deduplicating the following code
 */

document.addEventListener('ghost-text:codemirror:unsafesetup', event => {
	const editor = event.target.CodeMirror;

	// Pass messenger to contentScript
	const messenger = document.createElement('textarea');
	messenger.value = editor.getValue();
	document.body.append(messenger);
	messenger.dispatchEvent(new CustomEvent('ghost-text:codemirror:safesetup', {
		bubbles: true
	}));
	messenger.remove();

	// Listen to changes
	editor.on('changes', (instance, [{origin}]) => {
		if (origin !== 'setValue') {
			messenger.value = editor.getValue();
			messenger.dispatchEvent(new InputEvent('input-from-browser'));
		}
	});
	messenger.addEventListener('input-from-editor', () => {
		editor.setValue(messenger.value);
	});
});

document.addEventListener('ghost-text:ace:unsafesetup', event => {
	const {editor} = event.target.parentNode.env;
	const {session} = editor;
	const isUserChange = () => editor.curOp && editor.curOp.command.name;

	// Pass messenger to contentScript
	const messenger = document.createElement('textarea');
	messenger.value = session.getValue();
	document.body.append(messenger);
	messenger.dispatchEvent(new CustomEvent('ghost-text:ace:safesetup', {
		bubbles: true
	}));
	messenger.remove();

	// Listen to changes
	session.on('change', () => {
		if (isUserChange()) {
			messenger.value = session.getValue();
			messenger.dispatchEvent(new InputEvent('input-from-browser'));
		}
	});
	messenger.addEventListener('input-from-editor', () => {
		if (!isUserChange()) {
			session.setValue(messenger.value);
		}
	});
});
