$(document).ready(function () {
    var serverPortInput = $('#server-port');
    var optionsFormSaveBtn = $('#options-form-save-btn');

    serverPortInput.val(SublimeTextArea.serverPort());

    $('#options-form').submit(function () {
        var serverPort = serverPortInput.val();
        SublimeTextArea.serverPort(serverPort);

        optionsFormSaveBtn.attr('disabled', true)
        return false;
    });

    serverPortInput.change(function () {
        optionsFormSaveBtn.attr('disabled', false)
    });
});