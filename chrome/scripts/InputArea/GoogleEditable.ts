
module GhostText.InputArea {
    /**
     * Implementation for a google editable element.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export class GoogleEditable implements IInputArea {

        /**
         * The bind HTML google editable element.
         */
        private googleEditableElement: HTMLBodyElement = null;

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
         * The plugin's browser.
         */
        private browser: Browser;

        public bind(domElement: HTMLElement): void {
            this.googleEditableElement = <HTMLBodyElement>domElement;
            console.log(domElement);
            var that = this;


            this.focusEventListener = function () {
                if (that.focusEventCB) {
                    that.focusEventCB(that);
                }

                that.highlight();
            };
            this.googleEditableElement.addEventListener('click', this.focusEventListener, false); // quick and dirty focus fix

            this.inputEventListener = function () {
                if (that.textChangedEventCB) {
                    that.textChangedEventCB(that, that.getText());
                }
            };

            this.googleEditableElement.addEventListener('DOMCharacterDataModified', this.inputEventListener, false);

            this.beforeUnloadListener = function () {
                if (that.unloadEventCB) {
                    that.unloadEventCB(that);
                }
            };
            window.addEventListener('beforeunload', this.beforeUnloadListener);
        }

        public unbind(): void {
            this.googleEditableElement.removeEventListener('click', this.focusEventListener);
            this.googleEditableElement.removeEventListener('DOMCharacterDataModified', this.inputEventListener);

            window.removeEventListener('beforeunload', this.beforeUnloadListener);
            this.removeHighlight();
        }

        public focus(): void {
            this.googleEditableElement.focus();
        }

        public blur() :void {
            this.googleEditableElement.blur();
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
            return this.googleEditableElement.innerHTML;
        }

        public setText(text: string): void {
            if (this.googleEditableElement.innerHTML === text) {
                return;
            }

            this.googleEditableElement.innerHTML = text;
        }

        public getSelections(): Selections {
            return new Selections([]); //not supported yet
        }

        public setSelections(selections: Selections): void {
            //not supported yet
        }

        public buildChange(): TextChange {
            return new TextChange(
                this.getText(),
                this.getSelections().getAll()
            );
        }

        public setBrowser(browser: Browser): void {
            this.browser = browser;
        }

        /**
         * Adds some nice highlight styles.
         */
        private highlight(): void {
            this.googleEditableElement.style.transition = 'box-shadow 1s cubic-bezier(.25,2,.5,1)';
            this.googleEditableElement.style.boxShadow = 'rgb(0,173,238) 0 0 20px 5px inset';
        }

        /**
         * Removes the highlight styles.
         */
        private removeHighlight(): void {
            this.googleEditableElement.style.boxShadow = '';
        }
    }
}