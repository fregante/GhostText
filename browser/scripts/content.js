'use strict';

/**
 * GhostText for Chrome content script.
 *
 * @licence The MIT License (MIT)
 * @author Guido Krömer <mail 64 cacodaemon 46 de>
 * @author Federico Brigante
 */
var GhostTextContent = {
    /**
     * This tab's ID
     *
     * @type {Number}
     */
    tabId: null,

    /**
     * @type {*}
     * @see https://developer.chrome.com/extensions/runtime#type-Port
     */
    port: null,

    /**
     * The field we or the user selected.
     *
     * @type IInputArea
     */
    currentInputArea: null,

    /**
     * Handles messages sent from other parts of the extension
     *
     * @param  {object} request The request object passed by Chrome
     * @public
     * @static
     */
    messageHandler: function (request) {
        console.log('Got message:', request);
        if (!request || !request.action || !request.tabId) {
            return;
        }

        //Store this tab's id as soon as possible
        GhostTextContent.tabId = request.tabId;

        switch (request.action) {
            case 'select-field':
                GhostTextContent.selectField();
                break;
            case 'enable-field':
                GhostTextContent.enableField();
                break;
            case 'disable-field':
                GhostTextContent.disableField();
                break;
            case 'notify':
                switch(request.type) {
                    case 'error':
                        if (GhostTextContent.currentInputArea !== null) {
                            GhostTextContent.currentInputArea.unbind();
                        }
                        GhostTextContent.alertUser(request.message, request.stay);
                        break;
                    default: /*we might support more types eventually, like success! */
                        GhostTextContent.informUser(request.message, request.stay);
                        break;
                }
                break;
        }
    },

    /**
     * Displays the passed message to the user.
     *
     * @param  {string}  message Message to display
     * @param  {boolean} stay    Whether the message will stay on indefinitely
     * @private
     * @static
     */
    informUser: function (message, stay) {
        console.info('GhostText:', message);
        GThumane.remove();

        message = message.replace(/\n/g,'<br>');
        var timeout = stay ? 0 : GhostTextContent.getMessageDisplayTime(message);
        GThumane.log(message, {
            timeout: timeout,
            clickToClose: true
        });
    },

    /**
     * Displays the passed message to the user as an error
     *
     * @param  {string} message Message to display
     * @param  {boolean} stay    Whether the message will stay on indefinitely
     * @private
     * @static
     */
    alertUser: function (message, stay) {
        console.warn('GhostText:', message);
        GThumane.remove();

        message = message.replace(/\n/g,'<br>');
        var timeout = stay ? 0 : GhostTextContent.getMessageDisplayTime(message);
        GThumane.log(message, {
            timeout: timeout,
            clickToClose: true,
            addnCls: 'ghost-text-message-error'
        });
    },

    /**
     * Gets how long a message needs to stay on screen
     *
     * @param  {string} message Message to display
     * @return {number} The duration in milliseconds
     */
    getMessageDisplayTime: function (message) {
        var wpm = 100;//180 is the average words read per minute, make it slower

        return message.split(' ').length / wpm * 60000;
    },

    /**
     * Remove listeners from field and shows disconnection message
     * @private
     * @static
     */
    disableField: function () {
        console.log('GhostText: disableField()');

        if (GhostTextContent.currentInputArea === null) {
            return;
        }

        GhostTextContent.currentInputArea.unbind();
        GhostTextContent.currentInputArea = null;
        GhostTextContent.informUser('Disconnected! \n <a href="https://github.com/Cacodaimon/GhostTextForChrome/issues?state=open" target="_blank">Report issues</a> | <a href="https://chrome.google.com/webstore/detail/sublimetextarea/godiecgffnchndlihlpaajjcplehddca/reviews" target="_blank">Leave review</a>');
    },

    /**
     * Look for textarea elements in document and connect to is as soon as possible.
     *
     * @private
     * @static
     */
    selectField: function () {
        console.log('GhostText: selectField()');

        var detector = new GhostText.InputArea.Detector();
        detector.focusEvent(function (inputArea) {
            console.log('GhostText: detector.focusEvent()');
            GhostTextContent.currentInputArea = inputArea;
            GhostTextContent.port = chrome.runtime.connect({name: 'GhostText'});
            GhostTextContent.reportFieldData(); //Report initial content of field
        });

        var countElementsFound = detector.detect(document);
        if (countElementsFound === 0) {
            GhostTextContent.alertUser('No textarea elements on this page');
        } else if (countElementsFound > 1) {
            GhostTextContent.informUser('There are multiple textarea elements on this page. \n Click on the one you want to use.', true);
        }
    },

    /**
     * Connects a HTML textarea to a GhostText server by messaging through the background script
     * TODO code cleanup needed…
     *
     * @public
     * @static
     */
    enableField: function () {
        console.log('GhostText: enableField()');

        var inputArea = GhostTextContent.currentInputArea;

        GhostTextContent.informUser('Connected! You can switch to your editor');

        inputArea.textChangedEvent(function () { GhostTextContent.reportFieldData();});
        inputArea.removeEvent(function () { GhostTextContent.requestServerDisconnection(); });
        inputArea.unloadEvent(function () { GhostTextContent.requestServerDisconnection();});
        inputArea.focusEvent(null); //disable
        inputArea.selectionChangedEvent(null);

        GhostTextContent.port.onMessage.addListener(function (msg) {
            if (msg.tabId !== GhostTextContent.tabId) {
                return;
            }
            /** @type {{text: {string}, selections: [{start: {number}, end: {number}}]}} */
            var response = JSON.parse(msg.change);
            GhostTextContent.currentInputArea.setText(response.text);
            GhostTextContent.currentInputArea.setSelections(GhostText.InputArea.Selections.fromPlainJS(response.selections));
        });
    },

    /**
     * Sends a text change to the server.
     *
     * @private
     * @static
     */
    reportFieldData: function () {
        console.log('GhostText: reportFieldData()');

        if (GhostTextContent.currentInputArea === null) {
            throw 'reportFieldData as been called without initializing currentInputArea!';
        }

        if (GhostTextContent.port === null) {
            throw 'reportFieldData as been called without initializing port!';
        }

        /** @type TextChange */
        var textChange = GhostTextContent.currentInputArea.buildChange();
        GhostTextContent.port.postMessage({
            change: JSON.stringify(textChange),
            tabId: GhostTextContent.tabId
        });
    },

    /**
     * Ask the background script to close the connection
     *
     * @private
     * @static
     */
    requestServerDisconnection: function () {
        console.log('GhostText: requestServerDisconnection()');

        chrome.extension.sendMessage({
            action: 'close-connection',
            tabId: GhostTextContent.tabId
        });
    }
};

chrome.runtime.onMessage.addListener(GhostTextContent.messageHandler);
