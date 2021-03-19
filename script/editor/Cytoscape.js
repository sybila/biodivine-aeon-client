/*
	This component is responsible for managing an interactiive editor of the Boolean network 
	graph using the Cytoscape library.
*/

// Admissible node type values.
let NODE_VARIABLE = "variable";

// Some sensible default values for graph layout.
let CYTOSCAPE_DEFAULT_LAYOUT = {
    animate: true,
    animationDuration: 300,
    animationThreshold: 250,
    refresh: 20,
    fit: true,
    name: 'cose',
    padding: 250,
    nodeOverlap: 10,
    nodeDimensionsIncludeLabels: true,
}

// Modified version of the add_box-24px.svg with color explicitly set to blue and an additional background element which makes sure the plus sign is filled.
let ADD_BOX_SVG = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M4 4h16v16H4z"/><path fill="#6a7ea5" d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'

// Styling of cytoscape elements.
let CYTOSCAPE_STYLES = [
	{ 	// Style of the network variable nodes
		'selector': 'node[name]',
		'style': {			
			'label': 'data(name)',	
			'text-valign': 'center',
			'width': function(element) { return String(element.data().name.length*7)+"pt"; }, 
			'height': '10px',
			'shape': 'round-rectangle',
			'overlay-opacity': 0,
        'padding': '8pt',
        'background-color': '#efebe9',
        'font-family': 'Anonymous Pro',
        'font-size': '12pt',
        'border-width': '1pt',
        'border-color': '#bdb9b7',
        'border-style': 'solid',
		}
	},  				
	{	// When a node is highlighted by mouse or elsewhere in the editor, 
		// show it with a dashed blue border.
		'selector': 'node.highlighted',
		'style': {
			'border-width': '2pt',
			'border-color': '#6a7ea5',
			'border-style': 'dashed',                		
		}
	},
	{	// When a node is pressed, show it with a highlighted background.
		'selector': 'node.pressed',
		'style': {
			'background-color': '#d6d5d1',
		}
	},
	{	// When a node is dragged, give it a solid, slightly larger border.
		'selector': 'node.dragged',
		'style': {
			'border-width': '2pt',
	        'border-color': '#bdb9b7',
	        'border-style': 'solid',
		}
	},
	{	// A selected node has a thicker blue border.
		// Note that we don't use "native" `:selected` in Cytoscape
		// mainly for custoamizability.
		'selector': 'node.selected',
		'style': {
			'border-width': '2pt',
			'border-color': '#6a7ea5',
			'border-style': 'solid',
		}
	}
]

let Cytoscape = {

	_container: undefined,
	_cytoscape: undefined,

	init(container) {
		this._container = container;
		this._cytoscape = cytoscape({
			container: container,
			layout: CYTOSCAPE_DEFAULT_LAYOUT,
			boxSelectionEnabled: true,
			style: CYTOSCAPE_STYLES,
		});

		// When mouse-over/-out is detected in a variable, we send an event that the
		// variable should be highlighted. We also change the mouse cursor to a pointer.
		// This is done here instead of `model.variable.highlight` because these can
		// be triggered also by other user actions.

		this._cytoscape.on('mouseover', function(event) {
			let data = event.target.data();
			if (data.type === NODE_VARIABLE) {
				document.body.style.cursor = "pointer";
				Events.emit("model.variable.highlight", { id: data.id, highlighted: true });
			}
		});

		this._cytoscape.on('mouseout', function(event) {
			let data = event.target.data();
			if (data.type === NODE_VARIABLE) {
				document.body.style.cursor = "auto";
				Events.emit("model.variable.highlight", { id: data.id, highlighted: false });
			}
		});

		// On mouse down/up, just mark variable nodes as pressed. This has no direct
		// impact on the model, just visuals inside the editor.

		this._cytoscape.on('mousedown', function(event) {
			let data = event.target.data();
			if (data.type === NODE_VARIABLE) {				
				event.target.addClass("pressed");
			}
		});

		this._cytoscape.on('mouseup', function(event) {
			let data = event.target.data();			
			if (data.type === NODE_VARIABLE) {
				event.target.removeClass("pressed");
			}
		});

		// When a variable node is dragged, remove the "highlighted" border and only
		// keep a slightly larger normal border.

		this._cytoscape.on('drag', function(event) {
			let data = event.target.data();
			if (data.type === NODE_VARIABLE) {
				event.target.addClass("dragged");
			}
		});

		this._cytoscape.on('dragfree', function(event) {
			let data = event.target.data();
			if (data.type === NODE_VARIABLE) {
				event.target.removeClass("dragged");
			}
		});

		// When a variable is selected, emit event, similar to highlight.

		this._cytoscape.on('select', function(event) {
			let data = event.target.data();
			if (data.type === NODE_VARIABLE) {
				Events.emit("model.variable.select", { id: data.id, selected: true });
			}
		});

		this._cytoscape.on('unselect', function(event) {
			let data = event.target.data();
			if (data.type === NODE_VARIABLE) {
				Events.emit("model.variable.select", { id: data.id, selected: false });
			}
		});

		Events.addListener("model.variable.highlight", (data) => {
			let node = this._cytoscape.$id(data.id);
			if (data.highlighted) {
				node.addClass("highlighted");
			} else {
				node.removeClass("highlighted");
			}
		});

		Events.addListener("model.variable.select", (data) => {
			let node = this._cytoscape.$id(data.id);
			if (data.selected) {				
				node.addClass("selected");
			} else {
				node.removeClass("selected");
			}

			// TODO: Show node menu, but only when a single node is selected,
			// since multinode selection is enabled.
		})
	},

}