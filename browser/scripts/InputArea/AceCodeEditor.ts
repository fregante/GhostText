/// <reference path="dts/ace.d.ts" />

module GhostText.InputArea {

    /**
     * Input area implementation for a ACE code editor.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export class AceCodeEditor extends JSCodeEditor implements IScriptToInject {
        public getScript (): Function {
            return function (id) {
                console.log("injected" + id);
                var offsetToPos = function (lines, offset) {
                    var row = 0, pos = 0;
                    while (row < lines.length && pos + lines[row].length < offset) {
                        pos += lines[row].length + 1;
                        row++;
                    }
                    return {row: row, col: offset - pos};
                };
                var ghostTextAceDiv = <HTMLElement>document.querySelector("#" + id);
                console.log(ghostTextAceDiv);
                var ghostTextAceEditor = ace.edit(ghostTextAceDiv);
                var ghostTextAceEditorSession = ghostTextAceEditor.getSession();
                var Range = ace.require("ace/range").Range;

                ghostTextAceDiv.addEventListener("GhostTextServerInput", function (e: any) {
                    ghostTextAceEditorSession.setValue(e.detail.text);
                });

                ghostTextAceDiv.addEventListener("GhostTextDoFocus", function () {
                    ghostTextAceEditor.focus();
                });

                ghostTextAceDiv.addEventListener("GhostTextDoBlur", function () {
                    ghostTextAceEditor.blur();
                });

                ghostTextAceDiv.addEventListener("GhostTextServerSelectionChanged", function (e: any) {
                    ghostTextAceEditorSession.selection.clearSelection();
                    var lines = ghostTextAceEditorSession.getDocument().getAllLines();
                    for (var i = 0; i < e.detail.selections.length; i++) {
                        var selection = e.detail.selections[i];
                        var start = offsetToPos(lines, selection.start);
                        var end = offsetToPos(lines, selection.end);
                        var range = new Range(start.row, start.col, end.row, end.col);
                        if (i === 0) {
                            ghostTextAceEditorSession.selection.addRange(range, true);
                        } else {
                            ghostTextAceEditorSession.selection.setSelectionRange(range, true);
                        }
                    }
                });

                ghostTextAceDiv.addEventListener("GhostTextDoHighlight", function () {
                    var ghostTextAceScrollerDiv: HTMLDivElement = <HTMLDivElement>ghostTextAceDiv.querySelector(".ace_scroller");
                    ghostTextAceScrollerDiv.style.transition = "box-shadow 1s cubic-bezier(.25,2,.5,1)";
                    ghostTextAceScrollerDiv.style.boxShadow = "rgb(0,173,238) 0 0 20px 5px inset";
                });

                ghostTextAceDiv.addEventListener("GhostTextRemoveHighlight", function () {
                    var ghostTextAceScrollerDiv: HTMLDivElement = <HTMLDivElement>ghostTextAceDiv.querySelector(".ace_scroller");
                    ghostTextAceScrollerDiv.style.boxShadow = "";
                });

                ghostTextAceEditorSession.on("change", function (e) {
                    window.setTimeout(function () {
                        var value = ghostTextAceEditorSession.getValue();
                        var customEvent: any = CustomEvent;
                        var inputEvent = new customEvent("GhostTextJSCodeEditorInput", {detail: {text: value}});
                        ghostTextAceDiv.dispatchEvent(inputEvent);
                    }, 100);
                });

                ghostTextAceEditor.on("focus", function (e) {
                    var value = ghostTextAceEditorSession.getValue();
                    var customEvent: any = CustomEvent;
                    var focusEvent = new customEvent("GhostTextJSCodeEditorFocus", {detail: {text: value}});
                    ghostTextAceDiv.dispatchEvent(focusEvent);
                });
            };
        }
    }
}