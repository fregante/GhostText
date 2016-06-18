
module GhostText.InputArea {
    /**
     * Implementation for a contenteditable element.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export class ContentEditable implements IInputArea {

        /**
         * The bind HTML content editable element.
         */
        private contentEditableElement: HTMLDivElement = null;

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

        public bind(domElement: HTMLElement): void {
            this.contentEditableElement = <HTMLDivElement>domElement;
            var that = this;


            this.focusEventListener = function () {
                if (that.focusEventCB) {
                    that.focusEventCB(that);
                }

                that.highlight();
            };
            this.contentEditableElement.addEventListener('focus', this.focusEventListener, false);

            this.inputEventListener = function () {
                if (that.textChangedEventCB) {
                    that.textChangedEventCB(that, that.getText());
                }
            };

            this.contentEditableElement.addEventListener('input', this.inputEventListener, false);

            this.contentEditableElement.addEventListener('DOMCharacterDataModified', this.inputEventListener, false);

            this.beforeUnloadListener = function () {
                if (that.unloadEventCB) {
                    that.unloadEventCB(that);
                }
            };
            window.addEventListener('beforeunload', this.beforeUnloadListener);
        }

        public unbind(): void {
            this.contentEditableElement.removeEventListener('focus', this.focusEventListener);
            this.contentEditableElement.removeEventListener('input', this.inputEventListener);

            this.contentEditableElement.removeEventListener('DOMCharacterDataModified', this.inputEventListener);

            window.removeEventListener('beforeunload', this.beforeUnloadListener);
            this.removeHighlight();
        }

        public focus(): void {
            this.contentEditableElement.focus();
        }

        public blur() :void {
            this.contentEditableElement.blur();
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
            return this.contentEditableElement.innerHTML;
        }

        public setText(text: string): void {
            if (this.contentEditableElement.innerHTML === text) {
                return;
            }

            this.contentEditableElement.innerHTML = text;
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

        /**
         * Adds some nice highlight styles.
         */
        private highlight(): void {
            this.contentEditableElement.style.transition = 'box-shadow 1s cubic-bezier(.25,2,.5,1)';
            this.contentEditableElement.style.boxShadow = 'rgb(0,173,238) 0 0 20px 5px inset';
        }

        /**
         * Removes the highlight styles.
         */
        private removeHighlight(): void {
            this.contentEditableElement.style.boxShadow = '';
        }
    }
}