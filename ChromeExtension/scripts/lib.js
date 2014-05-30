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
        var textareaDom = $(textarea).get(0);

        try {
            var webSocket = new WebSocket('ws://localhost:' + SublimeTextArea.serverPort());    
        } catch (e) {
            that.errorHandler(e);
            return;
        }

        webSocket.onopen = function () {
            webSocket.send(that.textChange(title, textarea));
        };
        
        webSocket.onerror = function (event) {
            if (that.errorHandler(event)) {
	            textarea.off('.sta');
	            console.error('SublimeTexArea: detached from TextArea');
            }
        };

        webSocket.onmessage = function (event) {
            var response = JSON.parse(event.data);
            textarea.val(response.text);

            textareaDom.selectionStart = response.cursor.min;
            textareaDom.selectionEnd = response.cursor.max;
            textareaDom.focus();
        };

        textarea.on('input.sta propertychange.sta onmouseup.sta', function() {
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
    },
    errorHandler: function (e) {
        if(e && e.target && e.target.readyState === 3) {
            alert('Connection error. Make sure that Sublime Text is open and has SublimeTextArea installed. Try closing and opening it and try again. See if there are any errors in Sublime Text\'s console');   
            return true;//the error was handled
        } else if(e.name && e.name === "SecurityError") {
            if(confirm('SublimeTextArea doesn\'t work on HTTPS pages in some versions of Chrome. Click OK to see how you can fix this.')){
                window.open('https://github.com/Cacodaimon/SublimeTextArea/issues/5#issuecomment-44571987');
            }
            return true;//the error was handled
        }
    },
};
