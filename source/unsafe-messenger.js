/**
 * To access the CodeMirror's and Ace's instances, this code needs to be run
 * as "unsafe" code, bridging the extension's sandbox and the website's libraries.
 */

export default function unsafeMessenger() {
	document.body.addEventListener('gt:get', listener);

	function listener({target}) {
		if (target.CodeMirror) {
			codeMirror(target);
		} else if (target.classList.contains('monaco-editor')) {
			monacoEditor(target);
		} else {
			ace(target);
		}
	}

	function sendBack(target, value) {
		target.dispatchEvent(new CustomEvent('gt:input', {detail: {value}}));
	}

	function throttle(interval, callback) {
		let timer;
		return (...args) => {
			if (!timer) {
				timer = setTimeout(() => {
					timer = false;
					callback(...args);
				}, interval);
			}
		};
	}

	function codeMirror(target) {
		const editor = target.CodeMirror;

		sendBack(target, editor.getValue());

		editor.on(
			'changes',
			throttle(50, (instance, [{origin}]) => {
				if (origin !== 'setValue') {
					sendBack(target, editor.getValue());
				}
			}),
		);
		target.addEventListener('gt:transfer', () => {
			editor.setValue(target.getAttribute('gt-value'));
		});
	}

	function ace(target) {
		const {editor} = target.env;
		const {session} = editor;
		const isUserChange = () => editor.curOp && editor.curOp.command.name;

		sendBack(target, session.getValue());

		const throttledSend = throttle(50, sendBack); // `isUserChange` needs to be run synchronously, unlike codeMirror's
		session.on('change', () => {
			if (isUserChange()) {
				throttledSend(target, session.getValue());
			}
		});
		target.addEventListener('gt:transfer', () => {
			if (!isUserChange()) {
				session.setValue(target.getAttribute('gt-value'));
			}
		});
	}

	function monacoEditor(target) {
		const editor = globalThis.monaco.editor.getModel(target.dataset.uri);
		sendBack(target, editor.getValue());

		editor.onDidChangeContent(throttle(50, event => {
			if (!event.isFlush) { // Flush === setValue
				sendBack(target, editor.getValue());
			}
		}));

		target.addEventListener('gt:transfer', () => {
			editor.setValue(target.getAttribute('gt-value'));
		});
	}
}

// eslint-disable-next-line no-unused-expressions
undefined; // Avoids issues with tabs.injectScript
