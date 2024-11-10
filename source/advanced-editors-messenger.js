/**
 * To access the CodeMirror's and Ace's instances, this code needs to be run
 * as "unsafe" code, bridging the extension's sandbox and the website's libraries.
 */

/**
 * @typedef { import('@codemirror/view').EditorView } EditorView
 */

function unsafeMessenger() {
	const lastKnownValue = new WeakMap();
	document.body.addEventListener('gt:get', listener);

	function listener({target}) {
		if (target.cmView) {
			codeMirror6(target);
		} else if (target.CodeMirror) {
			codeMirror5(target);
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
		return (...arguments_) => {
			timer ||= setTimeout(() => {
				timer = false;
				callback(...arguments_);
			}, interval);
		};
	}

	function codeMirror6(target) {
		const controller = new AbortController();
		const {signal} = controller;

		/** @type {{view: EditorView}}} */
		const {view} = target.cmView;
		const fieldValue = view.state.doc.toString();
		lastKnownValue.set(target, fieldValue);
		sendBack(target, fieldValue);

		const interval = setInterval(() => {
			const fieldValue = view.state.doc.toString();
			if (lastKnownValue.get(target) !== fieldValue) {
				lastKnownValue.set(target, fieldValue);
				console.log('Field was updated, sending value to editor');
				sendBack(target, view.state.doc.toString());
			}
		}, 500);

		target.addEventListener('gt:transfer', () => {
			const receivedFromEditor = target.getAttribute('gt-value');
			lastKnownValue.set(target, receivedFromEditor);
			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: receivedFromEditor,
				},
			});
		}, {signal});

		// target.addEventListener('gt:kill', () => {
		// 	controller.abort();
		// 	clearInterval(interval);
		// }, {signal});
	}

	function codeMirror5(target) {
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

unsafeMessenger();

console.log('Advanced editors messenger ready');
