/*
	Responsible for managing the cytoscape editor object. It has its own representation of the graph,
	but it should never be updated directly. Instead, always use LiveModel to specify updates.
*/
let CytoscapeEditor = {
	
	// Reference to the cytoscape library "god object"
	_cytoscape: undefined,
	// Reference to the edgehandles library "god object"
	_edgehandles: undefined,
	// Used to implement the double click feature
	_lastClickTimestamp: undefined,

	init: function() {
		this._cytoscape = cytoscape(this.initOptions());
		this._edgehandles = this._cytoscape.edgehandles(this.edgeOptions());
		// When the user moves or zooms the graph, position of menu must update as well.
		this._cytoscape.on('zoom', (e) => this._renderMenuForSelectedNode());
		this._cytoscape.on('pan', (e) => this._renderMenuForSelectedNode());
		this._cytoscape.on('click', (e) => {
			let now = (new Date()).getTime();
			if (this._lastClickTimestamp && now - this._lastClickTimestamp < DOUBLE_CLICK_DELAY) {				
				LiveModel.addVariable([e.position['x'], e.position['y']]);
			}
			this._lastClickTimestamp = now;
		});
	},

	// Return an id of the selected node, or undefined if nothing is selected.
	getSelectedNodeId() {
		node = CytoscapeEditor._cytoscape.$(":selected");
		if (node.length == 0) return undefined;	// nothing selected
		return node.id();
	},

	// Add a new node to the graph at the given position.
	// (Int, String, [Num, Num])
	addNode(id, name, position = [0,0]) {
		let node = this._cytoscape.add({
			data: { id: id, name: name },
			position: { x: position[0], y: position[1] },
		})
		node.on('mouseover', (e) => {
			node.addClass('hover');	
			ModelEditor.hoverVariable(id, true);		
		});
		node.on('mouseout', (e) => {
			node.removeClass('hover');			
			ModelEditor.hoverVariable(id, false);
		});
		node.on('select', (e) => {			
			CytoscapeEditor._renderMenuForSelectedNode(node);
			ModelEditor.selectVariable(id, true);
		})
		node.on('unselect', (e) => {
			UI.toggleNodeMenu();
			ModelEditor.selectVariable(id, false);
		})
		node.on('click', (e) => {						
			this._lastClickTimestamp = undefined; // ensure that we cannot double-click inside the node
		})
		node.on('drag', (e) => {			
			if (node.selected()) CytoscapeEditor._renderMenuForSelectedNode(node);
		})
	},

	// Remove the node with the given ID from the graph.
	removeNode(id) {		
		let node = this._cytoscape.getElementById(id);
		if (node !== undefined) {
			if (node.selected()) node.unselect();	// ensure menu is hidden, etc.
			this._cytoscape.remove(node);		
		} else {
			console.log("[CytoscapeEditor] Cannot remove "+id+" - node not found.");
		}
	},

	// Change name of the node to the given value.
	renameNode(id, newName) {
		let node = this._cytoscape.getElementById(id);
		if (node !== undefined) {
			let data = node.data();
			data["name"] = newName;
			this._cytoscape.style().update();	// redraw nodes
		}
	},

	// Allow to externally set which node is hovered - make sure to unset it as well.
	hoverNode(id, isHover) {
		let node = this._cytoscape.getElementById(id);
		if (isHover) {
			node.addClass('hover');
		} else {
			node.removeClass('hover');
		}
	},

	// Zoom and pan the editor to ensure that given node is visible.
	showNode(id) {
		let node = this._cytoscape.getElementById(id);
		if (node !== undefined) {					
			// Taken from https://github.com/cytoscape/cytoscape.js/issues/1691
			let zoom    = 1.1;
		    let bb = node.boundingBox(); 
		    let w   = this._cytoscape.width()
		    let h = this._cytoscape.height();
		    var pan = {
	    	  // add some random padding so it does not end up under the editor panel
		      x: ((w - zoom * ( bb.x1 + bb.x2 )) / 2)+250,
		      y: (h - zoom * ( bb.y1 + bb.y2 )) / 2
		    };

		    this._cytoscape.animate({
		      zoom: 1.1, 
		      pan: pan
		    });
		}
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
		UI.toggleNodeMenu([position["x"], position["y"] + 3*height], zoom);
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
  					'selector': 'node[name]',
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
  				{	// Edge handles pseudo-node for adding
		            'selector': '.eh-handle',
		            'style': {
		                'background-color': '#3a568c',
		                'color': '#f9f9f9',
		                'width': 24,
		                'height': 24,
		                'shape': 'diamond',
		                'font-family': 'Material Icons, Helvetica, sans-serif',
		                'padding': 0,
		                'overlay-opacity': 0,
		                'border-width': 0,
		                'border-opacity': 0,
		                'label': 'add_box',
		                'text-valign': 'center',
		                'text-halign': 'center',
		                'font-size': '12pt',
		            }
		        },
			],		
		}
	},

	edgeOptions() {
		return {
			preview: true, // whether to show added edges preview before releasing selection
	        hoverDelay: 150, // time spent hovering over a target node before it is considered selected
	        handleNodes: 'node', // selector/filter function for whether edges can be made from a given node
	        snap: false,
	        snapThreshold: 50,
	        snapFrequency: 15,
	        noEdgeEventsInDraw: false,
	        disableBrowserGestures: true, 
	        handlePosition: function(node) { return 'middle top'; },
	        handleInDrawMode: false,
	        edgeType: function(sourceNode, targetNode) { return 'flat'; },
	        loopAllowed: function(node) { return true; },
	        nodeLoopOffset: -50,
	        edgeParams: function(sourceNode, targetNode, i) {
	            return { data: { visible: '', kind: 'unspecified' }};
	        },
	        complete: function(sourceNode, targetNode, addedEles) {
	        	console.log("complete");
	            /*if (!Model.existsEdge(sourceNode.data().name, targetNode.data().name)) {
	                Model.addEdge(sourceNode.data().name, targetNode.data().name, true, 'unspecified');
	            } else {
	                addedEles.remove();
	            }*/
	        },
		};
	},
}