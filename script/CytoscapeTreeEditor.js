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
	
	init: function() {
		this._cytoscape = cytoscape(this.initOptions());			
		this._cytoscape.on('select', (e) => {
			console.log(e.target.data());
			let data = e.target.data();
			if (data.type == "unprocessed") {
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
			let tab = document.getElementById("node-info");
			tab.classList.add("gone");
		})
	},


	initOptions: function() {
		return {
			container: document.getElementById("cytoscape-editor"),			
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
  						'shape': 'rectangle',
  						// when selecting, do not display any overlay
  						'overlay-opacity': 0,
  						// other visual styles
		                'padding': 6,		                
		                'background-color': '#dddddd',
		                //'background-opacity': '0',
		                //'font-family': 'symbols',
		                'font-size': '12pt',
		                'border-width': '0px',
		                'border-color': '#bbbbbb',
		                'border-style': 'solid',
		                'text-max-width': 150,
		                'text-wrap': 'wrap',
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
		} else {
			// Make new edge
			this._cytoscape.add({
				group: 'edges', data: { source: sourceId, target: targetId, positive: positive }
			})
		}
	},

	_applyTreeData(data, treeData) {
		if (data.id != treeData.id) {
			error("Updating wrong node.");
		}
		data.treeData = treeData;
		data.type = treeData.type;
		if (treeData.type == "leaf") {
			data.label = this._normalizeClass(treeData.class);			
			data.label += "(" + treeData.cardinality + ")";
		} else if (treeData.type == "decision") {
			data.label = treeData.attribute_name;
		} else {
			data.label = treeData.type + "(" + treeData.id + ")";
		}
		return data;
	},

	_normalizeClass(cls) {
		return JSON.parse(cls).map(x => x[0]).sort().join('');
	},

	applyTreeLayout() {
		this._cytoscape.layout({
			name: 'breadthfirst',
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