function init() {
	UI.init();
	CytoscapeEditor.init();
	LiveModel.addVariable([10,10]);
	LiveModel.addVariable([0,0]);
}

// Stores the PBN currently loaded into the editor. This is what you should interact with when
// you want to modify the model, not the editor directly.
let LiveModel = {

	// used to provide unique ids
	_idCounter: 0,
	_variables: {},

	// Create a new variable with a default name. Returns an id of the variable.
	addVariable: function(position = [0,0]) {
		let id = this._idCounter;
		this._idCounter += 1;
		let name = "v_"+(id + 1);
		this._variables[id] = { name: name, id: id }
		CytoscapeEditor.addNode(id, name, position);
	},


	removeVariable(id) {
		let variable = this._variables[id];
		if (variable === undefined) return;	// nothing to remove
		if (confirm(Strings.removeNodeCheck(variable['name']))) {
			delete this._variables[id];
			CytoscapeEditor.removeNode(id);
		}
	},

}

// Stores references to UI elements
let UI = {

	// Element where the cytoscape editor resides.
	cytoscapeEditor: undefined,
	// Element of the menu that is displayed for each node when selected.
	_nodeMenu: undefined,

	init: function() {
		console.log("[UI] initialization start");
		this.cytoscapeEditor = document.getElementById("cytoscape-editor");
		this._nodeMenu = document.getElementById("node-menu");
		this._initNodeMenu(this._nodeMenu);
		console.log("[UI] initialization done");
	},

	// Add a listener to each button which displays its alt as hint text when hovered.
	_initNodeMenu: function(menu) {
		let hint = menu.getElementsByClassName("hint")[0];	// there is exactly one hint
		let buttons = menu.getElementsByClassName("button");		
		for (var i = 0; i < buttons.length; i++) {
			let button = buttons[i];
			button.addEventListener("mouseenter", (e) => {			
				hint.textContent = button.alt;
				hint.classList.remove("invisible");
			})
			button.addEventListener("mouseleave", (e) => {
				hint.classList.add("invisible");
			})
		}
		let removeButton = document.getElementById("node-menu-remove");
		removeButton.addEventListener("click", (e) => {
			let selectedNodeId = CytoscapeEditor.getSelectedNodeId();
			console.log("[Node menu] Remove node with id "+selectedNodeId);
			if (selectedNodeId !== undefined) {
				LiveModel.removeVariable(selectedNodeId);
			}
		});
	},
	
	// If given a position, show the center of the node menu at that position.
	// If no position is given, hide the menu.
	// ([Num, Num], Float = 1.0)
	toggleNodeMenu: function(position, zoom = 1.0) {
		/* TODO: We should make a copy of the menu for each node. That way, we can animate them separately. */
		let menu = this._nodeMenu;
		if (position === undefined) {
			menu.classList.add("invisible");			
			menu.style.left = "-100px";	// move it somewhere out of clickable area
			menu.style.top = "-100px";
		} else {
			menu.classList.remove("invisible");
			menu.style.left = position[0] + "px";
			menu.style.top = position[1] + "px";
			// Scale applies current zoom, translate ensures the middle point of menu is 
			// actually at postion [left, top] (this makes it easier to align).
			menu.style.transform = "scale(" + zoom + ") translate(-50%, -50%)";			
		}			
	},
}

const DOUBLE_CLICK_DELAY = 400;

let CytoscapeEditor = {
	
	// Reference to the cytoscape library "god object"
	_cytoscape: undefined,
	// Used to implement the double click feature
	_lastClickTimestamp: undefined,

	init: function() {
		console.log("[CytoscapeEditor] initialization start");
		this._cytoscape = cytoscape(this.initOptions());
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
		console.log("[CytoscapeEditor] initialization done");
	},

	// Return an id (Int) of the selected node, or undefined if nothing is selected.
	getSelectedNodeId() {
		node = CytoscapeEditor._cytoscape.$(":selected");
		if (node.length == 0) return undefined;	// nothing selected
		return node.id();
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
			console.log("[CytoscapeEditor] Removed node "+id+".");
		} else {
			console.log("[CytoscapeEditor] Cannot remove "+id+" - node not found.");
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

let Strings = {
	removeNodeCheck(name) {
		return "Dou you really want to remove "+name;
	},
}