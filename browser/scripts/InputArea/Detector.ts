module GhostText.InputArea {
    /**
     * Detects supported input elements in the given DOM.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export class Detector {
        /**
         * List of found input elements.
         */
        private inputAreaElements: Array<IInputArea>;

        /**
         * Raised when an element got focused or if only one element was found.
         */
        private onFocusCB: (inputArea: IInputArea) => void = null;

        public constructor() {
            this.inputAreaElements = [];
        }

        /**
         * Detects supported element in the given DOM.
         *
         * @param document
         * @return {number} Number of detected elements.
         */
        public detect(document: HTMLDocument): number {
            if (this.onFocusCB === null) {
                throw 'On focus callback is missing!';
            }

            this.addAceElements(document);
            this.addCodeMirrorElements(document);
            this.addTextAreas(document);
            this.addContentEditableElements(document);
            this.addIframes(document);

            if (this.inputAreaElements.length === 0) {
                return 0;
            }

            if (this.trySingleElement()) {
                return 1;
            }

            this.tryMultipleElements();

            return this.inputAreaElements.length;
        }

        /**
         * Sets the on focus element listener.
         *
         * @param callback The event listener.
         */
        public focusEvent(callback:(inputArea: IInputArea) => void): void {
            this.onFocusCB = callback;
        }

        /**
         * Adds all textarea elements found in the dom.
         *
         * @param document The HTML root node.
         */
        private addTextAreas(document: HTMLDocument): void {
            var textAreas: NodeList = document.querySelectorAll('textarea:not(.ace_text-input)');

            for (var i = 0; i < textAreas.length; i++) {
                // Only handle areas that are visible
                if ((<HTMLTextAreaElement>textAreas[i]).getBoundingClientRect().width) {
                    var inputArea = new TextArea();
                    inputArea.bind(<HTMLTextAreaElement>textAreas[i]);
                    this.inputAreaElements.push(inputArea);
                }
            }
        }

        /**
         * Adds all content editable elements found in the dom.
         *
         * @param document The HTML root node.
         */
        private addContentEditableElements(document: HTMLDocument): void {
            var contentEditables: NodeList = document.querySelectorAll('[contenteditable]:not([contenteditable=\'false\'])');

            for (var i = 0; i < contentEditables.length; i++) {
                var inputArea = new ContentEditable();
                inputArea.bind(<HTMLElement>contentEditables[i]);
                this.inputAreaElements.push(inputArea);
            }
        }

        /**
         * Adds all ace editor elements found in the dom.
         *
         * @param document The HTML root node.
         */
        private addAceElements(document: HTMLDocument): void {
            var aceEditors: NodeList = document.querySelectorAll('.ace_editor');

            for (var i = 0; i < aceEditors.length; i++) {
                var aceEditor: HTMLElement = <HTMLElement>aceEditors[i];
                var id: string = aceEditor.getAttribute('id');
                if (id === null) {
                    id = 'generated-by-ghost-text-' + (Math.random() * 1e17);
                    aceEditor.setAttribute('id', id);
                }
                var inputArea = new AceCodeEditor();
                inputArea.bind(aceEditor);
                this.injectScript(document, inputArea.getScript(), id);
                this.inputAreaElements.push(inputArea);
            }
        }

        /**
         * Adds all code mirror editor elements found in the dom.
         *
         * @param document The HTML root node.
         */
        private addCodeMirrorElements(document: HTMLDocument): void {
            var codeMirrorEditors: NodeList = document.querySelectorAll('.CodeMirror');

            for (var i = 0; i < codeMirrorEditors.length; i++) {
                var codeMirrorEditor: HTMLElement = <HTMLElement>codeMirrorEditors[i];
                var id: string = codeMirrorEditor.getAttribute('id');
                if (id === null) {
                    id = 'generated-by-ghost-text-' + (Math.random() * 1e17);
                    codeMirrorEditor.setAttribute('id', id);
                }
                var inputArea = new CodeMirror();
                inputArea.bind(codeMirrorEditor);
                this.injectScript(document, inputArea.getScript(), id);
                this.inputAreaElements.push(inputArea);
            }
        }

        /**
         * Adds elements which are in accessible iframes.
         *
         * @param document The root document.
         */
        private addIframes(document): void {
            var iframes: HTMLIFrameElement[] = document.getElementsByTagName('iframe');

            for (var i = 0; i < iframes.length; i++) {
                try {
                    this.detect(<HTMLDocument>iframes[i].contentDocument);
                } catch (e) {
                    console.log(e);
                }
            }
        }

        /**
         * If only one supported element was found the onFocus callback get raised automatically.
         * @return {boolean}
         */
        private trySingleElement(): boolean {
            var that = this;
            if (this.inputAreaElements.length === 1) {
                var inputArea: IInputArea = this.inputAreaElements[0];
                inputArea.blur();
                inputArea.focus();
                that.onFocusCB(inputArea);

                return true;
            }

            return false;
        }

        /**
         * Binds the onFocus callback on all found elements and waits for the first focus.
         */
        private tryMultipleElements(): void {
            var that = this;
            for (var i = 0; i < this.inputAreaElements.length; i++) {
                this.inputAreaElements[i].blur();
                this.inputAreaElements[i].focusEvent(function (inputArea: IInputArea) {
                    for (var j = 0; j < that.inputAreaElements.length; j++) { //unbind all others
                        if (that.inputAreaElements[j] !== inputArea) {
                            that.inputAreaElements[j].unbind();
                        }
                    }

                    that.onFocusCB(inputArea);
                });
            }
        }

        /**
         * Injects the given JavaScript to the specified dom.
         *
         * @param document The DOM document.
         * @param javaScript The script to inject as string.
         * @param id The script tag's id.
         */
        private injectScript(document: HTMLDocument, javaScript: Function, id: string): void {
            if (document.getElementById('ghost-text-injected-script-' + id) !== null) {
                return;
            }

            var script: HTMLScriptElement = document.createElement('script');
            script.setAttribute('id', 'ghost-text-injected-script-' + id);
            script.textContent = "(" + javaScript.toString() + ")('" + id + "')";

            document.head.appendChild(script);
        }
    }
}
