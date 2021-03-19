import Events from '../core/Events';

const CLICK = "editor.click";
const PANEL_OPEN = "editor.panel.open";
const PANEL_CLOSE = "editor.panel.close";

export let EditorEvents = {

    click(id: string): void {
        Events.emit(CLICK, id);
    },

    onClick(action: (id: string) => void) {
        return Events.addListener(CLICK, function(data) {
            action(data as string);
        });
    },

    panel: {

        open(panel: string) {
            Events.emit(PANEL_OPEN, panel);
        },

        onOpen(action: (panel: string) => void) {
            return Events.addListener(PANEL_OPEN, function(data) {
                action(data as string);
            });
        },

        close(panel: string) {
            Events.emit(PANEL_CLOSE, panel);
        },

        onClose(action: (panel: string) => void) {
            return Events.addListener(PANEL_CLOSE, function(data) {
                action(data as string);
            });
        },

    }

}

export default EditorEvents;