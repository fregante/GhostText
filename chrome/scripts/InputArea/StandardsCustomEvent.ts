module GhostText.InputArea {
    declare function cloneInto(detailData: any, window: Window): any;

    /**
     * CustomEvent TS Workaround.
     *
     * @see http://stackoverflow.com/questions/17571982/dispatching-custom-events#17575452
     */
    export class StandardsCustomEvent {
        static get(browser: Browser, eventType: string, data: {detail: any}): CustomEvent {
            if (browser == Browser.Firefox) {
                var cloned = cloneInto(data.detail, document.defaultView);
                var event = <any>document.createEvent('CustomEvent');
                event.initCustomEvent(eventType, true, true, cloned);

                return <CustomEvent> event;
            }

            var customEvent = <any>CustomEvent;
            var event = new customEvent(eventType, data);

            return <CustomEvent> event;
        }
    }
}