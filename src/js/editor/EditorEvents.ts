import Events from '../core/Events';
import Config from '../core/Config';

const CLICK = "editor.click";
const PANEL_OPEN = "editor.panel.open";
const PANEL_CLOSE = "editor.panel.close";

const MODEL_CLEAR = "model.clear";
const MODEL_VARIABLE_HIGHLIGHT = "model.variable.highlight";
const MODEL_VARIABLE_SELECTION = "model.variable.selection";
const MODEL_VARIABLE_CREATE = "model.variable.create";

type Highlighted = { id: string, highlighted: boolean };

export type VariableData = {
    id: string,
    name: string,
    position?: { x: number, y: number },
}

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

    },

    model: {

        clear() {
            Events.emit(MODEL_CLEAR, true);
        },

        onClear(action: () => void) {
            return Events.addListener(MODEL_CLEAR, function() {
                action();
            });
        },

        variable: {

            highlight(id: string, on: boolean) {
                Events.emit(MODEL_VARIABLE_HIGHLIGHT, { id: id, highlighted: on });
            },

            onHighlight(action: (data: Highlighted) => void) {
                return Events.addListener(MODEL_VARIABLE_HIGHLIGHT, function(data) {
                    action(data as Highlighted);
                });
            },

            selection(ids: string[]) {
                Events.emit(MODEL_VARIABLE_SELECTION, ids);
            },

            onSelection(action: (ids: string[]) => void) {
                return Events.addListener(MODEL_VARIABLE_SELECTION, function(data) {
                    action(data as string[]);
                });
            },

            create(variable: VariableData) {
                Events.emit(MODEL_VARIABLE_CREATE, variable);
            },

            onCreate(action: (variable: VariableData) => void) {
                return Events.addListener(MODEL_VARIABLE_CREATE, function(data) {
                    action(data as VariableData);
                });
            },

        }

    }

}

if (Config.DEBUG_MODE) {
	(window as any).editor = EditorEvents;
}

export default EditorEvents;