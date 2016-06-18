$(document).ready(function () {
    /**
     * @type {jQuery}
     */
    var serverPortInput = $('#server-port');

    /**
     * @type {jQuery}
     */
    var optionsFormSaveBtn = $('#options-form-save-btn');

    serverPortInput.val(GhostText.serverPort());

    $('#options-form').submit(function () {
        /**
         * @type {number}
         */
        var serverPort = serverPortInput.val();
        GhostText.serverPort(serverPort);

        optionsFormSaveBtn.attr('disabled', true);
        return false;
    });

    serverPortInput.change(function () {
        optionsFormSaveBtn.attr('disabled', false);
    });

    $('#ghost-text-version').text(chrome.runtime.getManifest().version);
});