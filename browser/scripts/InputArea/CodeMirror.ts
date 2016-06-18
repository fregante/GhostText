module GhostText.InputArea {

    /**
     * Input area implementation for a CodeMirror JS code editor.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export class CodeMirror extends JSCodeEditor implements IScriptToInject {
        public getScript (): Function {
            return function (id) {
                console.log(id);
                var ghostTextCodeMirrorDiv = <any>document.querySelector("#" + id);
                var ghostTextCodeMirrorEditor = <any>ghostTextCodeMirrorDiv.CodeMirror;

                ghostTextCodeMirrorDiv.addEventListener("GhostTextServerInput", function (e) {
                    ghostTextCodeMirrorEditor.doc.setValue(e.detail.text);
                });

                ghostTextCodeMirrorDiv.addEventListener("GhostTextDoFocus", function () {
                    ghostTextCodeMirrorEditor.focus();
                });

                ghostTextCodeMirrorDiv.addEventListener("GhostTextDoBlur", function () {
                    ghostTextCodeMirrorEditor.blur();
                });

                ghostTextCodeMirrorDiv.addEventListener("GhostTextServerSelectionChanged", function (e) {
                    for (var i = 0; i < e.detail.selections.length; i++) {
                        var selection = e.detail.selections[i];
                        var start = ghostTextCodeMirrorEditor.posFromIndex(selection.start);
                        var end = ghostTextCodeMirrorEditor.posFromIndex(selection.end);
                        if (i === 0) {
                            ghostTextCodeMirrorEditor.doc.setSelection(start, end)
                        }
                        else {
                            ghostTextCodeMirrorEditor.doc.addSelection(start, end)
                        }
                    }
                });

                ghostTextCodeMirrorDiv.addEventListener("GhostTextDoHighlight", function () {
                    var ghostTextCodeMirrorSizerDiv = <HTMLDivElement>ghostTextCodeMirrorDiv.querySelector(".CodeMirror-sizer");
                    ghostTextCodeMirrorSizerDiv.style.transition = "box-shadow 1s cubic-bezier(.25,2,.5,1)";
                    ghostTextCodeMirrorSizerDiv.style.boxShadow = "rgb(0,173,238) 0 0 20px 5px inset";
                });

                ghostTextCodeMirrorDiv.addEventListener("GhostTextRemoveHighlight", function () {
                    var ghostTextCodeMirrorSizerDiv = <HTMLDivElement>ghostTextCodeMirrorDiv.querySelector(".CodeMirror-sizer");
                    ghostTextCodeMirrorSizerDiv.style.boxShadow = "";
                });

                ghostTextCodeMirrorEditor.on("change", function (e) {
                    var value = e.doc.getValue();
                    var customEvent: any = CustomEvent;
                    var inputEvent = new customEvent("GhostTextJSCodeEditorInput", {detail: {text: value}});
                    ghostTextCodeMirrorDiv.dispatchEvent(inputEvent);
                });

                ghostTextCodeMirrorEditor.on("focus", function (e) {
                    var value = e.doc.getValue();
                    var customEvent: any = CustomEvent;
                    var focusEvent = new customEvent("GhostTextJSCodeEditorFocus", {detail: {text: value}});
                    ghostTextCodeMirrorDiv.dispatchEvent(focusEvent);
                });
            };
        }
    }
}