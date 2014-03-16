chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (!request.textarea || request.textarea != 'connect') {
        return;
    }

    sendResponse({textarea: 'connecting'});

    $("textarea").focus(function () {
        var textArea = $(this);
        textArea.unbind("focus");
        SublimeTextArea.connectTextarea($(this), $('title').text());
    });
});
