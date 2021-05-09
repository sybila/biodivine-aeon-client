import { EventBus } from '../js/core/Events'; 

class UiEventBus extends EventBus {
    constructor() {
        super();
    }
}

export let ui_events: UiEventBus = new UiEventBus();
export default ui_events;