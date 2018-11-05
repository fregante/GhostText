/**
 * To access the CodeMirror's and Ace's instances, this code needs to be run
 * as "unsafe" code, bridging the extension's sandbox and the website's libraries.
 */

window.unsafeMessenger = function () {
	document.body.addEventListener('gt:get', listener);

	function listener({target}) {
		if (target.CodeMirror) {
			codeMirror(target);
		} else {
			ace(target);
		}
	}

	function sendBack(target, value) {
		target.dispatchEvent(
			new CustomEvent('gt:input', {detail: {value}})
		);
	}

	function debounce(wait, callback) {
		return function t(...args) {
			clearTimeout(t.id);
			t.id = setTimeout(callback, wait, ...args);
		};
	}

	function codeMirror(target) {
		const editor = target.CodeMirror;

		sendBack(target, editor.getValue());

		editor.on('changes', debounce(50, (instance, [{origin}]) => {
			if (origin !== 'setValue') {
				sendBack(target, editor.getValue());
			}
		}));
		target.addEventListener('gt:transfer', event => {
			editor.setValue(event.detail.value);
		});
		target.addEventListener('gt:blur', () => {
			editor.getInputField().blur();
		});
	}

	function ace(target) {
		const {editor} = target.env;
		const {session} = editor;
		const isUserChange = () => editor.curOp && editor.curOp.command.name;

		sendBack(target, session.getValue());

		const debouncedSend = debounce(50, sendBack); // `isUserChange` needs to be run synchronously, unlike codeMirror's
		session.on('change', () => {
			if (isUserChange()) {
				debouncedSend(target, session.getValue());
			}
		});
		target.addEventListener('gt:transfer', event => {
			if (!isUserChange()) {
				session.setValue(event.detail.value);
			}
		});
		target.addEventListener('gt:blur', () => {
			editor.blur();
		});
	}
};
