let EdgeMonotonicity = {
	unspecified: "unspecified",
	activation: "activation",
	inhibition: "inhibition",
}

/*
	Responsible for managing the cytoscape editor object. It has its own representation of the graph,
	but it should never be updated directly. Instead, always use LiveModel to specify updates.
*/
let CytoscapeEditor = {
	
	// Reference to the cytoscape library "god object"
	_cytoscape: undefined,
	_totalCardinality: 0.0,
	_showMass: false,
	
	init: function() {
		this._cytoscape = cytoscape(this.initOptions());			
		this._cytoscape.on('select', (e) => {
			document.getElementById("quick-help").classList.add("gone");
			console.log(e.target.data());
			let data = e.target.data();
			if (data.action == 'remove') {
				// This is a remove button for a specifc tree node.
				removeNode(data.targetId);
			} else if (data.type == "leaf") {
				this._showLeafPanel(data)
			} else if (data.type == "decision") {
				this._showDecisionPanel(data);
				let currentPosition = e.target.position();
				// Show close button
				let closeButton = {					
					classes: ['remove-button'],
					grabbable: false,
					data: {
						action: 'remove',
						targetId: e.target.data().id,
					},
					position: {
						// 12 is half the radius of the close icon
						x: currentPosition.x + e.target.width() / 2 + 12,
						y: currentPosition.y - e.target.height() / 2 - 12,
					}
				};
				let node = CytoscapeEditor._cytoscape.add(closeButton);
				node.on('mouseover', (e) => {
					node.addClass('hover');	
				});
				node.on('mouseout', (e) => {
					node.removeClass('hover');			
				});
			} else if (data.type == "unprocessed") {
				this._showMixedPanel(data);				
			}
		});
		this._cytoscape.on('unselect', (e) => {
			// Clear remove button
			CytoscapeEditor._cytoscape.$(".remove-button").remove()
			// Close panels
			let leafInfo = document.getElementById("leaf-info");
			leafInfo.classList.add("gone");
			let decisionInfo = document.getElementById("decision-info");
			decisionInfo.classList.add("gone");
			let mixedInfo = document.getElementById("mixed-info");
			mixedInfo.classList.add("gone");
			// Clear decision attribute list:
			document.getElementById("button-add-variable").classList.remove("gone");
			document.getElementById("mixed-attributes").classList.add("gone");
			document.getElementById("mixed-attributes-list").innerHTML = "";
			// Reset stability analysis buttons:
			document.getElementById("mixed-stability-analysis-button").classList.remove("gone");
			document.getElementById("leaf-stability-analysis-button").classList.remove("gone");
			document.getElementById("decision-stability-analysis-button").classList.remove("gone");
			document.getElementById("mixed-stability-analysis").innerHTML = "";
			document.getElementById("leaf-stability-analysis").innerHTML = "";
			document.getElementById("decision-stability-analysis").innerHTML = "";
		})
	},

	removeAll() {
		CytoscapeEditor._cytoscape.nodes(":selected").unselect();	// Triggers reset of other UI.
		CytoscapeEditor._cytoscape.elements().remove();
	},

	// Triggers all necessary events to update UI after graph update
	refreshSelection(targetId) {
		let selected = CytoscapeEditor._cytoscape.$(":selected");	// node or edge that are selected
		if (selected.length > 0) {
			selected.unselect();			
		}
		if (targetId === undefined) {
			if (selected.length > 0) {
				selected.select();
			}
		} else {
			CytoscapeEditor._cytoscape.getElementById(targetId).select();
		}		
	},

	getParentNode(targetId) {
		let parentEdge = CytoscapeEditor._cytoscape.edges("edge[target='"+targetId+"']");
		if (parentEdge.length == 0) {
			return undefined;
		}
		return parentEdge.data().source;
	},

	getChildNode(sourceId, positive) {
		let childEdge = CytoscapeEditor._cytoscape.edges("edge[source='"+sourceId+"'][positive='"+positive+"']");
		if (childEdge.length == 0) {
			return undefined;
		}
		return childEdge.data().target;
	},

	getSiblingNode(targetId) {		
		let parentEdge = CytoscapeEditor._cytoscape.edges("edge[target='"+targetId+"']");
		if (parentEdge.length == 0) { return undefined; }
		let sourceId = parentEdge.data().source;
		let positive = !(parentEdge.data().positive == "true");
		let childEdge = CytoscapeEditor._cytoscape.edges("edge[source='"+sourceId+"'][positive='"+positive+"']");
		if (childEdge.length == 0) { return undefined; }
		return childEdge.data().target;	
	},

	getSelectedNodeId() {
		node = CytoscapeEditor._cytoscape.nodes(":selected");
		if (node.length == 0) return undefined;
		return node.data().id;
	},

	getSelectedNodeTreeData() {
		node = CytoscapeEditor._cytoscape.nodes(":selected");
		if (node.length == 0) return undefined;
		return node.data().treeData;
	},

	selectNode(nodeId) {
		let current = CytoscapeEditor._cytoscape.nodes(":selected");
		current.unselect();
		CytoscapeEditor._cytoscape.getElementById(nodeId).select();
	},

	getNodeType(nodeId) {
		return CytoscapeEditor._cytoscape.getElementById(nodeId).data().type;
	},

	_showDecisionPanel(data) {
		document.getElementById("decision-info").classList.remove("gone");
		document.getElementById("decision-attribute").innerHTML = data.treeData.attribute_name;
		document.getElementById("decision-phenotype-label").innerHTML = 
			"Phenotypes (" + data.treeData.classes.length + "):";
		let behaviorTable = document.getElementById("decision-behavior-table");		
		this._renderBehaviorTable(data.treeData.classes, data.treeData.cardinality, behaviorTable);

		let stabilityButton = document.getElementById("decision-stability-analysis-button");
		let stabilityDropdown = document.getElementById("decision-stability-dropdown");
		let stabilityContainer = document.getElementById("decision-stability-analysis");
		initStabilityButton(data.treeData.id, stabilityButton, stabilityDropdown, stabilityContainer);		
	},

	_showMixedPanel(data) {
		document.getElementById("mixed-info").classList.remove("gone");
		document.getElementById("mixed-type-label").innerHTML = data.treeData.classes.length + " Phenotypes";
		let table = document.getElementById("mixed-behavior-table");
		this._renderBehaviorTable(data.treeData.classes, data.treeData.cardinality, table);
		let loading = document.getElementById("loading-indicator");
		let addButton = document.getElementById("button-add-variable");
		addButton.onclick = function() {			
			if (data.treeData["attributes"] === undefined) {
				loading.classList.remove("invisible");			
				ComputeEngine.getDecisionAttributes(data.id, (e, r) => {
					loading.classList.add("invisible");
					addButton.classList.add("gone");				
					for (attr of r) {
						// Prepare data:
						attr.left.sort(function(a, b) { return b.cardinality - a.cardinality; });
						attr.right.sort(function(a, b) { return b.cardinality - a.cardinality; });
						let leftTotal = attr.left.reduce((a, b) => a + b.cardinality, 0.0);
						let rightTotal = attr.right.reduce((a, b) => a + b.cardinality, 0.0);		
						attr["leftTotal"] = leftTotal;
						attr["rightTotal"] = rightTotal;
						for (lElement of attr.left) {
							lElement["fraction"] = lElement.cardinality / leftTotal;
						}
						for (rElement of attr.right) {
							rElement["fraction"] = rElement.cardinality / rightTotal;
						}						
					}			
					data.treeData["attributes"] = r;				
					renderAttributeTable(data.id, r, data.treeData.cardinality);
				});
			} else {
				renderAttributeTable(data.id, data.treeData["attributes"], data.treeData.cardinality);
			}			
		};
		let stabilityButton = document.getElementById("mixed-stability-analysis-button");
		let stabilityDropdown = document.getElementById("mixed-stability-dropdown");
		let stabilityContainer = document.getElementById("mixed-stability-analysis");
		initStabilityButton(data.treeData.id, stabilityButton, stabilityDropdown, stabilityContainer);		
	},

	_renderBehaviorTable(classes, totalCardinality, table) {
		let rowTemplate = document.getElementById("behavior-table-row-template");
		// Remove all old rows
		var oldRow = undefined;
		do {
			oldRow = table.getElementsByClassName("behavior-table-row")[0];
			if (oldRow !== undefined) {
				oldRow.parentNode.removeChild(oldRow);
			}
		} while (oldRow !== undefined);				
		// Add new rows
		for (cls of classes) {
			let row = rowTemplate.cloneNode(true);
			row.id = "";
			let behavior = row.getElementsByClassName("cell-behavior")[0];
			let witnessCount = row.getElementsByClassName("cell-witness-count")[0];
			let distribution = row.getElementsByClassName("cell-distribution")[0];
			behavior.innerHTML = this._normalizeClass(cls.class);
			if (cls.cardinality > 1000.0) {
				witnessCount.innerHTML = cls.cardinality.toExponential();
			} else {
				witnessCount.innerHTML = cls.cardinality.toString();
			} 	
			let percent = Math_percent(cls.cardinality, totalCardinality);
			let dimPercent = Math_dimPercent(cls.cardinality, totalCardinality);
			distribution.innerHTML = percent + "% / " + dimPercent + "٪";
			row.classList.remove("gone");
			row.classList.add("behavior-table-row");
			table.appendChild(row);
		}
	},


	_showLeafPanel(data) {
		document.getElementById("leaf-info").classList.remove("gone");
		document.getElementById("leaf-phenotype").innerHTML = data.label;
		let percent = Math_percent(data.treeData.cardinality, this._totalCardinality);
		let dimPercent = Math_dimPercent(data.treeData.cardinality, this._totalCardinality);
		document.getElementById("leaf-witness-count").innerHTML = data.treeData.cardinality + " (" + percent + "% / " + dimPercent + "٪)";
		let conditions = "";
		let pathId = data.id;
		let source = this._cytoscape.edges("[target = \""+pathId+"\"]");	
		while (source.length != 0) {
			let data = source.data();
			let is_positive = data.positive === "true";
			let color = is_positive ? "green" : "red";
			let pathId = data.source;
			let attribute = this._cytoscape.getElementById(pathId).data().treeData.attribute_name;
			conditions += "<span class='" + color + "'> ‣ " + attribute + "</span><br>";
			source = this._cytoscape.edges("[target = \""+pathId+"\"]");
		}
		document.getElementById("leaf-necessary-conditions").innerHTML = conditions;
		let stabilityButton = document.getElementById("leaf-stability-analysis-button");
		let stabilityDropdown = document.getElementById("leaf-stability-dropdown");
		let stabilityContainer = document.getElementById("leaf-stability-analysis");
		initStabilityButton(data.treeData.id, stabilityButton, stabilityDropdown, stabilityContainer);		

		// Show additional phenotypes if this is a leaf that was created due to precision.
		let table = document.getElementById("leaf-behavior-table");		
		if (data.treeData["all_classes"] !== undefined) {
			table.classList.remove("gone");
			this._renderBehaviorTable(data.treeData["all_classes"], data.treeData.cardinality, table);
		} else {
			table.classList.add("gone");
		}
	},

	initOptions: function() {
		return {
			container: document.getElementById("cytoscape-editor"),			
			boxSelectionEnabled: false,
  			selectionType: 'single', 
  			style: [
  				{ 	// Style of the graph nodes
  					'selector': 'node[label]',
  					'style': {
  						// 
  						'label': 'data(label)',	
  						// put label in the middle of the node (vertically)
  						'text-valign': 'center',
  						'width': 'label', 'height': 'label',
  						'shape': 'round-rectangle',
  						// when selecting, do not display any overlay
  						'overlay-opacity': 0,
  						'opacity': 'data(opacity)',
  						// other visual styles
		                'padding': "12",		   
		                'background-color': '#dddddd',
		                //'background-opacity': '0',
		                'font-family': 'FiraMono',
		                'font-size': '12pt',
		                'border-width': '1px',
		                'border-color': '#bbbbbb',
		                'border-style': 'solid',
		                'text-max-width': 150,
		                'text-wrap': 'wrap',
  					}
  				},
  				{
  					'selector': '.remove-button',
  					'style': {
  						'text-valign': 'top',
  						'text-halign': 'right',
  						'shape': 'round-rectangle',
  						'background-opacity': 0,
		                'background-image': function(e) {
		                	return 'data:image/svg+xml;utf8,' + encodeURIComponent(_remove_svg);
		                },
		                'background-width': '24px',
		                'background-height': '24px',
  						'width': '32px', 
  						'height': '32px',
  					}
  				},
  				{
  					'selector': '.remove-button.hover',
  					'style': {
  						'background-width': '32px',
		                'background-height': '32px',  						
  					}
  				},
  				{	// When a node is selected, show it with a thick blue border.
  					'selector': 'node:selected',
  					'style': {
  						'border-width': '4.0px',
  						'border-color': '#6a7ea5',
  						'border-style': 'solid',                		
  					}
  				},
  				{
  					'selector': 'node[type = "unprocessed"]',
  					'style': {  						
  						'background-color': '#EFEFEF',
  						'border-color': '#616161',
  					}
  				},
  				{
  					'selector': 'node[type = "leaf"]',
  					'style': {  						
  						'border-color': '#546E7A',
  						'font-family': 'symbols',
  						'font-size': '16pt',
  					}  					
  				},
  				{
  					'selector': 'node[subtype = "disorder"]',
  					'style': {
  						'background-color': '#FFE0B2',
  					}  					
  				},
  				{
  					'selector': 'node[subtype = "oscillation"]',
  					'style': {
  						'background-color': '#F0F4C3',
  					}  					
  				},
  				{
  					'selector': 'node[subtype = "stability"]',
  					'style': {
  						'background-color': '#B2DFDB',
  					}  					
  				},
  				{
  					'selector': 'edge',
  					'style': {
  						'curve-style': 'taxi',
  						'taxi-direction': 'vertical',
  						'target-arrow-shape': 'triangle',  						
  					}
  				},
  				{
  					'selector': 'edge[positive = "true"]',
  					'style': {
  						'line-color': '#4abd73',
		                'target-arrow-color': '#4abd73',
  					}
  				},
  				{
  					'selector': 'edge[positive = "false"]',
  					'style': {
  						'line-color': '#d05d5d',
		                'target-arrow-color': '#d05d5d',
  					}
  				},
  				/*{
  					'selector': 'node[type="decision"]'
  				} */ 				 			
  			]
		}
	},

	ensureNode(treeData) {		
		let node = this._cytoscape.getElementById(treeData.id);
		if (node !== undefined && node.length > 0) {
			let data = node.data();
			this._applyTreeData(data, treeData);
			this._cytoscape.style().update();	//redraw graph
			return node;
		} else {
			let data = this._applyTreeData({ id: treeData.id }, treeData);
			return this._cytoscape.add({
				id: data.id,
				data: data, 
				grabbable: false,
				position: { x: 0.0, y: 0.0 }
			});
		}
	},

	ensureEdge(sourceId, targetId, positive) {
		let edge = this._cytoscape.edges("[source = \""+sourceId+"\"][target = \""+targetId+"\"]");
		if (edge.length >= 1) {
			// Edge exists
			this._cytoscape.style().update();	//redraw graph
		} else {
			// Make new edge
			this._cytoscape.add({
				group: 'edges', data: { source: sourceId, target: targetId, positive: positive.toString() }
			})
		}
	},

	setMassEnabled() {
		this._showMass = true;
		for (node of this._cytoscape.nodes()) {			
			let data = node.data();
			if (data.treeData !== undefined) {				
				data.opacity = this._computeMassOpacity(data.treeData.cardinality);
			}			
		}
		this._cytoscape.style().update();	//redraw graph
	},

	setMassDisabled() {
		this._showMass = false;
		for (node of this._cytoscape.nodes()) {
			let data = node.data();
			data.opacity = 1.0;
		}
		this._cytoscape.style().update();	//redraw graph
	},

	_computeMassOpacity(cardinality) {
		if (cardinality === undefined) {
			return 1.0;
		}
		let percent = Math_dimPercent(cardinality, this._totalCardinality);
		return (percent / 100.0) * (percent / 100.0);
	},

	// Pan and zoom the groph to show the whole model.
	fit() {
		this._cytoscape.fit();
		this._cytoscape.zoom(this._cytoscape.zoom() * 0.8);	// zoom out a bit to have some padding
	},

	_applyTreeData(data, treeData) {
		if (data.id != treeData.id) {
			error("Updating wrong node.");
		}
		if (treeData.id == "0") {
			this._totalCardinality = treeData.cardinality;
		}
		if (treeData.classes !== undefined) {
			treeData.classes.sort((a, b) => {
				if (a.cardinality == b.cardinality) {
					return a.class.localeCompare(b.class);
				} else if (a.cardinality < b.cardinality) {
					return 1;
				} else {
					return -1;
				}
			})
		}		
		data.treeData = treeData;
		data.type = treeData.type;
		if (treeData.type == "leaf") {
			let normalizedClass = this._normalizeClass(treeData.class);
			if (normalizedClass.includes("D")) {
				data.subtype = "disorder";
			} else if (normalizedClass.includes("O")) {
				data.subtype = "oscillation";			
			} else {
				data.subtype = "stability";
			}
			data.label = normalizedClass;
			//data.label += "\n(" + treeData.cardinality + ")";
		} else if (treeData.type == "decision") {
			data.label = treeData.attribute_name;
		} else if (treeData.type == "unprocessed" ) {
			data.label = "Mixed Phenotype\n" + "(" + treeData.classes.length + " types)";
		} else {
			data.label = treeData.type + "(" + treeData.id + ")";
		}
		let opacity = 1.0;
		if (this._showMass) {
			opacity = this._computeMassOpacity(treeData.cardinality);
		}
		data.opacity = opacity;
		return data;
	},

	_normalizeClass(cls) {
		return JSON.parse(cls).map(x => x[0]).sort().join('');
	},

	removeNode(nodeId) {
		let e = this._cytoscape.getElementById(nodeId);
		if (e.length > 0) {
			e.remove();
		}
	},

	applyTreeLayout() {
		this._cytoscape.layout({
			name: 'dagre',
			spacingFactor: 1.0,
			roots: [0],
			directed: true,
			avoidOverlap: true,
			nodeDimensionsIncludeLabels: true,
			//animate: true,
			fit: false,
		}).start();
	},

}

// Modified version of the cancel-24px.svg with color explicitly set to red and an additional background element which makes sure the X is filled.
let _remove_svg = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M4 6h14v14H6z"/><path fill="#d05d5d" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'

