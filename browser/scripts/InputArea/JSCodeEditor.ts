module GhostText.InputArea {

    /**
     * Implementation for a JS code editor signaling through events to the content script.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export class JSCodeEditor implements IInputArea {

        /**
         * The editor's div element.
         */
        private jsCodeEditorDiv: HTMLElement = null;

        /**
         * Callback fired on an input event.
         */
        private textChangedEventCB: (inputArea: IInputArea, text: string) => void = null;

        /**
         * Callback fired on an select event.
         */
        private selectionChangedEventCB: (inputArea: IInputArea, selections: Selections) => void = null;

        /**
         * Callback fired on an remove from DOM event.
         */
        private removeEventCB: (inputArea: IInputArea) => void = null;

        /**
         * Callback fired on an element focus event.
         */
        private focusEventCB: (inputArea: IInputArea) => void = null;

        /**
         * Callback fired when the element's documents gets unloaded.
         */
        private unloadEventCB: (inputArea: IInputArea) => void = null;

        /**
         * Custom event fired on text change.
         */
        private inputEventListener: EventListener = null;

        /**
         * Custom event fired on focus.
         */
        private focusEventListener: EventListener = null;

        /**
         * Fired when the elements page gets reloaded.
         */
        private beforeUnloadListener: EventListener = null;

        /**
         * Fired when the elements get removed from dom.
         */
        private elementRemovedListener: EventListener = null;

        /**
         * The elements current text.
         */
        private currentText: string = null;

        public bind(domElement: HTMLElement): void {
            this.jsCodeEditorDiv = <HTMLElement>domElement;
            var that = this;

            this.inputEventListener = function (e: CustomEvent) {
                if (that.currentText == e.detail.text) {
                    return;
                }

                that.currentText = e.detail.text;

                if (that.textChangedEventCB) {
                    that.textChangedEventCB(that, that.getText());
                }
            };
            this.jsCodeEditorDiv.addEventListener('GhostTextJSCodeEditorInput', this.inputEventListener, false);


            this.focusEventListener = function (e: CustomEvent) {
                if (that.currentText == e.detail.text) {
                    return;
                }

                that.currentText = e.detail.text;

                if (that.focusEventCB) {
                    that.focusEventCB(that);
                }

            };
            this.jsCodeEditorDiv.addEventListener('GhostTextJSCodeEditorFocus', this.focusEventListener, false);

            this.beforeUnloadListener = function (e) {
                if (that.unloadEventCB) {
                    that.unloadEventCB(that);
                }
            };

            this.jsCodeEditorDiv.addEventListener('beforeunload', this.beforeUnloadListener);

            this.highlight();
        }

        public unbind(): void {
            this.jsCodeEditorDiv.removeEventListener('GhostTextJSCodeEditorFocus', this.focusEventListener);
            this.jsCodeEditorDiv.removeEventListener('GhostTextJSCodeEditorInput', this.inputEventListener);
            this.jsCodeEditorDiv.removeEventListener('beforeunload', this.beforeUnloadListener);
            this.removeHighlight();
        }

        public focus(): void {
            var gtDoFocusEvent = <Event>StandardsCustomEvent.get('GhostTextDoFocus', {detail: null});
            this.jsCodeEditorDiv.dispatchEvent(gtDoFocusEvent);
        }

        public blur(): void {
            var gtDoBlurEvent = <Event>StandardsCustomEvent.get('GhostTextDoBlur', {detail: null});
            this.jsCodeEditorDiv.dispatchEvent(gtDoBlurEvent);
        }

        public textChangedEvent(callback:(inputArea: IInputArea, text: string) => void): void {
            this.textChangedEventCB = callback;
        }

        public selectionChangedEvent(callback:(inputArea: IInputArea, selections: Selections) => void): void {
            this.selectionChangedEventCB = callback;
        }

        public removeEvent(callback:(inputArea: IInputArea) => void): void {
            this.removeEventCB = callback;
        }

        public focusEvent(callback:(inputArea: IInputArea) => void): void {
            this.focusEventCB = callback;
        }

        public unloadEvent(callback:(inputArea: IInputArea) => void): void {
            this.unloadEventCB = callback;
        }

        public getText(): string {
            return this.currentText;
        }

        public setText(text: string): void {
            if (this.currentText == text) {
                return;
            }

            this.currentText = text;
            var details = {detail: {text: this.currentText}};
            var gtServerInputEvent = <Event>StandardsCustomEvent.get('GhostTextServerInput', details);
            this.jsCodeEditorDiv.dispatchEvent(gtServerInputEvent);
        }

        public getSelections(): Selections {
            return new Selections([new Selection()]);
        }

        public setSelections(selections: Selections): void {
            var details = {detail: {selections: selections.toJSON()}};
            var gtDoFocusEvent = <Event>StandardsCustomEvent.get('GhostTextServerSelectionChanged', details);
            this.jsCodeEditorDiv.dispatchEvent(gtDoFocusEvent);
        }

        public buildChange(): TextChange {
            return new TextChange(
                this.getText(),
                this.getSelections().getAll()
            );
        }

        /**
         * Adds some nice highlight styles.
         */
        private highlight(): void {
            var gtDoHighlightEvent = <Event>StandardsCustomEvent.get('GhostTextDoHighlight', {detail: null});
            this.jsCodeEditorDiv.dispatchEvent(gtDoHighlightEvent);
        }

        /**
         * Removes the highlight styles.
         */
        private removeHighlight(): void {
            var gtRemoveHighlightEvent = <Event>StandardsCustomEvent.get('GhostTextRemoveHighlight', {detail: null});
            this.jsCodeEditorDiv.dispatchEvent(gtRemoveHighlightEvent);
        }
    }
}