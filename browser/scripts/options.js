/**
 * @type {Element}
 */
var serverPortInput = document.getElementById('server-port');

/**
 * @type {number}
 */
var initialServerPort = GhostText.serverPort();

if (initialServerPort !== serverPortInput.placeholder) {
    serverPortInput.value = initialServerPort;
}

serverPortInput.addEventListener('input', function () {
    GhostText.serverPort(serverPortInput.value || 4001);
});

document.getElementById('ghost-text-version').textContent = chrome.runtime.getManifest().version;