import Events, { VariableData } from './EditorEvents';
import CytoscapeStyle from './CytoscapeStyles';
import Config from '../core/Config';
import cytoscape from 'cytoscape';

/**
 * Cytoscape editor is responsible for visually representing the regulation graph. It is 
 * also the source of truth for the regulatory graph, because it has all information about
 * regulations and node positions.
 */
export let Cytoscape: {
    _container: HTMLElement,
    _cytoscape: cytoscape.Core,    
	_create_variable: (variable: VariableData) => void,
    init: (container: HTMLElement) => void,
	cy: () => cytoscape.Core,	
} = {

    _container: undefined,
    _cytoscape: undefined,

	_create_variable: function(variable: VariableData) {
		let cy = this._cytoscape as cytoscape.Core;

		let existing = cy.getElementById(variable.id);
		if (existing.length > 0) {
			existing.data().name = variable.name;			
			console.log("Varialbe with id", variable.id, "already exists. Skipping.");
			return;
		}

		if (variable.position === undefined) {
			// If position is undefined, a new position will be created slightly
			// to the left/bottom of the rightmost variable node in the graph.
			let right_most: cytoscape.Position = { x: 0, y: 0 };
			cy.$('node[type = "variable"]').forEach((node) => {
				let position = node.position();
				if (position.x > right_most.x) {
					right_most = position;
				}
			});			
			variable.position = {
				x: right_most.x + 40,
				y: right_most.y + 40,
			};
		}

		let new_node: cytoscape.NodeDefinition = {
			data: { id: variable.id, name: variable.name, type: "variable" },
			position: { x: variable.position.x, y: variable.position.y },
		}
		
		cy.add(new_node);
	},

	cy(): cytoscape.Core {
		return this._cytoscape as cytoscape.Core;
	},

    init(container: HTMLElement) {
        this._container = container;
        let cy = cytoscape({
            container: container,
            layout: DefaultLayout,
            boxSelectionEnabled: true,
            style: CytoscapeStyle,
        });
        this._cytoscape = cy;        

		/*
			Variable highlight events when mouse-over on a variable node.
		*/

		cy.on('mouseover', 'node[type = "variable"]', function(event) {
			document.body.style.cursor = "pointer";
			let node = event.target as cytoscape.NodeSingular;						
			Events.model.variable.highlight(node.id(), true);
		});

		cy.on('mouseout', 'node[type = "variable"]', function(event) {
			document.body.style.cursor = "auto";
			let node = event.target as cytoscape.NodeSingular;			
			Events.model.variable.highlight(node.id(), false);
		});

		Events.model.variable.onHighlight((data) => {
			let node = cy.$id(data.id);
			if (node.length > 0) {
				if (data.highlighted) {
					node.addClass("highlighted");
				} else {
					node.removeClass("highlighted");
				}
			}
		});

		/*
			Mark pressed variable with a special class.
		*/

		cy.on('mousedown', 'node[type = "variable"]', function(event) {
			let node = event.target as cytoscape.NodeSingular;
			node.addClass("pressed");
		});

		cy.on('mouseup', 'node[type = "variable"]', function(event) {
			let node = event.target as cytoscape.NodeSingular;
			node.removeClass("pressed");
		});

		/*
			Also mark dragged variable with a special class.
		*/

		cy.on('drag', 'node[type = "variable"]', function(event) {
			let node = event.target as cytoscape.NodeSingular;
			node.addClass("dragged");
		});

		cy.on('dragfree', 'node[type = "variable"]', function(event) {
			let node = event.target as cytoscape.NodeSingular;
			node.removeClass("dragged");
		})

		/*
			When a variable is selected, also send event with all selected variables.
		*/

		let selection_handler = function(event: cytoscape.EventObject) {
			let selection = event.cy.$("node:selected");
			let ids: string[] = [];
			selection.forEach((item) => {				
				ids.push(item.id());
			});
			Events.model.variable.selection(ids);
		}

		cy.on('select', selection_handler);
		cy.on('unselect', selection_handler);

		Events.model.onClear(() => {
			let cy = this.cy() as cytoscape.Core;
			// Ensures every element is unselected before it is removed, because 
			// this can reset other GUI elements. We generally don't expect a node
			// to be highlighted or dragged while this is happening.
			cy.$(':selected').unselect();
			cy.elements().remove();
		})

		Events.model.variable.onCreate((variable) => {
			this._create_variable(variable);
		});
    },

}

export default Cytoscape;

if (Config.DEBUG_MODE) {
	(window as any).cytoscape = Cytoscape;
}

// Some sensible default values for graph layout.
let DefaultLayout: cytoscape.LayoutOptions = {
    animate: true,
    animationDuration: 300,
    refresh: 20,
    fit: true,
    name: 'cose',
    padding: 250,
    nodeOverlap: 10,
    nodeDimensionsIncludeLabels: true,
}