import Events from '../core/Events';
import Config from '../core/Config';

const CLICK = "editor.click";
const PANEL_OPEN = "editor.panel.open";
const PANEL_CLOSE = "editor.panel.close";

const MODEL_CLEAR = "model.clear";

const MODEL_VARIABLE_HIGHLIGHT = "model.variable.highlight";
const MODEL_VARIABLE_SELECTION = "model.variable.selection";
const MODEL_VARIABLE_CREATE = "model.variable.create";
const MODEL_VARIABLE_REMOVE = "model.variable.remove";

const MODEL_REGULATION_HIGHLIGHT = "model.regulation.highlight";
const MODEL_REGULATION_SELECTION = "model.regulation.selection";
const MODEL_REGULATION_CREATE = "model.regulation.create";
const MODEL_REGULATION_REMOVE = "model.regulation.remove";

export type EdgeId = [string, string];
export type HighlightedNode = { id: string, highlighted: boolean };
export type HighlightedEdge = { edge: EdgeId, highlighted: boolean };

export type VariableData = {
    id: string,
    name: string,
    position?: { x: number, y: number },
}

export type RegulationData = {
    regulator: string,
    target: string,
    observable: boolean,
    monotonicity: null | "activation" | "inhibition",
}

export let EditorEvents = {

    click(id: string): void {
        Events.emit(CLICK, id);
    },

    onClick(id: string, action: () => void) {
        return Events.addListener(CLICK, function(data) {
            if (data == id) {
                action();
            }
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

            onHighlight(action: (data: HighlightedNode) => void) {
                return Events.addListener(MODEL_VARIABLE_HIGHLIGHT, function(data) {
                    action(data as HighlightedNode);
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

            remove(id: string) {
                Events.emit(MODEL_VARIABLE_REMOVE, id);
            },

            onRemove(action: (id: string) => void) {
                return Events.addListener(MODEL_VARIABLE_REMOVE, function(data) {
                    action(data as string);
                })
            },

        },

        regulation: {

            highlight(edge: EdgeId, on: boolean) {
                Events.emit(MODEL_REGULATION_HIGHLIGHT, { edge: edge, highlighted: on });
            },

            onHighlight(action: (data: HighlightedEdge) => void) {
                return Events.addListener(MODEL_REGULATION_HIGHLIGHT, function(data) {
                    action(data as HighlightedEdge);
                });
            },

            selection(edges: EdgeId[]) {
                Events.emit(MODEL_REGULATION_SELECTION, edges);
            },

            onSelections(action: (edges: EdgeId[]) => void) {
                return Events.addListener(MODEL_REGULATION_SELECTION, function(data) {
                    action(data as EdgeId[]);
                });
            },

            create(regulation: RegulationData) {
                Events.emit(MODEL_REGULATION_CREATE, regulation);
            },

            onCreate(action: (regulation: RegulationData) => void) {
                return Events.addListener(MODEL_REGULATION_CREATE, function(data) {
                    action(data as RegulationData);
                });
            },

            remove(id: EdgeId) {
                Events.emit(MODEL_REGULATION_REMOVE, id);
            },

            onRemove(action: (id: EdgeId) => void) {
                return Events.addListener(MODEL_REGULATION_REMOVE, function(data) {
                    action(data as EdgeId);
                })
            },

        },       

    }

}

if (Config.DEBUG_MODE) {
	(window as any).editor = EditorEvents;
}

export default EditorEvents;