function init() {
	UI.init();
	CytoscapeEditor.init();
	CytoscapeEditor.addNode(0, "node_1", [10,10]);
	CytoscapeEditor.addNode(1, "node_2", [0,0]);
}

let UI = {
	init: function() {
		console.log("[UI] initialization start");
		this.cytoscapeEditor = document.getElementById("cytoscape-editor");
		this.nodeMenu = document.getElementById("node-menu");
		console.log("[UI] initialization done");
	},
	
	// If given a position, show the center of the node menu at that position.
	// If no position is given, hide the menu.
	// ([Num, Num], Float = 1.0)
	toggleNodeMenu: function(position, zoom = 1.0) {
		if (position === undefined) {
			this.nodeMenu.classList.add("gone");
		} else {
			this.nodeMenu.classList.remove("gone");
			this.nodeMenu.style.left = position[0] + "px";
			this.nodeMenu.style.top = position[1] + "px";
			// Scale applies current zoom, translate ensures the middle point of menu is 
			// actually at postion [left, top] (this makes it easier to align).
			this.nodeMenu.style.transform = "scale(" + zoom + ") translate(-50%, -50%)";			
		}			
	},
}

let CytoscapeEditor = {
	
	// Reference to the cytoscape library "god object"
	_cytoscape: undefined,

	init: function() {
		console.log("[CytoscapeEditor] initialization start");
		this._cytoscape = cytoscape(this.initOptions());
		// When the user moves or zooms the graph, position of menu must update as well.
		this._cytoscape.on('zoom', (e) => this._renderMenuForSelectedNode())
		this._cytoscape.on('pan', (e) => this._renderMenuForSelectedNode())
		console.log("[CytoscapeEditor] initialization done");
	},

	// (Int, String, [Num, Num])
	addNode(id, name, position = [0,0]) {
		console.log("[CytoscapeEditor] Add node "+id+" with name "+name+" at position "+position);
		let node = this._cytoscape.add({
			data: { id: id, name: name },
			position: { x: position[0], y: position[1] },
		})
		node.on('mouseover', (e) => {
			node.addClass('hover');			
		});
		node.on('mouseout', (e) => {
			node.removeClass('hover');			
		});
		node.on('select', (e) => {			
			console.log("[CytoscapeEditor] Node "+name+" selected.");
			CytoscapeEditor._renderMenuForSelectedNode(node);
		})
		node.on('unselect', (e) => {
			console.log("[CytoscapeEditor] Node "+name+" unselected.");
			UI.toggleNodeMenu();
		})
		node.on('drag', (e) => {			
			if (node.selected()) CytoscapeEditor._renderMenuForSelectedNode(node);
		})
	},

	// Update the node menu to be shown exactly for this element
	// (including zoom and other node proeprties)
	// If the node is undefined, try to find it
	// (element?)
	_renderMenuForSelectedNode(node) {
		if (node === undefined) {
			node = CytoscapeEditor._cytoscape.$(":selected");
			if (node.length == 0) return;	// nothing selected
		}
		let zoom = CytoscapeEditor._cytoscape.zoom();			
		let position = node.renderedPosition();
		let height = node.height() * zoom;			
		UI.toggleNodeMenu([position["x"], position["y"]], zoom);
	},

	initOptions: function() {
		return {
			container: UI.cytoscapeEditor,			
			// Some sensible default auto-layout algorithm
  			layout: {
	            animate: true,
	            animationDuration: 300,
	            animationThreshold: 250,
	            refresh: 20,
	            fit: true,
	            name: 'cose',
	            padding: 250,
	            nodeRepulsion: function(node) { return 100000; },
	            nodeDimensionsIncludeLabels: true,
        	},
  			style: [
  				{ 	// Style of the graph nodes
  					'selector': 'node',
  					'style': {
  						// 
  						'label': 'data(name)',	
  						// put label in the middle of the node (vertically)
  						'text-valign': 'center',
  						'width': 'label', 'height': 'label',
  						// a rectangle with slightly sloped edges
  						'shape': 'barrel',
  						// when selecting, do not display any overlay
  						'overlay-opacity': 0,
  						// other visual styles
		                'padding': 12,		                
		                'background-color': '#dddddd',
		                'font-family': 'Fira Mono',
		                'font-size': '24pt',
		                'border-width': '1px',
		                'border-color': '#bbbbbb',
		                'border-style': 'solid',
  					}
  				},  				
  				{	// When a node is highlighted by mouse, show it with a dashed blue border.
  					'selector': 'node.hover',
  					'style': {
  						'border-width': '1.6px',
  						'border-color': '#6a7ea5',
						'border-style': 'dashed',                		
  					}
  				},
  				{	// When a node is selected, show it with a thick blue border.
  					'selector': 'node:selected',
  					'style': {
  						'border-width': '2.0px',
  						'border-color': '#6a7ea5',
  						'border-style': 'solid',                		
  					}
  				},
			],		
		}
	},
}