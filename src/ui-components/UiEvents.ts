import { EventBus, EventCallback } from '../js/core/Events'; 

export type ClickEvent = {
    event: string,
    // Target can be undefined for simulated click events.
    target: HTMLElement | undefined,
}

export type SelectEvent = {
    group: string,
    event: string | undefined,
    target: HTMLElement | undefined,
}

class UiEventBus extends EventBus {
    constructor() {
        super();
    }

    /**     
     * @param event An identification string for this click event.
     * @param target Triggering HTML element, or undefined if the event is synthetic.
     */
    emitClick(event: string, target: HTMLElement | undefined): Promise<void> {
        return this.emit("click", {
            "event": event,
            "target": target
        } as ClickEvent);
    }

    /**
     * 
     * @param event An identification string for this event (use undefined to clear selection).
     * @param group A group inside of which the selection is performed.
     * @param target Triggering HTML element, or undefined if the event is synthetic.
     */
    emitSelection(event: string | undefined, group: string, target: HTMLElement | undefined): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                // Update elements to desired value.
                document.querySelectorAll(`[group=${group}]`).forEach((node) => {
                    let button = node as HTMLElement;
                    button.classList.toggle("selected", button.getAttribute("event") == event);
                });                
                // Then emit value.
                this.emit("select", {
                    "group": group,
                    "event": event,
                    "target": target
                } as SelectEvent).then(() => resolve());
            }, 0);
        })        
    }

    addClickListener(event: string | undefined, callback: EventCallback<ClickEvent>): EventCallback<ClickEvent> {
        if (event === undefined) {
            return this.addListener("click", callback);
        } else {
            return this.addListener("click", (e: ClickEvent) => {
                if (e.event == event) {
                    callback(e);
                }
            });
        }
    }

    addSelectionListener(group: string | undefined, callback: EventCallback<SelectEvent>): EventCallback<SelectEvent> {
        if (group === undefined) {
            return this.addListener("select", callback);
        } else {
            return this.addListener("select", (e: SelectEvent) => {
                if (e.group == group) {
                    callback(e);
                }
            });
        }
    }
}

export let ui_events: UiEventBus = new UiEventBus();
export default ui_events;