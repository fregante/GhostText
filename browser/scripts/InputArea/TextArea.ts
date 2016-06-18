module GhostText.InputArea {

    /**
     * Implementation for a text area element.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export class TextArea implements IInputArea {

        /**
         * The bind HTML text area element.
         */
        private textArea: HTMLTextAreaElement = null;

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
        private customEventInput: Event = null;

        /**
         * Custom event fired on text change.
         */
        private customKeyUpEvent: Event = null;

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
         * Fired when the elements get removd from dom.
         */
        private elementRemovedListener: EventListener = null;

        public bind(domElement: HTMLElement): void {
            this.textArea = <HTMLTextAreaElement>domElement;
            var that = this;

            this.focusEventListener = function () {
                if (that.focusEventCB) {
                    that.focusEventCB(that);
                }

                that.highlight();
            };
            this.textArea.addEventListener('focus', this.focusEventListener, false);

            this.inputEventListener = function (e: UIEvent) {
                if (e.detail && e.detail['generatedByGhostText']) {
                    return;
                }

                if (that.textChangedEventCB) {
                    that.textChangedEventCB(that, that.getText());
                }
            };
            this.textArea.addEventListener('input', this.inputEventListener, false);

            //TODO Selection changed

            this.elementRemovedListener = function () {
                if (that.textChangedEventCB) {
                    that.textChangedEventCB(that, that.getText());
                }
            };
            this.textArea.addEventListener('DOMNodeRemovedFromDocument', this.elementRemovedListener, false);

            this.beforeUnloadListener = function () {
                if (that.unloadEventCB) {
                    that.unloadEventCB(that);
                }
            };
            window.addEventListener('beforeunload', this.beforeUnloadListener);

            this.customEventInput = <Event>StandardsCustomEvent.get('input',  { detail: { generatedByGhostText: true} });
            this.customKeyUpEvent = this.createKeyboardEvent();
        }

        /**
         * Creates a new keyboard event.
         *
         * @param type The event type, possible types are: 'keydown', 'keyup', 'keypress'.
         * @link http://stackoverflow.com/questions/596481/simulate-javascript-key-events#answer-12187302
         */
        private createKeyboardEvent (type: string = 'keyup') {
            var keyboardEvent: Event = document.createEvent('KeyboardEvent');
            var initMethod: string = typeof (<any>keyboardEvent).initKeyboardEvent !== 'undefined' ? 'initKeyboardEvent' : 'initKeyEvent';

            keyboardEvent[initMethod](type, true, true, window, false, false, false, false, 40, 0);

            return keyboardEvent;
        }

        public unbind(): void {
            this.textArea.removeEventListener('focus', this.focusEventListener);
            this.textArea.removeEventListener('input', this.inputEventListener);
            this.textArea.removeEventListener('DOMNodeRemovedFromDocument', this.elementRemovedListener);
            window.removeEventListener('beforeunload', this.beforeUnloadListener);
            this.removeHighlight();
        }

        public focus(): void {
            this.textArea.focus();

            if (this.focusEventCB) {
                this.focusEventCB(this);
            }
        }

        public blur(): void {
            this.textArea.blur();
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
            return this.textArea.value;
        }

        public setText(text: string): void {
            this.textArea.value = text;

            this.textArea.dispatchEvent(this.customEventInput);
            this.textArea.dispatchEvent(this.customKeyUpEvent);
        }

        public getSelections(): Selections {
            return new Selections([new Selection(
                this.textArea.selectionStart,
                this.textArea.selectionEnd
            )]);
        }

        public setSelections(selections: Selections): void {
            var selection: Selection = selections.getMinMaxSelection();
            this.textArea.selectionStart = selection.start;
            this.textArea.selectionEnd   = selection.end;
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
            this.textArea.style.transition = 'box-shadow 1s cubic-bezier(.25,2,.5,1)';
            this.textArea.style.boxShadow = 'rgb(0,173,238) 0 0 20px 5px inset';
        }

        /**
         * Removes the highlight styles.
         */
        private removeHighlight(): void {
            this.textArea.style.boxShadow = '';
        }
    }
}