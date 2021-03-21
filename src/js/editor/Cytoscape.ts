import Events, { EdgeId, RegulationData, VariableData } from './EditorEvents';
import CytoscapeStyle from './CytoscapeStyles';
import CytoscapeEdgehandles from './CytoscapeEdgehandles';
import Config from '../core/Config';
import NodeMenu from './FloatingNodeMenu';
import EdgeMenu from './FloatingEdgeMenu';
import register_events from './CytoscapeEvents';
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
	_ensure_variable: (variable: VariableData) => void,
	_remove_variable: (id: string) => void,
	_ensure_regulation: (regulation: RegulationData) => void,
	_remove_regulation: (id: EdgeId) => void,
	_find_regulation_edge: (edge: EdgeId) => cytoscape.EdgeCollection,
	_render_selected_node_menu: () => void,
	_render_selected_edge_menu: () => void,
    init: (container: HTMLElement) => void,
	cy: () => cytoscape.Core,
	selected_node_ids: () => string[],
	selected_edge_ids: () => EdgeId[],
	regulation_data: (id: EdgeId) => RegulationData | undefined,
	redraw_menus: () => void,
	clear: () => void,
	is_empty: () => boolean,
} = {

    _container: undefined,
    _cytoscape: undefined,
	_edgehandles: undefined,

	_ensure_variable: function(variable: VariableData) {
		let cy = this._cytoscape as cytoscape.Core;

		let existing = cy.getElementById(variable.id);
		if (existing.length > 0) {
			existing.data().name = variable.name;	
			(cy.style() as any).update();	// For some reason, update is not in `style`.
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

	_remove_variable: function(id: string) {
		let cy = this._cytoscape as cytoscape.Core;
		let find = cy.$id(id);
		if (find.length > 0) {
			let node = find[0] as cytoscape.NodeSingular;			
			node.unselect();	// Just in case.
			node.outgoers().forEach((outgoing) => {
				Events.model.regulation.remove([node.id(), outgoing.id()]);
			});
			node.incomers().forEach((incoming) => {
				Events.model.regulation.remove([incoming.id(), node.id()]);
			})
			cy.remove(node);
			this.redraw_menus();
		} else {
			if (Config.DEBUG_MODE) {
				console.log("Variable", id, "does not exists. Cannot remove.");
			}
		}
	},

	_ensure_regulation: function(regulation: RegulationData) {
		let cy = this._cytoscape as cytoscape.Core;

		let existing = cy.edges(`[source = "${regulation.regulator}"][target = "${regulation.target}"]`);
		if (existing.length > 0) {
			let data = existing[0].data();
			data.monotonicity = regulation.monotonicity;
			data.observable = regulation.observable;
			(cy.style() as any).update();	// For some reason, update is not in `style`.
			if (existing[0].selected()) {
				this._render_selected_edge_menu();
			}
			return;
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

	_remove_regulation: function(this: typeof Cytoscape, id: EdgeId) {				
		let edge = this._find_regulation_edge(id) as cytoscape.EdgeCollection;
		edge.unselect();
		this._cytoscape.remove(edge);	
		this.redraw_menus();	
	},

	_find_regulation_edge: function(edge: EdgeId): cytoscape.EdgeCollection {
		let cy = this._cytoscape as cytoscape.Core;
		return cy.edges(`[source = "${edge[0]}"][target = "${edge[1]}"]`);		
	},

	selected_node_ids: function(): string[] {
		let selection: string[] = [];
		Cytoscape.cy().$("node:selected").forEach((node) => { selection.push(node.id()); });		
		return selection;
	},

	selected_edge_ids: function(): EdgeId[] {
		let selection: EdgeId[] = [];
		Cytoscape.cy().$("edge:selected").forEach((edge) => {
			selection.push([edge.source().id(), edge.target().id()]);
		})		
		return selection;
	},

	regulation_data: function(id: EdgeId): RegulationData | undefined {
		let edge = this._find_regulation_edge(id);
		if (edge.length == 1) {
			let data = edge.data();
			let regulation: RegulationData = { 
				regulator: data.source,
				target: data.target,
				observable: data.observable,
				monotonicity: data.monotonicity,
			}
			return regulation;
		} else {
			return undefined;
		}
	},

	redraw_menus: function(): void {
		this._render_selected_node_menu();
		this._render_selected_edge_menu();
	},

	clear: function(): void {
		let all_variables: string[] = [];
		Cytoscape.cy().nodes('[type = "variable"]').forEach((n) => { all_variables.push(n.id()); });
		for (let variable of all_variables) {
			this._remove_variable(variable);	// This also un-selects the nodes and edges.			
		}
	},

	is_empty: function(): boolean {
		return Cytoscape.cy().nodes('[type = "variable"]').length == 0;
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

		// Register basic interaction events with cytoscape god object.

		{	// Init mouse events to show pointer cursor and trigger highlight events.
			cy.on('mouseover', 'node[type = "variable"]', function(event) {
				document.body.style.cursor = "pointer";			
				Events.model.variable.highlight((event.target as cytoscape.NodeSingular).id(), true);
			});
	
			cy.on('mouseover', 'node.eh-handle', function() {
				document.body.style.cursor = "pointer";
			});
	
			cy.on('mouseout', 'node[type = "variable"]', function(event) {
				document.body.style.cursor = "auto";
				let node = event.target as cytoscape.NodeSingular;			
				Events.model.variable.highlight((event.target as cytoscape.NodeSingular).id(), false);
			});
	
			cy.on('mouseout', 'node.eh-handle', function() {
				document.body.style.cursor = "auto";
			});

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
		}
		
		{	// Mark pressed and dragged variables with a class so they can be styled separately.
			cy.on('mousedown', 'node[type = "variable"]', function(event) {
				(event.target as cytoscape.NodeSingular).addClass("pressed");				
			});

			cy.on('mouseup', 'node[type = "variable"]', function(event) {
				(event.target as cytoscape.NodeSingular).removeClass("pressed");				
			});

			cy.on('drag', 'node[type = "variable"]', function(event) {
				(event.target as cytoscape.NodeSingular).addClass("dragged");				
			});

			cy.on('dragfree', 'node[type = "variable"]', function(event) {
				(event.target as cytoscape.NodeSingular).removeClass("dragged");
			})
		}

		{	// When an element is selected/unselected, also emit global events.
			let selection_handler = function() {
				Events.model.variable.selection(Cytoscape.selected_node_ids());
				Events.model.regulation.selection(Cytoscape.selected_edge_ids());
			};
	
			cy.on('select', selection_handler);
			cy.on('unselect', selection_handler);
		}

		{	// When the visibility of the graph changes, trigger menu position re-calculation.
			cy.on('zoom', function() { Cytoscape.redraw_menus(); });
			cy.on('pan', function() { Cytoscape.redraw_menus(); });
			cy.on('drag', function() { Cytoscape.redraw_menus(); });
			cy.on('select', function() { Cytoscape.redraw_menus(); });
			cy.on('unselect', function() { Cytoscape.redraw_menus(); });
		}

		{ 	// Unless anything other than a node is hovered, we want to remove edge handles.
			cy.on('mousemove', (event) => {									
				if (event.target.length === undefined || event.target.length == 0) {
					edge_handles.hide();
				} else {
					let element = event.target[0] as cytoscape.Singular;
					if (element.group() !== "nodes") {
						edge_handles.hide();
					}
				}			
			});
		}				

		register_events();
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
	},

	_render_selected_edge_menu: function() {
		let cy = Cytoscape.cy();
		let selection = cy.$("edge:selected");
		if (selection.length == 1) {
			let edge = selection[0] as cytoscape.EdgeSingular;
			let data = edge.data();
			let boundingBox = edge.renderedBoundingBox({});
			let position = { x: (boundingBox.x1 + boundingBox.x2) / 2, y: (boundingBox.y1 + boundingBox.y2) / 2 };
			EdgeMenu.renderAt(position, cy.zoom(), data);
		} else {
			EdgeMenu.hide();
		}
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