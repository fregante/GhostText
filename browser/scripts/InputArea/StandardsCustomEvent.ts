module GhostText.InputArea {
    declare function cloneInto(detailData: any, window: Window): any;

    /**
     * CustomEvent TS Workaround.
     *
     * @see http://stackoverflow.com/questions/17571982/dispatching-custom-events#17575452
     */
    export class StandardsCustomEvent {
        static get(browser: Browser, eventType: string, data: {detail: any}): CustomEvent {
            var customEvent = <any>CustomEvent;
            var event = new customEvent(eventType /*, data*/); // data causes an error in Firefox
            return <CustomEvent> event;
        }
    }
}