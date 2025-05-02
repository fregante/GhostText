// 获取当前活动连接
function updateConnectionsList() {
    const list = document.getElementById('connections');
    if (!list) {
        console.error('Connections list element not found');
        return;
    }
    
    list.innerHTML = '';

    chrome.runtime.sendMessage({code: 'get-connections'}, response => {
        if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            setTimeout(updateConnectionsList, 1000);
            return;
        }

        console.log('Received connections:', response);

        if (!response || !response.connections || response.connections.length === 0) {
            const noConnections = document.createElement('p');
            noConnections.className = 'no-connections';
            noConnections.textContent = 'No active connections';
            list.appendChild(noConnections);
            return;
        }

        response.connections.forEach(connection => {
            const item = createConnectionElement(connection);
            list.appendChild(item);
        });
    });
}

function createConnectionElement(connection) {
	const div = document.createElement('div');
	div.className = 'connection';
	div.innerHTML = `
		<div class="connection-index">#${connection.index}</div>
		<div class="connection-info">
			<div class="connection-title">${connection.title}</div>
			<div class="connection-url">${connection.url}</div>
		</div>
		<div class="connection-actions">
			<button title="Focus Field">
				<svg viewBox="0 0 24 24" width="16" height="16">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
				</svg>
			</button>
			<button title="Focus Editor">
				<svg viewBox="0 0 24 24" width="16" height="16">
					<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
				</svg>
			</button>
			<button title="Disconnect">
				<svg viewBox="0 0 24 24" width="16" height="16">
					<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
				</svg>
			</button>
		</div>
	`;

	const focusFieldButton = div.querySelector('button[title="Focus Field"]');
	const focusEditorButton = div.querySelector('button[title="Focus Editor"]');
	const disconnectButton = div.querySelector('button[title="Disconnect"]');

	focusFieldButton.addEventListener('click', () => {
		chrome.runtime.sendMessage({
			code: 'focus-fields',
			connectionId: connection.id
		}, () => {
            window.close();
        });
	});

	focusEditorButton.addEventListener('click', () => {
		chrome.runtime.sendMessage({
			code: 'focus-editor',
			connectionId: connection.id
		}, () => {
            window.close();
        });
	});

	disconnectButton.addEventListener('click', () => {
		chrome.runtime.sendMessage({
			code: 'disconnect-connection',
			connectionId: connection.id
		}, () => {
			// 断开连接后立即更新列表
			updateConnectionsList();
		});
	});

	return div;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    updateConnectionsList();


    // 新连接按钮
    document.getElementById('new-connection').addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.runtime.sendMessage({
                code: 'handle-action',
                id: tabs[0].id
            });
            window.close();
        });
    });
}); 