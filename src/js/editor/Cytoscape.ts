import Events, { EdgeId, RegulationData, VariableData } from './EditorEvents';
import CytoscapeStyle from './CytoscapeStyles';
import CytoscapeEdgehandles from './CytoscapeEdgehandles';
import Config from '../core/Config';
import NodeMenu from './FloatingNodeMenu';
import EdgeMenu from './FloatingEdgeMenu';
import register_events from './CytoscapeEvents';
import Import from './Import';
import cytoscape, { NodeSingular } from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import coseBilkent from 'cytoscape-cose-bilkent';
import dagre from 'cytoscape-dagre';
import collapse from 'cytoscape-expand-collapse';

// The typescript declaration for `edgehandles` object is messed up for some reason,
// but this works just fine.
cytoscape.use((edgehandles as unknown) as cytoscape.Ext);
cytoscape.use((coseBilkent as unknown) as cytoscape.Ext);
cytoscape.use((dagre as unknown) as cytoscape.Ext);
cytoscape.use((collapse as unknown) as cytoscape.Ext);

/**
 * Cytoscape editor is responsible for visually representing the regulation graph. It is 
 * also the source of truth for the regulatory graph, because it has all information about
 * regulations and node positions.
 */
export let Cytoscape: {
    _container: HTMLElement,
    _cytoscape: cytoscape.Core,    
	_edgehandles: cytoscape.EdgeHandlesApi,
	_collapse: any,
	_scc_nodes_enabled: boolean,
	_last_click: number,	// Used for detection of double-click events.
	_ensure_variable: (variable: VariableData) => void,
	_remove_variable: (id: string) => void,
	_ensure_regulation: (regulation: RegulationData) => void,
	_remove_regulation: (id: EdgeId) => void,
	_find_regulation_edge: (edge: EdgeId) => cytoscape.EdgeCollection,
	_render_selected_node_menu: () => void,
	_render_selected_edge_menu: () => void,
    init: (container: HTMLElement) => void,
	cy: () => cytoscape.Core,
	/* True if *something* is selected. */
	has_selection: (selector?: string) => boolean,
	/* Clear all selected elements (also triggering unselect events for them). */
	clear_selection: () => void,
	/* Ids of currently selected variables. */
	selected_node_ids: () => string[],
	/* Ids of currently selected regulations. */
	selected_edge_ids: () => EdgeId[],
	/* Get data of a specific regulation, or undefined if it does not exist. */
	regulation_data: (id: EdgeId) => RegulationData | undefined,
	/* Get data of a specific variable, or undefined if it does not exist. */
	variable_data: (id: string) => VariableData | undefined,
	/* Render floating edge and node menus at appropriate positions. */
	redraw_menus: () => void,
	/* 	Savely remove all graph elements.
		However, this method will not invoke any events for the removed entities.
	 */
	clear: () => void,
	/* True if the graph is empty. */
	is_empty: () => boolean,
	/* Zoom/pan the model to fit it completely into viewport. */	
	viewport_fit: () => void,
	/* Apply automatic layout to the current graph. */
	apply_auto_layout: () => void,
	/* Create compund node for every SCC. */
	create_scc_nodes: () => void,
	/* Remove SCC compound nodes. */
	remove_scc_nodes: () => void,
} = {

    _container: undefined,
    _cytoscape: undefined,
	_edgehandles: undefined,
	_last_click: undefined,
	_collapse: undefined,
	_scc_nodes_enabled: false,

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

		if (Cytoscape._scc_nodes_enabled) {
			// Recompute SCCs when a regulation is created.
			Cytoscape.create_scc_nodes();
		}
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

	has_selection: function(selector?: string): boolean {
		let cy = Cytoscape.cy();
		if (typeof selector == "string") {
			return cy.$(selector+":selected").length > 0;
		} else {
			return cy.$(":selected").length > 0;
		}
	},

	clear_selection: function(): void {
		Cytoscape.cy().$(":selected").unselect();
	},

	variable_data: function(id: string): VariableData | undefined {
		let nodes = Cytoscape.cy().getElementById(id);
		if (nodes.length > 0) {
			let node = nodes[0];
			return {
				id: id,
				name: node.data().name,
				position: node.position()
			}
		} else {
			return undefined;
		}
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
		let expand_collapse = (cy as any).expandCollapse();

        this._cytoscape = cy;        
		this._edgehandles = edge_handles;		
		this._collapse = expand_collapse;

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
		
		{	// Detect double clicks and trigger variable creation for them.
			cy.on('click', (event) => {
				let original_event = event.originalEvent;
				if (original_event.getModifierState("Ctrl") ||
					original_event.getModifierState("Shift") ||
					original_event.getModifierState("Alt") ||
					original_event.getModifierState("Fn") ||
					original_event.getModifierState("Hyper") ||
					original_event.getModifierState("OS") ||
					original_event.getModifierState("Super") ||
					original_event.getModifierState("Win")) {
					return;	// Ignore click if it has some modifier key set.
				}
				if (event.target.length === undefined || event.target.length == 0) {
					// Only triggered when clicked into empty space.
					let now = (new Date()).getTime();
					if (this._last_click !== undefined && now - this._last_click < Config.DOUBLE_CLICK_DELAY) {
						Import.try_create_variable(undefined, undefined, event.position);
					}
					this._last_click = now;
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

	viewport_fit: function() {
		// The padding we want to apply is 10% of the larger viewport dimension.
		let padding = 0.1 * Math.max(window.innerWidth, window.innerHeight);
		Cytoscape.cy().animate({
			fit: {
				eles: Cytoscape.cy().elements(),
				padding: padding
			},
			duration: 200,
		});
	},

	apply_auto_layout: function() {
		/*
			This function uses various "random" Cytoscape extension from the internet and is
			therefore not typesafe. The layout algorithm starts by layouting each SCC individually
			using cose, then collapse SCCs into singular nodes, layout them using dagre, and then 
			expand the nodes back into the original graph.
		*/
		// First, ensure SCC nodes exist:
		let remove_scc_when_done = false;
		if (!this._scc_nodes_enabled) {
			remove_scc_when_done = true;
			Cytoscape.create_scc_nodes();
		}

		let cy = Cytoscape.cy();
		let scc_nodes = cy.nodes('[type = "scc"]');
		if (scc_nodes.length == 0) {
			// Graph is acyclic.
			cy.layout({
				name: 'dagre',
				spacingFactor: 1.5,
				directed: true,
				avoidOverlap: true,
				ranker: 'longest-path',
				edgeSep: 50,
				rankSep: 50,
				fit: true,
				animate: true,
				animationDuration: 300,
				nodeDimensionsIncludeLabels: true,
			} as cytoscape.LayoutOptions)
		} else {
			// First, process components:
			let collapse_and_expand = () => {
				Cytoscape._collapse.collapseAll({
					animate: false,
					fisheye: false,
					//cueEnable: false,
					animationDuration: 300,
					layoutBy: {
						name: 'dagre',						
						spacingFactor: 1.5,
						directed: true,						
						avoidOverlap: true,
						ranker: 'longest-path',
						edgeSep: 50,
						rankSep: 50,
						fit: false,
						animate: true,
						animationDuration: 300,
						nodeDimensionsIncludeLabels: true,
						ready: () => {
							setTimeout(() => {
								// Once the layout is done, start expansion again.
								Cytoscape._collapse.expandAll({
									animate: true,
									fisheye: false,
									//cueEnable: false,
									animationDuration: 1000,
									layoutBy: () => {
										Cytoscape.viewport_fit();

										if (remove_scc_when_done) {
											Cytoscape.remove_scc_nodes();
										}									
									},
								});
							}, 300);					
						}
					}
				})
			}
			let recursion = (i: number) => {
				if (i >= scc_nodes.length) {
					setTimeout(() => {
						collapse_and_expand();
					}, 300);					
					return;
				}

				let scc_node = scc_nodes[i];
				let child = scc_node.children()[0];
				let component = child.successors().intersect(child.predecessors());				
				component.layout(({
					name: 'cose-bilkent',
					animate: true,
					animationDuration: 300,
					fit: false,
					// Edge length depedns on the sqrt of the number of edges. 
					// More edges means we want to put the nodes further away to make more space
					idealEdgeLength: 30 * Math.max(2.0, Math.sqrt(component.edges().length)),
					nodeRepulsion: 10000,
    				nodeDimensionsIncludeLabels: true,
					ready: () => {
						// Once the layout is done, move to the next component.
						if (Config.DEBUG_MODE) { console.log("Finished layout of", component); }																		
						recursion(i + 1);
					}
				} as unknown) as cytoscape.CoseLayoutOptions).run();
			}
			recursion(0);
		}		
	},

	create_scc_nodes: function() {
		if (Cytoscape._scc_nodes_enabled) {
			Cytoscape.remove_scc_nodes();	// Clear existing SCCs.
		} else {
			Cytoscape._scc_nodes_enabled = true;
		}
		let cy = Cytoscape.cy();
		cy.elements().tarjanStronglyConnectedComponents().components.forEach((component) => {
			if (component.nodes().length > 1) {
				let scc_node = cy.add({ group: 'nodes', data: { type: 'scc' }, });
				component.nodes().move({ parent: scc_node.id() });
			}	
		});
	},

	remove_scc_nodes: function() {	
		Cytoscape._scc_nodes_enabled = false;			
		Cytoscape.cy().$("[type = 'scc']").children().move({ parent: null });
		Cytoscape.cy().$("[type = 'scc']").remove();	
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
    padding: (Math.max(window.innerWidth, window.innerHeight) * 0.1),
    nodeOverlap: 10,
    nodeDimensionsIncludeLabels: true,
}

Events.onClick("model-apply-layout", function() {	
	Cytoscape.apply_auto_layout();
});

Events.onClick("cytoscape-zoom-to-fit", function() {
	Cytoscape.viewport_fit();
});

Events.onClick("cytoscape-zoom-minus", function() {
	Cytoscape.cy().stop();
	Cytoscape.cy().animate({ 
		zoom: {
			level: Math.max(Cytoscape.cy().zoom() * 0.8, 0.001),
			renderedPosition: {
				x: Cytoscape._container.clientWidth / 2,
				y: Cytoscape._container.clientHeight / 2,
			},
		}, 
		duration: 100,
	});
});

Events.onClick("cytoscape-zoom-plus", function() {
	Cytoscape.cy().stop();
	Cytoscape.cy().animate({ 
		zoom: {
			level: Math.min(Cytoscape.cy().zoom() * 1.2, 100),
			renderedPosition: {
				x: Cytoscape._container.clientWidth / 2,
				y: Cytoscape._container.clientHeight / 2,
			},
		}, 
		duration: 100,
	});
});