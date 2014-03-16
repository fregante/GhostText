$(document).ready(function () {
    $('#btn-options').click(function () {
        SublimeTextArea.openTab('options.html');
    });

    $('#btn-about').click(function () {
        SublimeTextArea.openTab('about.html');
    });

    $('#btn-connect').click(function () {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        },
        function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {textarea: 'connect'}, function(response) { });
        });
    });
});