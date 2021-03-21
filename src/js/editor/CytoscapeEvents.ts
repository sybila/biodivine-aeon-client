import Dialogs, { ConfirmDialog } from '../core/Dialogs';
import Cytoscape from './Cytoscape';
import Events from './EditorEvents';

/*
    Just a file that registers all event-based interactions with the Cytoscape object.
*/

export function register() {

    {   // Toggle `highlighted` class when highlight event is fired for a variable/regulation.
        Events.model.variable.onHighlight((data) => {
            let node = Cytoscape.cy().$id(data.id);
            if (node.length > 0) {
                node.toggleClass("highlighted", data.highlighted);            
            }
        });
    
        Events.model.regulation.onHighlight((data) => {			
            let edge = Cytoscape._find_regulation_edge(data.edge);
            if (edge.length > 0) {
                edge.toggleClass("highlighted", data.highlighted);
            }            
        });
    }

    {   // Update graph when model changes.
        Events.model.onClear(function() {  Cytoscape.clear(); });

		Events.model.variable.onCreate(function(variable) { Cytoscape._ensure_variable(variable); });

		Events.model.variable.onRemove(function(id) { Cytoscape._remove_variable(id); });

		Events.model.regulation.onCreate(function(regulation) { Cytoscape._ensure_regulation(regulation); });

		Events.model.regulation.onRemove(function(id) { Cytoscape._remove_regulation(id); });
    }

    /* When "remove selection" event is fired, try to remove all selected graph elements. */
    Events.onClick("selected-remove", () => {
        let dialog: ConfirmDialog = {
            message: "Remove selected graph elements?",	// TODO: A nice more personalized message?
            onPositive: () => {
                let nodes = Cytoscape.selected_node_ids();
                for (let node of nodes) {
                    Events.model.variable.remove(node);
                }
                
                let edges = Cytoscape.selected_edge_ids();
                for (let edge of edges) {
                    Events.model.regulation.remove(edge);
                }
            }
        };
        Dialogs.confirm(dialog);
    });

    /* Toggle observability on selected edge. */
    Events.onClick("selected-toggle-observability", () => {
        let edges = Cytoscape.selected_edge_ids();
        if (edges.length == 1) {
            let data = Cytoscape.regulation_data(edges[0]);
            data.observable = !data.observable;            
            Events.model.regulation.create(data);
        }
    });

    /* Toggle monotonicty on selected edge. */
    Events.onClick("selected-toggle-monotonicity", () => {
        let edges = Cytoscape.selected_edge_ids();
        if (edges.length == 1) {
            let data = Cytoscape.regulation_data(edges[0]);
            if (data.monotonicity == null) {
                data.monotonicity = "activation";
            } else if (data.monotonicity == "activation") {
                data.monotonicity = "inhibition";
            } else {
                data.monotonicity = null;
            }

            Events.model.regulation.create(data);
        }
    });
    
}


export default register;