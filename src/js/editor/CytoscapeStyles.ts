import cytoscape from "cytoscape";

// Modified version of the add_box-24px.svg with color explicitly set to blue and an additional background element which makes sure the plus sign is filled.
let ADD_BOX_SVG = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M4 4h16v16H4z"/><path fill="#6a7ea5" d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'

function nodeWidth(element: cytoscape.NodeSingular) {
	return String(element.data().name.length*7)+"pt";
}

function edgeLineStyle(element: cytoscape.EdgeSingular) {
	if (element.data().observable) {
		return "solid";
	} else {
		return "dashed";
	}
}

let node_styles: cytoscape.Stylesheet[] = [
	{ 	// Style of the network variable nodes
		'selector': 'node[type = "variable"]',
		'style': {			
			'label': 'data(name)',	
			'text-valign': 'center',
			'width': nodeWidth, 
			'height': '12pt',
			'shape': 'round-rectangle',
			'overlay-opacity': 0,            
            'background-color': '#efebe9',
            'font-family': 'Anonymous Pro',
            'font-size': '12pt',
			'padding-left': '8pt',
			'padding-right': '8pt',
            'border-width': '1pt',
            'border-color': '#bdb9b7',
            'border-style': 'solid',
		}
	},  				
	{	// When a node is highlighted by mouse or elsewhere in the editor, 
		// show it with a dashed blue border.
		'selector': 'node[type = "variable"].highlighted',
		'style': {
			'border-width': '2pt',
			'border-color': '#6a7ea5',
			'border-style': 'dashed',                		
		}
	},
	{	// When a node is pressed, show it with a highlighted background.
		'selector': 'node[type = "variable"].pressed',
		'style': {
			'background-color': '#d6d5d1',
		}
	},
	{	// When a node is dragged, give it a solid, slightly larger border.
		'selector': 'node[type = "variable"].dragged',
		'style': {
			'border-width': '2pt',
	        'border-color': '#bdb9b7',
	        'border-style': 'solid',
		}
	},
	{	// A selected node has a thicker blue border.		
		'selector': 'node[type = "variable"]:selected',
		'style': {
			'border-width': '2pt',
			'border-color': '#6a7ea5',
			'border-style': 'solid',
		}
	},
]

let edge_styles: cytoscape.Stylesheet[] = [
	{	// General style of the graph edge.
		'selector': 'edge',
		'style': {
			'width': 3.0,
			'curve-style': 'bezier',
			'text-outline-width': 2.3,
			'text-outline-color': '#cacaca',			
			'line-color': '#797979',
			'target-arrow-color': '#797979',
			'target-arrow-shape': 'triangle',
		}
	},
	{	// For a hovered edge, show a small overlay.
		'selector': 'edge.highlighted',
		'style': { 'overlay-opacity': 0.1 },
	},
	{	// Show non-observable edges as dashed.
		'selector': 'edge[observable]',
		'style': {
			'line-style': edgeLineStyle,
			'line-dash-pattern': [8, 3],
		}
	},
	{	// When the edge is an activation, show it as green with normal arrow.
		'selector': 'edge[monotonicity="activation"]',
		'style': {
			'line-color': '#4abd73',
			'target-arrow-color': '#4abd73',
			'target-arrow-shape': 'triangle'
		}
	},
	{	// When the edge is an inhibition, show it as red with a `tee` arrow.
		'selector': 'edge[monotonicity="inhibition"]',
		'style': {
			'line-color': '#d05d5d',
			'target-arrow-color': '#d05d5d',
			'target-arrow-shape': 'tee',
		}
	},	
	{	// A selected edge should be drawn with the same overlay as a hovered edge.
		'selector': 'edge:selected',
		'style': { 'overlay-opacity': 0.1, }
	},
]

export let Styles: cytoscape.Stylesheet[] = [].concat(node_styles).concat(edge_styles);

export default Styles;