module GhostText.InputArea {
    /**
     * GhostText input area text change class.
     * Defines a input area's text change including meta data.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export class TextChange {
        /**
         * Creates an new text change instance.
         *
         * @param text The changed text.
         * @param selections The input areas selections.
         * @param title The tab's title.
         * @param url The tab's url or host.
         * @param syntax Optional, the guessed syntax.
         */
        public constructor(
            public text: string = null,
            public selections: Array<Selection> = [],
            public title: string = window.document.title,
            public url: string = location.host,
            public syntax: string = '') {
        }
    }
}