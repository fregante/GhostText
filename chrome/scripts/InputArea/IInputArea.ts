module GhostText.InputArea {
    /**
     * GhostText input area selection class.
     * Defines a selection with a start and an end.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export interface IInputArea {
        /**
         * Binds the instance to the given HTML element.
         *
         * @param domElement
         */
        bind(domElement: HTMLElement): void;

        /**
         * Unbinds the HTML element and removes all events from it.
         */
        unbind(): void;

        /**
         * Focus the element.
         */
        focus(): void;

        /**
         * Blurs the element.
         */
        blur(): void;

        /**
         * Binds a event fired when the element's text has been changed.
         *
         * @param callback
         */
        textChangedEvent(callback:(inputArea: IInputArea, text: string) => void): void;

        /**
         * Binds a event fired when the element's selection has been changed.
         *
         * @param callback
         */
        selectionChangedEvent(callback:(inputArea: IInputArea, selections: Selections) => void): void;

        /**
         * Binds an unload event fired when the element gets removed from the dom.
         *
         * @param callback
         */
        removeEvent(callback:(inputArea: IInputArea) => void): void;

        /**
         * Binds an focus event fired when the element gets focused.
         *
         * @param callback
         */
        focusEvent(callback:(inputArea: IInputArea) => void): void;

        /**
         * Binds an unload event fired when the elements documents get unloaded.
         *
         * @param callback
         */
        unloadEvent(callback:(inputArea: IInputArea) => void): void;

        /**
         * Gets the element's text.
         */
        getText(): string;

        /**
         * Changes the element's text.
         *
         * @param text
         */
        setText(text: string): void;

        /**
         * Gets the element's selection.
         */
        getSelections(): Selections;

        /**
         * Sets the element's selection.
         *
         * @param selections
         */
        setSelections(selections: Selections): void;

        /**
         * Builds a text change object which the server understands.
         */
        buildChange(): TextChange;

        /**
         * Sets the browser.
         *
         * @param browser The plugin's browser.
         */
        setBrowser(browser: Browser): void;
    }
}