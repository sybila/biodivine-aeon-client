import { EventBus, EventCallback } from "./Events";
import Config from './Config';


/**
 * UI Event Bus is an extension of the `EventBus` that is responsible for handling 
 * interactions with UI elements. Currently, there are three supported types of 
 * interaction:
 *  -   click: Set [data-clickable] on a HTML element and you can then listen 
 *      to clicks on elements with specific [data-event].
 *  -   edit: Set [data-editable] and whenever the element is unfocused, its value is 
 *      published to everyone who is listening for that specific [data-event].
 *  -   select: Set [data-selectable] and whenever the element is click, a select event
 *      for a particular [data-group] is invoked. Furthermore, if you also set [data-toggle],
 *      then clicking the element again will un-select it.
 * 
 * Edit elements are automatically kept in sync based on their [data-event]. For selectable
 * items, only the item with the last selected [data-event] has a "selected" class.
 */
class UiEventBus extends EventBus {
    
    constructor() {
        super();
        let bus = this;

        // Make sure [data-editable] with the same [data-event] are kept in sync.
        this.addListener("edit", (content: HTMLElement) => {
            document.querySelectorAll(`[data-event=${content.dataset["event"]}]`).forEach((node) => {
                (node as HTMLElement).innerHTML = content.innerHTML;
            });
        });
    
        // Make sure only the last clicked element in a group is selected. Then emit the actual
        // selection event (so that users don't see incinsistent state).
        this.addListener("select-raw", (event: HTMLElement) => {
            
        })    
    }

    /**
     * Register a listener that is invoked when a `HTMLElement` with [data-clickable]
     * is clicked, and its [data-event] matched the given name.
     */
    onClick(name: string, action: (button: HTMLElement) => void): EventCallback {
        return this.addListener("click", (button: HTMLElement) => {            
            if (button.dataset["event"] == name) {
                action(button);
            }
        });
    }

    /**
     * Register a listener that is invoked when a `HTMLElement` with [data-editable]
     * is unfocused and its [data-event] matches the given name.
     * 
     * Additionally, if the element has [data-default] specified, then this value will
     * be used if the element is empty. Also, if there are multiple editable elements
     * with the same [data-event], then their values will be kept in sync.
     */
    onEdit = function(name: string, action: (content: HTMLElement) => void): EventCallback {
        return this.addListener("edit", (content: HTMLElement) => {
            if (content.dataset["event"] == name) {
                action(content);
            }
        });
    }

    /**
     * Register a listener that is invoked when a `HTMLElement` with [data-selectable]
     * is clicked and its [data-group] matched the given name.
     * 
     * Additionally, the "selected" class will be added to this element and removed from 
     * all other elements in that group.
     */
    onSelected = function(group: string, action: (button: HTMLElement | undefined) => void): EventCallback {
        return this.addListener("select", (event: { group: string, selection: HTMLElement | undefined }) => {
            if (event.group == group) {
                action(event.selection);
            }
        });
    }

    /**
     * Registers event listeners for all children of the given element. Call this with `document`
     * to register the listeners everywhere.
     */
    registerEvents<T extends ParentNode>(element: T): T {
        let bus = this;

        // If element has data-clickable on it, emit a click event.
        element.querySelectorAll('[data-clickable]').forEach((node) => {
            (node as HTMLElement).onclick = function() {            
                let button = this as HTMLElement;
                button.blur();                
                bus.emit("click", button);
                if (Config.DEBUG_MODE) {
                    console.log(`Clicked ${button.dataset["event"]}.`);
                }
            };        
        });
    
        // If element has data-editable on it, post its value when it changes.
        element.querySelectorAll('[data-editable]').forEach((node) => {            
            // When value changes, publish event.
            (node as HTMLElement).onblur = function() {
                let editable = this as HTMLElement;
                if (editable.dataset["default"]) {  // If the element has a default value, apply it first.
                    let text = editable.innerText.trim();
                    if (text.length == 0) {
                        editable.innerHTML = editable.dataset["default"];
                    }
                }
                bus.emit("edit", editable);
                if (Config.DEBUG_MODE) {
                    console.log(`Changed ${editable.dataset["event"]} to ${editable.innerHTML}.`);
                }
            };                    
        });    
        
        // If element has data-selectable on it, post the value of the selected element
        element.querySelectorAll('[data-selectable]').forEach((node) => {
            (node as HTMLElement).onclick = function() {
                let clicked = this as HTMLElement;
                clicked.blur();
                let group = clicked.dataset["group"];                
                /* Update status of all other elements in the group. */
                document.querySelectorAll(`[data-group=${group}]`).forEach((node) => {
                    let button = node as HTMLElement;
                    let isClicked = button.dataset["event"] == clicked.dataset["event"];
                    if (isClicked && button.dataset["toggle"] !== undefined) {
                        // If a button with toggle is clicked, then actually toggle.
                        button.classList.toggle("selected");
                    } else {
                        // Otherwise set to expected value.
                        button.classList.toggle("selected", isClicked);
                    }                
                });
                if (clicked.classList.contains("selected")) {
                    bus.emit("select", { group: group, selection: clicked });
                } else {                    
                    bus.emit("select", { group: group, selection: undefined });
                }
                if (Config.DEBUG_MODE) {
                    console.log(`Selected ${(this as HTMLElement).dataset["event"]}.`);
                }                
            }
        });
    
        return element;
    };


}

export let ui_events: UiEventBus = new UiEventBus();
export default ui_events;