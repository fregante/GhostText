var GhostText;
(function (GhostText) {
    (function (InputArea) {
        (function (Browser) {
            Browser[Browser["Chrome"] = 0] = "Chrome";
            Browser[Browser["Firefox"] = 1] = "Firefox";
        })(InputArea.Browser || (InputArea.Browser = {}));
        var Browser = InputArea.Browser;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var StandardsCustomEvent = (function () {
            function StandardsCustomEvent() {
            }
            StandardsCustomEvent.get = function (browser, eventType, data) {
                if (browser == 1 /* Firefox */) {
                    var cloned = cloneInto(data.detail, document.defaultView);
                    var event = document.createEvent('CustomEvent');
                    event.initCustomEvent(eventType, true, true, cloned);

                    return event;
                }

                var customEvent = CustomEvent;
                var event = new customEvent(eventType, data);

                return event;
            };
            return StandardsCustomEvent;
        })();
        InputArea.StandardsCustomEvent = StandardsCustomEvent;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var Selection = (function () {
            function Selection(start, end) {
                if (typeof start === "undefined") { start = 0; }
                if (typeof end === "undefined") { end = 0; }
                this.start = start;
                this.end = end;
            }
            Selection.prototype.toJSON = function () {
                return {
                    start: this.start,
                    end: this.end
                };
            };
            return Selection;
        })();
        InputArea.Selection = Selection;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var Selections = (function () {
            function Selections(selections) {
                if (typeof selections === "undefined") { selections = []; }
                this.selections = selections;
            }
            Selections.prototype.add = function (selection) {
                this.selections.push(selection);
            };

            Selections.prototype.getAll = function () {
                return this.selections;
            };

            Selections.prototype.getMinMaxSelection = function () {
                var minMaxSelection = new InputArea.Selection(Number.MAX_VALUE, Number.MIN_VALUE);

                for (var i = this.selections.length - 1; i >= 0; i--) {
                    minMaxSelection.start = Math.min(minMaxSelection.start, this.selections[i].start);
                    minMaxSelection.end = Math.max(minMaxSelection.end, this.selections[i].end);
                }

                return minMaxSelection;
            };

            Selections.fromPlainJS = function (selections) {
                var newSelections = [];

                for (var i = selections.length - 1; i >= 0; i--) {
                    newSelections.push(new InputArea.Selection(selections[i].start, selections[i].end));
                }

                return new Selections(newSelections);
            };

            Selections.prototype.toJSON = function () {
                var returnValue = [];

                for (var i = this.selections.length - 1; i >= 0; i--) {
                    returnValue.push(this.selections[i].toJSON());
                }

                return returnValue;
            };
            return Selections;
        })();
        InputArea.Selections = Selections;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var TextChange = (function () {
            function TextChange(text, selections, title, url, syntax) {
                if (typeof text === "undefined") { text = null; }
                if (typeof selections === "undefined") { selections = []; }
                if (typeof title === "undefined") { title = window.document.title; }
                if (typeof url === "undefined") { url = location.host; }
                if (typeof syntax === "undefined") { syntax = ''; }
                this.text = text;
                this.selections = selections;
                this.title = title;
                this.url = url;
                this.syntax = syntax;
            }
            return TextChange;
        })();
        InputArea.TextChange = TextChange;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var Detector = (function () {
            function Detector(browser) {
                this.onFocusCB = null;
                this.inputAreaElements = [];
                this.browser = browser;
            }
            Detector.prototype.detect = function (document) {
                if (this.onFocusCB === null) {
                    throw 'On focus callback is missing!';
                }

                this.addAceElements(document);
                this.addCodeMirrorElements(document);
                this.addTextAreas(document);
                this.addContentEditableElements(document);
                this.addGoogleEditableElements(document);
                this.addIframes(document);

                if (this.inputAreaElements.length === 0) {
                    return 0;
                }

                if (this.trySingleElement()) {
                    return 1;
                }

                this.tryMultipleElements();

                return this.inputAreaElements.length;
            };

            Detector.prototype.focusEvent = function (callback) {
                this.onFocusCB = callback;
            };

            Detector.prototype.addTextAreas = function (document) {
                var textAreas = document.body.querySelectorAll('textarea:not(.ace_text-input)');

                for (var i = 0; i < textAreas.length; i++) {
                    var inputArea = new InputArea.TextArea();
                    inputArea.setBrowser(this.browser);
                    inputArea.bind(textAreas[i]);
                    this.inputAreaElements.push(inputArea);
                }
            };

            Detector.prototype.addContentEditableElements = function (document) {
                var contentEditables = document.body.querySelectorAll('[contenteditable=\'true\']');

                for (var i = 0; i < contentEditables.length; i++) {
                    var inputArea = new InputArea.ContentEditable();
                    inputArea.setBrowser(this.browser);
                    inputArea.bind(contentEditables[i]);
                    this.inputAreaElements.push(inputArea);
                }
            };

            Detector.prototype.addGoogleEditableElements = function (document) {
                var googleEditables = document.querySelectorAll('[g_editable=\'true\']');

                for (var i = 0; i < googleEditables.length; i++) {
                    var inputArea = new InputArea.GoogleEditable();
                    inputArea.setBrowser(this.browser);
                    inputArea.bind(googleEditables[i]);
                    this.inputAreaElements.push(inputArea);
                }
            };

            Detector.prototype.addAceElements = function (document) {
                var aceEditors = document.body.querySelectorAll('.ace_editor');

                for (var i = 0; i < aceEditors.length; i++) {
                    var aceEditor = aceEditors[i];
                    var id = aceEditor.getAttribute('id');
                    if (id === null) {
                        id = 'generated-by-ghost-text-' + (Math.random() * 1e17);
                        aceEditor.setAttribute('id', id);
                    }
                    var inputArea = new InputArea.AceCodeEditor();
                    inputArea.setBrowser(this.browser);
                    inputArea.bind(aceEditor);
                    this.injectScript(document, inputArea.getScript(), id);
                    this.inputAreaElements.push(inputArea);
                }
            };

            Detector.prototype.addCodeMirrorElements = function (document) {
                var codeMirrorEditors = document.body.querySelectorAll('.CodeMirror');

                for (var i = 0; i < codeMirrorEditors.length; i++) {
                    var codeMirrorEditor = codeMirrorEditors[i];
                    var id = codeMirrorEditor.getAttribute('id');
                    if (id === null) {
                        id = 'generated-by-ghost-text-' + (Math.random() * 1e17);
                        codeMirrorEditor.setAttribute('id', id);
                    }
                    var inputArea = new InputArea.CodeMirror();
                    inputArea.setBrowser(this.browser);
                    inputArea.bind(codeMirrorEditor);
                    this.injectScript(document, inputArea.getScript(), id);
                    this.inputAreaElements.push(inputArea);
                }
            };

            Detector.prototype.addIframes = function (document) {
                var iframes = document.getElementsByTagName('iframe');

                for (var i = 0; i < iframes.length; i++) {
                    try  {
                        this.detect(iframes[i].contentDocument);
                    } catch (e) {
                        console.log(e);
                    }
                }
            };

            Detector.prototype.trySingleElement = function () {
                var that = this;
                if (this.inputAreaElements.length === 1) {
                    var inputArea = this.inputAreaElements[0];
                    inputArea.blur();
                    inputArea.focus();
                    that.onFocusCB(inputArea);

                    return true;
                }

                return false;
            };

            Detector.prototype.tryMultipleElements = function () {
                var that = this;
                for (var i = 0; i < this.inputAreaElements.length; i++) {
                    this.inputAreaElements[i].blur();
                    this.inputAreaElements[i].focusEvent(function (inputArea) {
                        for (var j = 0; j < that.inputAreaElements.length; j++) {
                            if (that.inputAreaElements[j] !== inputArea) {
                                that.inputAreaElements[j].unbind();
                            }
                        }

                        that.onFocusCB(inputArea);
                    });
                }
            };

            Detector.prototype.injectScript = function (document, javaScript, id) {
                if (document.getElementById('ghost-text-injected-script-' + id) !== null) {
                    return;
                }

                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');
                script.setAttribute('type', 'text/javascript');
                script.setAttribute('class', 'ghost-text-injected-script');
                script.setAttribute('id', 'ghost-text-injected-script-' + id);
                switch (this.browser) {
                    case 0 /* Chrome */:
                        script.innerText = "(" + javaScript.toString() + ")('" + id + "')";
                        break;
                    case 1 /* Firefox */:
                        script.text = "(" + javaScript.toString() + ")('" + id + "')";
                        break;
                    default:
                        throw 'Unknown browser given!';
                }

                head.appendChild(script);
            };
            return Detector;
        })();
        InputArea.Detector = Detector;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var TextArea = (function () {
            function TextArea() {
                this.textArea = null;
                this.textChangedEventCB = null;
                this.selectionChangedEventCB = null;
                this.removeEventCB = null;
                this.focusEventCB = null;
                this.unloadEventCB = null;
                this.customEvent = null;
                this.inputEventListener = null;
                this.focusEventListener = null;
                this.beforeUnloadListener = null;
                this.elementRemovedListener = null;
            }
            TextArea.prototype.bind = function (domElement) {
                this.textArea = domElement;
                var that = this;

                this.focusEventListener = function () {
                    if (that.focusEventCB) {
                        that.focusEventCB(that);
                    }

                    that.highlight();
                };
                this.textArea.addEventListener('focus', this.focusEventListener, false);

                this.inputEventListener = function (e) {
                    if (e.detail && e.detail['generatedByGhostText']) {
                        return;
                    }

                    if (that.textChangedEventCB) {
                        that.textChangedEventCB(that, that.getText());
                    }
                };
                this.textArea.addEventListener('input', this.inputEventListener, false);

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

                this.customEvent = InputArea.StandardsCustomEvent.get(this.browser, 'input', { detail: { generatedByGhostText: true } });
            };

            TextArea.prototype.unbind = function () {
                this.textArea.removeEventListener('focus', this.focusEventListener);
                this.textArea.removeEventListener('input', this.inputEventListener);
                this.textArea.removeEventListener('DOMNodeRemovedFromDocument', this.elementRemovedListener);
                window.removeEventListener('beforeunload', this.beforeUnloadListener);
                this.removeHighlight();
            };

            TextArea.prototype.focus = function () {
                this.textArea.focus();

                if (this.focusEventCB) {
                    this.focusEventCB(this);
                }
            };

            TextArea.prototype.blur = function () {
                this.textArea.blur();
            };

            TextArea.prototype.textChangedEvent = function (callback) {
                this.textChangedEventCB = callback;
            };

            TextArea.prototype.selectionChangedEvent = function (callback) {
                this.selectionChangedEventCB = callback;
            };

            TextArea.prototype.removeEvent = function (callback) {
                this.removeEventCB = callback;
            };

            TextArea.prototype.focusEvent = function (callback) {
                this.focusEventCB = callback;
            };

            TextArea.prototype.unloadEvent = function (callback) {
                this.unloadEventCB = callback;
            };

            TextArea.prototype.getText = function () {
                return this.textArea.value;
            };

            TextArea.prototype.setText = function (text) {
                this.textArea.value = text;

                this.textArea.dispatchEvent(this.customEvent);
            };

            TextArea.prototype.getSelections = function () {
                return new InputArea.Selections([new InputArea.Selection(this.textArea.selectionStart, this.textArea.selectionEnd)]);
            };

            TextArea.prototype.setSelections = function (selections) {
                var selection = selections.getMinMaxSelection();
                this.textArea.selectionStart = selection.start;
                this.textArea.selectionEnd = selection.end;
            };

            TextArea.prototype.buildChange = function () {
                return new InputArea.TextChange(this.getText(), this.getSelections().getAll());
            };

            TextArea.prototype.setBrowser = function (browser) {
                this.browser = browser;
            };

            TextArea.prototype.highlight = function () {
                this.textArea.style.transition = 'box-shadow 1s cubic-bezier(.25,2,.5,1)';
                this.textArea.style.boxShadow = 'rgb(0,173,238) 0 0 20px 5px inset';
            };

            TextArea.prototype.removeHighlight = function () {
                this.textArea.style.boxShadow = '';
            };
            return TextArea;
        })();
        InputArea.TextArea = TextArea;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var JSCodeEditor = (function () {
            function JSCodeEditor() {
                this.jsCodeEditorDiv = null;
                this.textChangedEventCB = null;
                this.selectionChangedEventCB = null;
                this.removeEventCB = null;
                this.focusEventCB = null;
                this.unloadEventCB = null;
                this.inputEventListener = null;
                this.focusEventListener = null;
                this.beforeUnloadListener = null;
                this.elementRemovedListener = null;
                this.currentText = null;
            }
            JSCodeEditor.prototype.bind = function (domElement) {
                this.jsCodeEditorDiv = domElement;
                var that = this;

                this.inputEventListener = function (e) {
                    if (that.currentText == e.detail.text) {
                        return;
                    }

                    that.currentText = e.detail.text;

                    if (that.textChangedEventCB) {
                        that.textChangedEventCB(that, that.getText());
                    }
                };
                this.jsCodeEditorDiv.addEventListener('GhostTextJSCodeEditorInput', this.inputEventListener, false);

                this.focusEventListener = function (e) {
                    if (that.currentText == e.detail.text) {
                        return;
                    }

                    that.currentText = e.detail.text;

                    if (that.focusEventCB) {
                        that.focusEventCB(that);
                    }

                    that.highlight();
                };
                this.jsCodeEditorDiv.addEventListener('GhostTextJSCodeEditorFocus', this.focusEventListener, false);

                this.beforeUnloadListener = function (e) {
                    if (that.unloadEventCB) {
                        that.unloadEventCB(that);
                    }
                };
                this.jsCodeEditorDiv.addEventListener('beforeunload', this.beforeUnloadListener);
            };

            JSCodeEditor.prototype.unbind = function () {
                this.jsCodeEditorDiv.removeEventListener('GhostTextJSCodeEditorFocus', this.focusEventListener);
                this.jsCodeEditorDiv.removeEventListener('GhostTextJSCodeEditorInput', this.inputEventListener);
                this.jsCodeEditorDiv.removeEventListener('beforeunload', this.beforeUnloadListener);
                this.removeHighlight();
            };

            JSCodeEditor.prototype.focus = function () {
                var gtDoFocusEvent = InputArea.StandardsCustomEvent.get(this.browser, 'GhostTextDoFocus', { detail: null });
                this.jsCodeEditorDiv.dispatchEvent(gtDoFocusEvent);
            };

            JSCodeEditor.prototype.blur = function () {
                var gtDoBlurEvent = InputArea.StandardsCustomEvent.get(this.browser, 'GhostTextDoBlur', { detail: null });
                this.jsCodeEditorDiv.dispatchEvent(gtDoBlurEvent);
            };

            JSCodeEditor.prototype.textChangedEvent = function (callback) {
                this.textChangedEventCB = callback;
            };

            JSCodeEditor.prototype.selectionChangedEvent = function (callback) {
                this.selectionChangedEventCB = callback;
            };

            JSCodeEditor.prototype.removeEvent = function (callback) {
                this.removeEventCB = callback;
            };

            JSCodeEditor.prototype.focusEvent = function (callback) {
                this.focusEventCB = callback;
            };

            JSCodeEditor.prototype.unloadEvent = function (callback) {
                this.unloadEventCB = callback;
            };

            JSCodeEditor.prototype.getText = function () {
                return this.currentText;
            };

            JSCodeEditor.prototype.setText = function (text) {
                if (this.currentText == text) {
                    return;
                }

                this.currentText = text;
                var details = { detail: { text: this.currentText } };
                var gtServerInputEvent = InputArea.StandardsCustomEvent.get(this.browser, 'GhostTextServerInput', details);
                this.jsCodeEditorDiv.dispatchEvent(gtServerInputEvent);
            };

            JSCodeEditor.prototype.getSelections = function () {
                return new InputArea.Selections([new InputArea.Selection()]);
            };

            JSCodeEditor.prototype.setSelections = function (selections) {
                var details = { detail: { selections: selections.toJSON() } };
                var gtDoFocusEvent = InputArea.StandardsCustomEvent.get(this.browser, 'GhostTextServerSelectionChanged', details);
                this.jsCodeEditorDiv.dispatchEvent(gtDoFocusEvent);
            };

            JSCodeEditor.prototype.buildChange = function () {
                return new InputArea.TextChange(this.getText(), this.getSelections().getAll());
            };

            JSCodeEditor.prototype.setBrowser = function (browser) {
                this.browser = browser;
            };

            JSCodeEditor.prototype.highlight = function () {
                var gtDoHighlightEvent = InputArea.StandardsCustomEvent.get(this.browser, 'GhostTextDoHighlight', { detail: null });
                this.jsCodeEditorDiv.dispatchEvent(gtDoHighlightEvent);
            };

            JSCodeEditor.prototype.removeHighlight = function () {
                var gtRemoveHighlightEvent = InputArea.StandardsCustomEvent.get(this.browser, 'GhostTextRemoveHighlight', { detail: null });
                this.jsCodeEditorDiv.dispatchEvent(gtRemoveHighlightEvent);
            };
            return JSCodeEditor;
        })();
        InputArea.JSCodeEditor = JSCodeEditor;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var __extends = this.__extends || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        __.prototype = b.prototype;
        d.prototype = new __();
    };
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var AceCodeEditor = (function (_super) {
            __extends(AceCodeEditor, _super);
            function AceCodeEditor() {
                _super.apply(this, arguments);
            }
            AceCodeEditor.prototype.getScript = function () {
                return function (id) {
                    console.log("injected" + id);
                    var offsetToPos = function (lines, offset) {
                        var row = 0, pos = 0;
                        while (row < lines.length && pos + lines[row].length < offset) {
                            pos += lines[row].length + 1;
                            row++;
                        }
                        return { row: row, col: offset - pos };
                    };
                    var ghostTextAceDiv = document.querySelector("#" + id);
                    console.log(ghostTextAceDiv);
                    var ghostTextAceEditor = ace.edit(ghostTextAceDiv);
                    var ghostTextAceEditorSession = ghostTextAceEditor.getSession();
                    var Range = ace.require("ace/range").Range;

                    ghostTextAceDiv.addEventListener("GhostTextServerInput", function (e) {
                        ghostTextAceEditorSession.setValue(e.detail.text);
                    });

                    ghostTextAceDiv.addEventListener("GhostTextDoFocus", function () {
                        ghostTextAceEditor.focus();
                    });

                    ghostTextAceDiv.addEventListener("GhostTextDoBlur", function () {
                        ghostTextAceEditor.blur();
                    });

                    ghostTextAceDiv.addEventListener("GhostTextServerSelectionChanged", function (e) {
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
                        var ghostTextAceScrollerDiv = ghostTextAceDiv.querySelector(".ace_scroller");
                        ghostTextAceScrollerDiv.style.transition = "box-shadow 1s cubic-bezier(.25,2,.5,1)";
                        ghostTextAceScrollerDiv.style.boxShadow = "rgb(0,173,238) 0 0 20px 5px inset";
                    });

                    ghostTextAceDiv.addEventListener("GhostTextRemoveHighlight", function () {
                        var ghostTextAceScrollerDiv = ghostTextAceDiv.querySelector(".ace_scroller");
                        ghostTextAceScrollerDiv.style.boxShadow = "";
                    });

                    ghostTextAceEditorSession.on("change", function (e) {
                        window.setTimeout(function () {
                            var value = ghostTextAceEditorSession.getValue();
                            var customEvent = CustomEvent;
                            var inputEvent = new customEvent("GhostTextJSCodeEditorInput", { detail: { text: value } });
                            ghostTextAceDiv.dispatchEvent(inputEvent);
                        }, 100);
                    });

                    ghostTextAceEditor.on("focus", function (e) {
                        var value = ghostTextAceEditorSession.getValue();
                        var customEvent = CustomEvent;
                        var focusEvent = new customEvent("GhostTextJSCodeEditorFocus", { detail: { text: value } });
                        ghostTextAceDiv.dispatchEvent(focusEvent);
                    });
                };
            };
            return AceCodeEditor;
        })(InputArea.JSCodeEditor);
        InputArea.AceCodeEditor = AceCodeEditor;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var CodeMirror = (function (_super) {
            __extends(CodeMirror, _super);
            function CodeMirror() {
                _super.apply(this, arguments);
            }
            CodeMirror.prototype.getScript = function () {
                return function (id) {
                    console.log(id);
                    var ghostTextCodeMirrorDiv = document.querySelector("#" + id);
                    var ghostTextCodeMirrorEditor = ghostTextCodeMirrorDiv.CodeMirror;

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
                                ghostTextCodeMirrorEditor.doc.setSelection(start, end);
                            } else {
                                ghostTextCodeMirrorEditor.doc.addSelection(start, end);
                            }
                        }
                    });

                    ghostTextCodeMirrorDiv.addEventListener("GhostTextDoHighlight", function () {
                        var ghostTextCodeMirrorSizerDiv = ghostTextCodeMirrorDiv.querySelector(".CodeMirror-sizer");
                        ghostTextCodeMirrorSizerDiv.style.transition = "box-shadow 1s cubic-bezier(.25,2,.5,1)";
                        ghostTextCodeMirrorSizerDiv.style.boxShadow = "rgb(0,173,238) 0 0 20px 5px inset";
                    });

                    ghostTextCodeMirrorDiv.addEventListener("GhostTextRemoveHighlight", function () {
                        var ghostTextCodeMirrorSizerDiv = ghostTextCodeMirrorDiv.querySelector(".CodeMirror-sizer");
                        ghostTextCodeMirrorSizerDiv.style.boxShadow = "";
                    });

                    ghostTextCodeMirrorEditor.on("change", function (e) {
                        var value = e.doc.getValue();
                        var customEvent = CustomEvent;
                        var inputEvent = new customEvent("GhostTextJSCodeEditorInput", { detail: { text: value } });
                        ghostTextCodeMirrorDiv.dispatchEvent(inputEvent);
                    });

                    ghostTextCodeMirrorEditor.on("focus", function (e) {
                        var value = e.doc.getValue();
                        var customEvent = CustomEvent;
                        var focusEvent = new customEvent("GhostTextJSCodeEditorFocus", { detail: { text: value } });
                        ghostTextCodeMirrorDiv.dispatchEvent(focusEvent);
                    });
                };
            };
            return CodeMirror;
        })(InputArea.JSCodeEditor);
        InputArea.CodeMirror = CodeMirror;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var ContentEditable = (function () {
            function ContentEditable() {
                this.contentEditableElement = null;
                this.textChangedEventCB = null;
                this.selectionChangedEventCB = null;
                this.removeEventCB = null;
                this.focusEventCB = null;
                this.unloadEventCB = null;
                this.inputEventListener = null;
                this.focusEventListener = null;
                this.beforeUnloadListener = null;
            }
            ContentEditable.prototype.bind = function (domElement) {
                this.contentEditableElement = domElement;
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

                if (this.browser === 1 /* Firefox */) {
                    this.contentEditableElement.addEventListener('DOMCharacterDataModified', this.inputEventListener, false);
                }

                this.beforeUnloadListener = function () {
                    if (that.unloadEventCB) {
                        that.unloadEventCB(that);
                    }
                };
                window.addEventListener('beforeunload', this.beforeUnloadListener);
            };

            ContentEditable.prototype.unbind = function () {
                this.contentEditableElement.removeEventListener('focus', this.focusEventListener);
                this.contentEditableElement.removeEventListener('input', this.inputEventListener);

                if (this.browser === 1 /* Firefox */) {
                    this.contentEditableElement.removeEventListener('DOMCharacterDataModified', this.inputEventListener);
                }

                window.removeEventListener('beforeunload', this.beforeUnloadListener);
                this.removeHighlight();
            };

            ContentEditable.prototype.focus = function () {
                this.contentEditableElement.focus();
            };

            ContentEditable.prototype.blur = function () {
                this.contentEditableElement.blur();
            };

            ContentEditable.prototype.textChangedEvent = function (callback) {
                this.textChangedEventCB = callback;
            };

            ContentEditable.prototype.selectionChangedEvent = function (callback) {
                this.selectionChangedEventCB = callback;
            };

            ContentEditable.prototype.removeEvent = function (callback) {
                this.removeEventCB = callback;
            };

            ContentEditable.prototype.focusEvent = function (callback) {
                this.focusEventCB = callback;
            };

            ContentEditable.prototype.unloadEvent = function (callback) {
                this.unloadEventCB = callback;
            };

            ContentEditable.prototype.getText = function () {
                return this.contentEditableElement.innerHTML;
            };

            ContentEditable.prototype.setText = function (text) {
                if (this.contentEditableElement.innerHTML === text) {
                    return;
                }

                this.contentEditableElement.innerHTML = text;
            };

            ContentEditable.prototype.getSelections = function () {
                return new InputArea.Selections([]);
            };

            ContentEditable.prototype.setSelections = function (selections) {
            };

            ContentEditable.prototype.buildChange = function () {
                return new InputArea.TextChange(this.getText(), this.getSelections().getAll());
            };

            ContentEditable.prototype.setBrowser = function (browser) {
                this.browser = browser;
            };

            ContentEditable.prototype.highlight = function () {
                this.contentEditableElement.style.transition = 'box-shadow 1s cubic-bezier(.25,2,.5,1)';
                this.contentEditableElement.style.boxShadow = 'rgb(0,173,238) 0 0 20px 5px inset';
            };

            ContentEditable.prototype.removeHighlight = function () {
                this.contentEditableElement.style.boxShadow = '';
            };
            return ContentEditable;
        })();
        InputArea.ContentEditable = ContentEditable;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
var GhostText;
(function (GhostText) {
    (function (InputArea) {
        var GoogleEditable = (function () {
            function GoogleEditable() {
                this.googleEditableElement = null;
                this.textChangedEventCB = null;
                this.selectionChangedEventCB = null;
                this.removeEventCB = null;
                this.focusEventCB = null;
                this.unloadEventCB = null;
                this.inputEventListener = null;
                this.focusEventListener = null;
                this.beforeUnloadListener = null;
            }
            GoogleEditable.prototype.bind = function (domElement) {
                this.googleEditableElement = domElement;
                console.log(domElement);
                var that = this;

                this.focusEventListener = function () {
                    if (that.focusEventCB) {
                        that.focusEventCB(that);
                    }

                    that.highlight();
                };
                this.googleEditableElement.addEventListener('click', this.focusEventListener, false);

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
            };

            GoogleEditable.prototype.unbind = function () {
                this.googleEditableElement.removeEventListener('click', this.focusEventListener);
                this.googleEditableElement.removeEventListener('DOMCharacterDataModified', this.inputEventListener);

                window.removeEventListener('beforeunload', this.beforeUnloadListener);
                this.removeHighlight();
            };

            GoogleEditable.prototype.focus = function () {
                this.googleEditableElement.focus();
            };

            GoogleEditable.prototype.blur = function () {
                this.googleEditableElement.blur();
            };

            GoogleEditable.prototype.textChangedEvent = function (callback) {
                this.textChangedEventCB = callback;
            };

            GoogleEditable.prototype.selectionChangedEvent = function (callback) {
                this.selectionChangedEventCB = callback;
            };

            GoogleEditable.prototype.removeEvent = function (callback) {
                this.removeEventCB = callback;
            };

            GoogleEditable.prototype.focusEvent = function (callback) {
                this.focusEventCB = callback;
            };

            GoogleEditable.prototype.unloadEvent = function (callback) {
                this.unloadEventCB = callback;
            };

            GoogleEditable.prototype.getText = function () {
                return this.googleEditableElement.innerHTML;
            };

            GoogleEditable.prototype.setText = function (text) {
                if (this.googleEditableElement.innerHTML === text) {
                    return;
                }

                this.googleEditableElement.innerHTML = text;
            };

            GoogleEditable.prototype.getSelections = function () {
                return new InputArea.Selections([]);
            };

            GoogleEditable.prototype.setSelections = function (selections) {
            };

            GoogleEditable.prototype.buildChange = function () {
                return new InputArea.TextChange(this.getText(), this.getSelections().getAll());
            };

            GoogleEditable.prototype.setBrowser = function (browser) {
                this.browser = browser;
            };

            GoogleEditable.prototype.highlight = function () {
                this.googleEditableElement.style.transition = 'box-shadow 1s cubic-bezier(.25,2,.5,1)';
                this.googleEditableElement.style.boxShadow = 'rgb(0,173,238) 0 0 20px 5px inset';
            };

            GoogleEditable.prototype.removeHighlight = function () {
                this.googleEditableElement.style.boxShadow = '';
            };
            return GoogleEditable;
        })();
        InputArea.GoogleEditable = GoogleEditable;
    })(GhostText.InputArea || (GhostText.InputArea = {}));
    var InputArea = GhostText.InputArea;
})(GhostText || (GhostText = {}));
