class GhostTextField {
	constructor(field) {
		this.field = field;
		this.init();
		this.send = this.send.bind(this);
		this.receive = this.receive.bind(this);
		this.destroy = this.destroy.bind(this);
	}

	async init() {
		const response = await fetch('http://localhost:4001');
		const {ProtocolVersion, WebSocketPort} = await response.json();
		if (ProtocolVersion !== 1) {
			throw new Error('Incompatible protocol version');
		}
		console.log('will open socket')
		this.socket = new WebSocket('ws://localhost:' + WebSocketPort);

		await oneEvent.promise(this.socket, 'open');
		console.log('socket open')

		this.socket.addEventListener('close', this.destroy);
		this.socket.addEventListener('error', event => console.error('error!', event));
		this.socket.addEventListener('message', this.receive);
		this.field.addEventListener('input', this.send);
		this.field.classList.add('GT-field', 'GT-field--enabled');

		// Send first value to init tab
		this.send();
		chrome.runtime.sendMessage({code: 'connection-opened'});
	}

	send() {
		this.socket.send(JSON.stringify({
			title: document.title, // TODO: move to first fetch
			url: location.host, // TODO: move to first fetch
			syntax: '', // TODO: move to first fetch
			text: this.field.value,
			selections: [
				{
					start: this.field.selectionStart,
					end: this.field.selectionEnd
				}
			]
		}))
	}

	receive(event) {
		const {
			text,
			selections
		} = JSON.parse(event.data);
		this.field.value = text;
		this.field.selectionStart = selections[0].start;
		this.field.selectionEnd = selections[0].end;
	}

	destroy() {
		console.log('Disabling field');
		this.socket.close();
		this.field.removeEventListener('input', this.send);
		this.field.classList.remove('GT-field--enabled');
		chrome.runtime.sendMessage({code: 'connection-closed'});
	}
}

async function startGT() {
	const focused = document.querySelector('textarea:focus');
	const fields = document.querySelectorAll('textarea');
	console.info(fields.length + ' fields found');
	if (fields.length === 0) {
		alert('No supported fields found!');
	} else if (focused || fields.length === 1) {
		new GhostTextField(focused || fields[0]);
	} else {
		const focusThis = event => {
			for (const field of fields) {
				field.removeEventListener('focus', focusThis);
			}
			new GhostTextField(event.target);
		};
		for (const field of fields) {
			field.addEventListener('focus', focusThis);
		}
	}
}
