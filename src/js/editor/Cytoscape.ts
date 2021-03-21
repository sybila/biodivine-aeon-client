import Events, { EdgeId, RegulationData, VariableData } from './EditorEvents';
import CytoscapeStyle from './CytoscapeStyles';
import CytoscapeEdgehandles from './CytoscapeEdgehandles';
import Config from '../core/Config';
import NodeMenu from './FloatingNodeMenu';
import cytoscape from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';

// The typescript declaration for `edgehandles` object is messed up for some reason,
// but this works just fine.
cytoscape.use(((edgehandles as unknown) as cytoscape.Ext));

/**
 * Cytoscape editor is responsible for visually representing the regulation graph. It is 
 * also the source of truth for the regulatory graph, because it has all information about
 * regulations and node positions.
 */
export let Cytoscape: {
    _container: HTMLElement,
    _cytoscape: cytoscape.Core,    
	_edgehandles: cytoscape.EdgeHandlesApi,
	_create_variable: (variable: VariableData) => void,
	_create_regulation: (regulation: RegulationData) => void,
	_find_regulation_edge: (edge: EdgeId) => cytoscape.EdgeCollection,
	_render_selected_node_menu: () => void,
    init: (container: HTMLElement) => void,
	cy: () => cytoscape.Core,	
} = {

    _container: undefined,
    _cytoscape: undefined,
	_edgehandles: undefined,

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

	_create_regulation: function(regulation: RegulationData) {
		let cy = this._cytoscape as cytoscape.Core;

		let existing = cy.edges(`[source = "${regulation.regulator}"][target = "${regulation.target}"]`);
		if (existing.length > 0) {
			let data = existing[0].data();
			data.monotonicity = regulation.monotonicity;
			data.observable = regulation.observable;
			console.log("Regulation ", regulation.regulator, "->", regulation.target, "already exists. Skipping.");
		}

		cy.add({
			group: 'edges', data: {
				source: regulation.regulator, 
				target: regulation.target,
				observable: regulation.observable,
				monotonicity: regulation.monotonicity,
			}
		});
	},

	_find_regulation_edge: function(edge: EdgeId): cytoscape.EdgeCollection {
		let cy = this._cytoscape as cytoscape.Core;
		return cy.edges(`[source = "${edge[0]}"][target = "${edge[1]}"]`);		
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

		let edge_handles = cy.edgehandles(CytoscapeEdgehandles);
		
        this._cytoscape = cy;        
		this._edgehandles = edge_handles;

		/*
			Variable highlight events when mouse-over on a variable node.
		*/		

		cy.on('mouseover', 'node[type = "variable"]', function(event) {
			document.body.style.cursor = "pointer";
			let node = event.target as cytoscape.NodeSingular;						
			Events.model.variable.highlight(node.id(), true);
		});

		cy.on('mouseover', 'node.eh-handle', function() {
			document.body.style.cursor = "pointer";
		});

		cy.on('mouseout', 'node[type = "variable"]', function(event) {
			document.body.style.cursor = "auto";
			let node = event.target as cytoscape.NodeSingular;			
			Events.model.variable.highlight(node.id(), false);
		});

		cy.on('mouseout', 'node.eh-handle', function() {
			document.body.style.cursor = "auto";
		});

		cy.on('mousemove', (event) => {			
			// Unless anything other than a node is hovered, we want to remove edge handles.			
			if (event.target.length === undefined || event.target.length == 0) {
				edge_handles.hide();
			} else {
				let element = event.target[0] as cytoscape.Singular;
				if (element.group() !== "nodes") {
					edge_handles.hide();
				}
			}			
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

			Cytoscape._render_selected_node_menu();
		}

		cy.on('select', selection_handler);
		cy.on('unselect', selection_handler);

		/*
			Highlight events for graph edges.
		*/

		cy.on('mouseover', 'edge', function(event) {
			document.body.style.cursor = "pointer";
			let edge = event.target as cytoscape.EdgeSingular;
			Events.model.regulation.highlight([edge.source().id(), edge.target().id()], true);
		});

		cy.on('mouseout', 'edge', function(event) {
			document.body.style.cursor = "auto";
			let edge = event.target as cytoscape.EdgeSingular;
			Events.model.regulation.highlight([edge.source().id(), edge.target().id()], false);
		});

		Events.model.regulation.onHighlight((data) => {			
			let edge = this._find_regulation_edge(data.edge) as cytoscape.EdgeCollection;
			if (data.highlighted) {
				edge.addClass("highlighted");
			} else {
				edge.removeClass("highlighted");
			}
		});

		/*
			Listen to other model events to keep the graph up-to-date.
		*/

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

		Events.model.regulation.onCreate((regulation) => {
			this._create_regulation(regulation);
		});

		/*
			Listen to global zoom/pan events and node drag events and re-draw the floating menus.
		*/
		cy.on('zoom', function() {
			Cytoscape._render_selected_node_menu();
		});

		cy.on('pan', function() {
			Cytoscape._render_selected_node_menu();
		});

		cy.on('drag', 'node:selected', function() {
			Cytoscape._render_selected_node_menu();
		});
    },

	_render_selected_node_menu: function() {
		let cy = Cytoscape.cy();
		let selection = cy.$("node:selected");
		if (selection.length == 1) {
			let node = selection[0] as cytoscape.NodeSingular;				
			NodeMenu.renderAt(node.renderedPosition(), cy.zoom());
		} else {
			NodeMenu.hide();
		}
	}

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