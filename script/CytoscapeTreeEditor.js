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
	
	init: function() {
		this._cytoscape = cytoscape(this.initOptions());			
		this._cytoscape.on('select', (e) => {
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
				let tab = document.getElementById("node-info");
				let loading = document.getElementById("loading-indicator");
				loading.classList.remove("invisible");
				tab.classList.remove("gone");
				var html = "<h4>Mixed Node ["+data.id+"]</h4>";
				html += "<table>";
				html += "<tr><td>Behaviour</td><td>Witness Count</td><td>Portion</td></tr>";
				let classes = data.treeData.classes;				
				classes.sort(function(a, b) { return b.cardinality - a.cardinality; });
				let total = 0.0;
				for (cls of classes) {
					total += cls.cardinality;
				}
				console.log("Total: "+total);
				for (cls of classes) {
					html += "<tr>";
					html += "<td style='font-family: \"symbols\"'>" + this._normalizeClass(cls.class) + "</td>";
					html += "<td>" + cls.cardinality + "</td>";
					let percent = Math.round((cls.cardinality / total) * 100.0);
					if (percent < 1) {
						percent = "<1";
					}
					html += "<td>" + percent + "%</td>";
					html += "</tr>";
				}
				html += "</table>";				
				html += "<h4>Possible decision attributes:</h4>";
				tab.innerHTML = html;
				ComputeEngine.getDecisionAttributes(data.id, (e, r) => {
					var cut_off = 100;
					let html = tab.innerHTML;					
					for (attr of r) {
						if (cut_off < 0) break;
						html += "<div>"
                		html += "<span>" + attr.name + "</span>";
                		html += "<div style='float: right; text-align: right;'>"
                    		html += "<span>IG: "+ Math.round(attr.gain * 100) / 100 +"</span><br>";
                    		html += "<span>Count: " + (attr.left.length + attr.right.length) + "</span><br>";
                    		html += "<button onclick='selectAttribute("+data.id+", "+attr.id+")'>Select</button>";
                		html += "</div>";                                                                
                		html += "<table style='text-align: center; margin: 0 auto;'>"
                		attr.left.sort(function(a, b) { return b.cardinality - a.cardinality; });
                		attr.right.sort(function(a, b) { return b.cardinality - a.cardinality; });
                    	html += "<tr>";
                        html += "<td colspan='3'>Negative ("+attr.left.length+")</td>";
                        html += "<td colspan='3'>Positive ("+attr.right.length+")</td>";
                    	html += "</tr>";
                    	html += "<tr>";
                        html += "<td>"+this._normalizeClass(attr.left[0].class)+"</td>";
                        html += "<td>"+attr.left[0].cardinality+"</td>";
                        percent = Math.round((attr.left[0].cardinality / total) * 100.0);
                        html += "<td>"+percent+"%</td>"

                        html += "<td>"+this._normalizeClass(attr.right[0].class)+"</td>";
                        html += "<td>"+attr.right[0].cardinality+"</td>";
                        percent = Math.round((attr.right[0].cardinality / total) * 100.0);
                        html += "<td>"+percent+"%</td>"
                    	html += "</tr>";
                		html += "</table>";
            			html += "</div>";
					}
					tab.innerHTML = html;					
					loading.classList.add("invisible");
				});
			}
		});
		this._cytoscape.on('unselect', (e) => {
			// Clear remove button
			CytoscapeEditor._cytoscape.$(".remove-button").remove()
			// Close panels
			let nodeInfo = document.getElementById("node-info");
			nodeInfo.classList.add("gone");
			let leafInfo = document.getElementById("leaf-info");
			leafInfo.classList.add("gone");
			let decisionInfo = document.getElementById("decision-info");
			decisionInfo.classList.add("gone");
		})
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

	getSelectedNodeId() {
		node = CytoscapeEditor._cytoscape.nodes(":selected");
		if (node.length == 0) return undefined;
		return node.data().id;
	},

	_showDecisionPanel(data) {
		document.getElementById("decision-info").classList.remove("gone");
		document.getElementById("decision-attribute").innerHTML = data.treeData.attribute_name;
		let behaviorTable = document.getElementById("decision-behavior-table");
		let rowTemplate = document.getElementById("decision-behavior-table-row-template");
		// Remove all old rows
		var oldRow = undefined;
		do {
			oldRow = behaviorTable.getElementsByClassName("behavior-table-row")[0];
			if (oldRow !== undefined) {
				oldRow.parentNode.removeChild(oldRow);
			}
		} while (oldRow !== undefined);				
		// Add new rows
		for (cls of data.treeData.classes) {
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
			let percent = Math_percent(cls.cardinality, data.treeData.cardinality);
			let dimPercent = Math_dimPercent(cls.cardinality, data.treeData.cardinality);
			distribution.innerHTML = percent + "% / " + dimPercent + "ᴅᴘ";
			row.classList.remove("gone");
			row.classList.add("behavior-table-row");			
			behaviorTable.appendChild(row);
		}
	},

	_showLeafPanel(data) {
		document.getElementById("leaf-info").classList.remove("gone");
		document.getElementById("leaf-phenotype").innerHTML = data.label;
		let percent = Math_percent(data.treeData.cardinality, this._totalCardinality);
		let dimPercent = Math_dimPercent(data.treeData.cardinality, this._totalCardinality);
		document.getElementById("leaf-witness-count").innerHTML = data.treeData.cardinality + " (" + percent + "% / " + dimPercent + "ᴅᴘ)";
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

