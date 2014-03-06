var SublimeTextArea = {
    openTab: function (url) {
        var optionsUrl = chrome.extension.getURL(url);

        chrome.tabs.query({url: optionsUrl}, function(tabs) {
            if (tabs.length) {
                chrome.tabs.update(tabs[0].id, {active: true});
            } else {
                chrome.tabs.create({url: optionsUrl});
            }
        });
    },

    serverPort: function (port) {
        if (port == null) {
            return localStorage.getItem('server-port') || 1337;
        }

        localStorage.setItem('server-port', port);
    },

    connectTextarea: function (textarea, title) {
        var that = this;

        var webSocket = new WebSocket('ws://localhost:' + SublimeTextArea.serverPort());

        webSocket.onopen = function () {
            webSocket.send(that.textChange(title, textarea));
        };

        webSocket.onmessage = function (event) {
            console.log(event.data);
            var response = JSON.parse(event.data);
            textarea.val(response.text);
        };

        textarea.bind('input propertychange', function() {
            console.log(textarea.val());
            webSocket.send(that.textChange(title, textarea));
        });
    },

    textChange: function (title, textarea) {
        var textareaDom = $(this).get(0);

        return JSON.stringify({
                title:  title,
                text:   textarea.val(),
                cursor: {
                    start: textareaDom.selectionStart,
                    end: textareaDom.selectionEnd
                },
            });
    }
};