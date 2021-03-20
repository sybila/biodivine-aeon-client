import cytoscape from "cytoscape";

// Modified version of the add_box-24px.svg with color explicitly set to blue and an additional background element which makes sure the plus sign is filled.
let ADD_BOX_SVG = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M4 4h16v16H4z"/><path fill="#6a7ea5" d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'

function nodeWidth(element: cytoscape.NodeSingular) {
	return String(element.data().name.length*7)+"pt";
}

export let Styles: cytoscape.Stylesheet[] = [
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
	}
]

export default Styles;