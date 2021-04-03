import UiBus from '../../core/UiEvents';

/**
 * Listen to events that correspond to panels opening and closing, then 
 * respond accordingly.
 */
export function registerEvents(container: HTMLElement) {
    // Ensure that initially all panels are hidden.
    container.querySelectorAll('[data-panel]').forEach((node) => {
        node.classList.add("gone");
    });

    // When a panel is selected, make sure the displayed panel matches that.
    // (To close a panel, just run selection event with an unknown panel name)
    UiBus.onSelected('panels', (button) => {
        let selected = (button !== undefined) ? button.dataset["event"] : undefined;
        container.querySelectorAll('[data-panel]').forEach((node) => {
            let panel = node as HTMLElement;
            panel.classList.toggle("gone", !(panel.dataset["panel"] == selected));            
        });
    });
}

export default registerEvents;