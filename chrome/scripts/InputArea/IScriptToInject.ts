module GhostText.InputArea {
    /**
     * Defines a glue script which has to be injected into the the browsers JS scope.
     * THis is needed by some input areas which works with a JS code editor.
     *
     * @licence The MIT License (MIT)
     * @author Guido Krömer <mail 64 cacodaemon 46 de>
     */
    export interface IScriptToInject {
        /**
         * Gets the script to inject.
         */
        getScript(): Function;
    }
}