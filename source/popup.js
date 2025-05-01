// 获取当前活动连接
function updateConnectionsList() {
    const list = document.getElementById('connections-list');
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
            const item = document.createElement('div');
            item.className = 'connection-item';

            const title = document.createElement('span');
            title.className = 'connection-title';
            title.textContent = connection.title || 'Untitled';

            const url = document.createElement('span');
            url.className = 'connection-url';
            url.textContent = connection.url;

            const disconnectBtn = document.createElement('button');
            disconnectBtn.className = 'disconnect-btn';
            disconnectBtn.textContent = 'Disconnect';
            disconnectBtn.onclick = () => {
                chrome.runtime.sendMessage({
                    code: 'disconnect-connection',
                    connectionId: connection.id
                }, () => {
                    // 断开连接后立即更新列表
                    updateConnectionsList();
                });
            };

            item.appendChild(title);
            item.appendChild(url);
            item.appendChild(disconnectBtn);
            list.appendChild(item);
        });
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    updateConnectionsList();
    // 每秒更新一次连接列表
    setInterval(updateConnectionsList, 1000);

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