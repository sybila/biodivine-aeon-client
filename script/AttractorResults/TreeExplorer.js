
let SORT_INFORMATION_GAIN = "sort-information-gain";
let SORT_TOTAL_CLASSES = "sort-total-classes";
let SORT_POSITIVE = "sort-positive";
let SORT_POSITIVE_MAJORITY = "sort-positive-majority";
let SORT_NEGATIVE = "sort-negative";
let SORT_NEGATIVE_MAJORITY = "sort-negative-majority";
let SORT_ALPHABETICAL = "sort-alphabetical";

let SORTS = [
	SORT_INFORMATION_GAIN, 
	SORT_TOTAL_CLASSES, 
	SORT_POSITIVE,
	SORT_POSITIVE_MAJORITY, 
	SORT_NEGATIVE,
	SORT_NEGATIVE_MAJORITY, 
	SORT_ALPHABETICAL
];

let TreeExplorer = {
	openNewTreeExplorer() {
		CytoscapeTreeEditor.init();

		let checkbox = document.getElementById("mass-distribution");
		let label = document.getElementById("mass-distribution-label");
		checkbox.addEventListener('change', (event) => {
			if (event.target.checked) {
				CytoscapeTreeEditor.setMassEnabled();
				label.classList.add("primary");
				label.classList.add("bold");
			} else {
				CytoscapeTreeEditor.setMassDisabled();
				label.classList.remove("primary");
				label.classList.remove("bold");
			}
		});

		document.fonts.load('1rem "symbols"').then(() => {
		document.fonts.load('1rem "FiraMono"').then(() => {
			TreeExplorer._loadBifurcationTree();
		})});

		var slider = document.getElementById("precision-slider");
		var output = document.getElementById("precision-value");
		output.innerHTML = slider.value/100.0 + "%";

		slider.oninput = function() {
			output.innerHTML = this.value/100.0 + "%";
		}

		slider.onmouseup = function() {
			TreeExplorer._setPrecision(slider.value);
		}

		ComputeEngine.AttractorTree.getTreePrecision((e, r) => {		
			slider.value = r;
			output.innerHTML = r/100.0 + "%";
		})

		var depth = document.getElementById("auto-expand-slider");
		var autoExpand = document.getElementById("button-auto-expand");

		depth.oninput = function() {
			let value = depth.value;
			if (value == 1) {
				autoExpand.innerHTML = "Auto expand (1 level)  <img src='img/graph-24px.svg'>";
			} else {
				autoExpand.innerHTML = "Auto expand ("+value+" levels)  <img src='img/graph-24px.svg'>";
			}		
		}

		autoExpand.onclick = function() {
			TreeExplorer._autoExpandBifurcationTree(CytoscapeTreeEditor.getSelectedNodeId(), depth.value);
		}

		// Setup mutually exclusive sort checkboxes.
		for (sort of SORTS) {
			let checkbox = document.getElementById(sort);
			checkbox.onclick = function() {
				for (sort of SORTS) {
					document.getElementById(sort).checked = false;
				}
				TreeExplorer.checked = true;
				TreeExplorer._setSort(this.id);
			}
		}

		// Set up debug layout settings panel
		/*document.getElementById("toggle-newlayout").addEventListener("change", e => {
			CytoscapeTreeEditor.layoutSettings.useTidytree = e.target.checked;
			CytoscapeTreeEditor.applyTreeLayout();
		});*/
		document.getElementById("toggle-animate").addEventListener("change", e => {
			CytoscapeTreeEditor.layoutSettings.animate = e.target.checked;
		});
		document.getElementById("toggle-layered").addEventListener("change", e => {
			CytoscapeTreeEditor.layoutSettings.layered = e.target.checked;
			CytoscapeTreeEditor.applyTreeLayout();
		});
		document.getElementById("toggle-posonleft").addEventListener("change", e => {
			CytoscapeTreeEditor.layoutSettings.positiveOnLeft = e.target.checked;
			CytoscapeTreeEditor.applyTreeLayout();
		});
		document.getElementById("button-fit").addEventListener("click", e => {
			CytoscapeTreeEditor.fit();
		});
		document.getElementById("button-resetlayout").addEventListener("click", e => {
			CytoscapeTreeEditor.layoutSettings.extraVerticalSpacings = {};
			CytoscapeTreeEditor.layoutSettings.switchChildren.clear();
			CytoscapeTreeEditor.applyTreeLayout();
		});
	},

	Math_dimPercent(cardinality, total) {
		return Math.round(((Math.log2(cardinality)+1) / (Math.log2(total)+1)) * 100);
	},

	Math_percent(cardinality, total) {
		return Math.round((cardinality / total) * 100);
	},

	_compareInformationGain(a, b) {
		return b.gain - a.gain;
	},

	_compareTotalClasses(a, b) {
		let r = (a.right.length + a.left.length) - (b.right.length + b.left.length);
		if (r == 0) {
			return TreeExplorer._compareInformationGain(a, b);
		} else {
			return r;
		}
	},

	_comparePositiveMajority(a, b) {
		let r = b.right[0]["fraction"] - a.right[0]["fraction"];
		if (r == 0) {
			return TreeExplorer._compareInformationGain(a, b);
		} else {
			return r;
		}
	},

	_compareNegativeMajority(a, b) {
		let r = b.left[0]["fraction"] - a.left[0]["fraction"];
		if (r == 0) {
			return TreeExplorer._compareInformationGain(a, b);
		} else {
			return r;
		}
	},

	_compareAttrName(a, b) {
		return a.name.localeCompare(b.name);
	},

	_comparePositive(a, b) {
		let r = b.rightTotal - a.rightTotal;
		if (r == 0) {
			return TreeExplorer._compareInformationGain(a, b);
		} else {
			return r;
		}
	},

	_compareNegative(a, b) {
		let r = b.leftTotal - a.leftTotal;
		if (r == 0) {
			return TreeExplorer._compareInformationGain(a, b);
		} else {
			return r;
		}
	},

	_getCurrentSort() {
		for (sort of SORTS) {
			if (document.getElementById(sort).checked) {
				return sort;
			}
		}
		return SORT_INFORMATION_GAIN;
	},

	_setSort(sort) {
		for (sortId of SORTS) {
			document.getElementById(sortId).checked = false;
		}
		document.getElementById(sort).checked = true;

		let selected = CytoscapeTreeEditor.getSelectedNodeTreeData();
		this.renderAttributeTable(selected.id, selected.attributes, selected.cardinality);
	},

	_sortAttributes(attributes) {
		let sort = TreeExplorer._getCurrentSort();
		if (sort == SORT_TOTAL_CLASSES) {
			attributes.sort(TreeExplorer._compareTotalClasses);
		} else if (sort == SORT_POSITIVE_MAJORITY) {
			attributes.sort(TreeExplorer._comparePositiveMajority);		
		} else if (sort == SORT_NEGATIVE_MAJORITY) {
			attributes.sort(TreeExplorer._compareNegativeMajority);
		} else if (sort == SORT_ALPHABETICAL) {
			attributes.sort(TreeExplorer._compareAttrName);
		} else if (sort == SORT_POSITIVE) {
			attributes.sort(TreeExplorer._comparePositive);
		} else if (sort == SORT_NEGATIVE) { 
			attributes.sort(TreeExplorer._compareNegative);
		} else {
			attributes.sort(TreeExplorer._compareInformationGain);
		}
	},

	renderAttributeTable(id, attributes, totalCardinality) {
		document.getElementById("mixed-attributes").classList.remove("gone");
		document.getElementById("mixed-attributes-title").innerHTML = "Attributes (" + attributes.length + "):";
		let template = document.getElementById("mixed-attributes-list-item-template");				
		let list = document.getElementById("mixed-attributes-list");
		list.innerHTML = "";
		var cut_off = 100;
		this._sortAttributes(attributes);

		for (attr of attributes) {
			if (cut_off < 0) break;		
			let attrNode = template.cloneNode(true);
			attrNode.id = "";
			attrNode.classList.remove("gone");
			let nameText = attrNode.getElementsByClassName("attribute-name")[0];				
			nameText.innerHTML = "<small class='grey'>SELECT:</small>" + attr.name;
			nameText.onclick = new Function("TreeExplorer._selectAttribute(" + id +", " + attr.id +")");										
			let igText = attrNode.getElementsByClassName("information-gain")[0];
			igText.innerHTML = attr.gain.toFixed(2) + " ɪɢ / " + (attr.left.length + attr.right.length) + " ᴛᴄ";
			if (attr.gain <= 0.0) {
				igText.classList.add("red");
			} else if (attr.gain >= 0.99) {
				igText.classList.add("green");
			} else {
				igText.classList.add("primary");
			}
			list.appendChild(attrNode);
			let leftNode = attrNode.getElementsByClassName("negative")[0];
			let rightNode = attrNode.getElementsByClassName("positive")[0];
			let leftTotal = attr.left.reduce((a, b) => a + b.cardinality, 0.0);
			let rightTotal = attr.right.reduce((a, b) => a + b.cardinality, 0.0);
			leftNode.getElementsByClassName("title")[0].innerHTML = "Negative (" + attr.left.length + "|<small>" + this.Math_percent(leftTotal, totalCardinality) + "%</small>)";
			rightNode.getElementsByClassName("title")[0].innerHTML = "Positive (" + attr.right.length + "|<small>" + this.Math_percent(rightTotal, totalCardinality) + "%</small>)";
			let leftTable = leftNode.getElementsByClassName("table")[0];
			leftTable.innerHTML = attr.left.reduce((html, cls) => {
				let style = "";
				if (html.length > 0) {
					style = "class='extra'";
				}
				let row = `
					<tr ${style}>
						<td class="distribution">${this.Math_percent(cls.cardinality, leftTotal)}%</td>
						<td class="symbols phenotype">${CytoscapeTreeEditor._normalizeClass(cls.class)}</td>
					</tr>
				`;
				return html + row;
			}, "");
			let rightTable = rightNode.getElementsByClassName("table")[0];
			rightTable.innerHTML = attr.right.reduce((html, cls) => {
				let style = "";
				if (html.length > 0) {
					style = "class='extra'";
				}

				console.log(CytoscapeTreeEditor._normalizeClass(cls.class));
				let row = `
					<tr ${style}>
						<td class="symbols phenotype"><div style="margin-bottom: 5px">${CytoscapeTreeEditor._normalizeClass(cls.class)}</td>
						<td class="distribution">${this.Math_percent(cls.cardinality, rightTotal)}%</td>
					</tr>
				`;
				return html + row;
			}, "");								
			let expandButton = attrNode.getElementsByClassName("expand-button")[0];
			if (attr.left.length == 1 && attr.right.length == 1) {
				expandButton.parentNode.removeChild(expandButton);
			} else {
				let expandButtonEvent = function() {
					if (expandButton.innerHTML == "more...") {
						// Expand
						expandButton.innerHTML = "...less";
						leftTable.classList.remove("collapsed");
						rightTable.classList.remove("collapsed");
					} else if (expandButton.innerHTML == "...less") {
						// Collapse
						expandButton.innerHTML = "more...";
						leftTable.classList.add("collapsed");
						rightTable.classList.add("collapsed");
					}
				}
				expandButton.onclick = expandButtonEvent;
			}					
		}
	},

	_autoExpandBifurcationTree(node, depth, fit = false) {
		if (!UI.testResultsAvailable()) {return;};

		let loading = document.getElementById("loading-indicator");
		loading.classList.remove("invisible");
		ComputeEngine.AttractorTree.autoExpandBifurcationTree(node, depth, (e, r) => {		
			if (r !== undefined && r.length > 0) {
				for (node of r) {
					CytoscapeTreeEditor.ensureNode(node);
				}
				for (node of r) {
					if (node.type == "decision") {
						CytoscapeTreeEditor.ensureEdge(node.id, node.left, false);
						CytoscapeTreeEditor.ensureEdge(node.id, node.right, true);
					}
				}

				CytoscapeTreeEditor.applyTreeLayout(fit);
			} else {
				Warning.displayWarning(e);
			}
			loading.classList.add("invisible");
			CytoscapeTreeEditor.refreshSelection();
		}, true);
	},

	_loadBifurcationTree(fit = true) {
		let loading = document.getElementById("loading-indicator");
		loading.classList.remove("invisible");
		ComputeEngine.AttractorTree.getBifurcationTree((e, r) => {		
			if (r !== undefined && r.length > 0) {
				CytoscapeTreeEditor.removeAll();	// remove old tree if present
				for (node of r) {
					CytoscapeTreeEditor.ensureNode(node);
				}
				
				for (node of r) {
					if (node.type == "decision") {
						CytoscapeTreeEditor.ensureEdge(node.id, node.left, false);
						CytoscapeTreeEditor.ensureEdge(node.id, node.right, true);
					}
				}

				CytoscapeTreeEditor.applyTreeLayout(fit);
			}			
			loading.classList.add("invisible");
		}, true);
	},

	_setPrecision(precision) {
		let loading = document.getElementById("loading-indicator");
		loading.classList.remove("invisible");
		ComputeEngine.AttractorTree.applyTreePrecision(precision, (e, r) => {
			this._loadBifurcationTree(false);
		});
	},

	removeNode(nodeId) {
		ComputeEngine.AttractorTree.deleteDecision(nodeId, (e, r) => {
			console.log(r);		
			if (r.removed.length > 0) {
				for (removed of r.removed) {
					CytoscapeTreeEditor.removeNode(removed);
				} 
			}
			if (r.node !== undefined) {
				CytoscapeTreeEditor.ensureNode(r.node);
				CytoscapeTreeEditor.refreshSelection(r.node.id);
			}
		});
	},

	_selectAttribute(node, attr) {
		if (!UI.testResultsAvailable()) {return;};

		ComputeEngine.AttractorTree.selectDecisionAttribute(node, attr, (e, r) => {
			console.log(r);
			for (node of r) {
				CytoscapeTreeEditor.ensureNode(node);
			}
			for (node of r) {
				if (node.type == "decision") {
					CytoscapeTreeEditor.ensureEdge(node.id, node.left, false);
					CytoscapeTreeEditor.ensureEdge(node.id, node.right, true);
				}
			}
			CytoscapeTreeEditor.applyTreeLayout();
			CytoscapeTreeEditor.refreshSelection();
		});
	},

	/* Open witness network for the currently selected tree node. */
	openTreeWitness() {
		let node = CytoscapeTreeEditor.getSelectedNodeId();
		if (node === undefined) {
			return;
		}
		const url = window.location.pathname.replace("tree_explorer.html", "index.html");
		window.open(url + '?engine=' + encodeURI(ComputeEngine.Connection.getAddress()) + "&tree_witness="+ encodeURI(node));
	},

	openStabilityWitness(variable, behaviour, vector) {
		let node = CytoscapeTreeEditor.getSelectedNodeId();
		if (node === undefined) {
			return;
		}
		const url = window.location.pathname.replace("tree_explorer.html", "index.html");
		window.open(url + '?engine=' + encodeURI(ComputeEngine.Connection.getAddress()) + "&tree_witness="+ encodeURI(node) + "&variable=" + encodeURI(variable) + "&behaviour=" + encodeURI(behaviour) + "&vector=" + encodeURI(vector));
	},

	/* Open attractors for the currently selected tree node. */
	openTreeAttractor() {
		let node = CytoscapeTreeEditor.getSelectedNodeId();
		if (node === undefined) {
			return;
		}

		UI.Open.openExplorer("&tree_witness="+ encodeURI(node));
	},

	openStabilityAttractor(variable, behaviour, vector) {
		let node = CytoscapeTreeEditor.getSelectedNodeId();
		if (node === undefined) {
			return;
		}
		const url = window.location.pathname.replace("tree_explorer.html", "explorer.html");
		window.open(url + '?engine=' + encodeURI(ComputeEngine.Connection.getAddress()) + "&tree_witness="+ encodeURI(node) + "&variable=" + encodeURI(variable) + "&behaviour=" + encodeURI(behaviour) + "&vector=" + encodeURI(vector));
	},

	_vector_to_string(vector) {
		let result = "[";
		let first = true;
		for (item of vector) {
			if (first) {
				first = false;		
			} else {
				result += ","
			}
			if (item == "true") {
				result += "<span class='green'><b>true</b></span>";
			} else if (item == "false") {
				result += "<span class='red'><b>false</b></span>";
			} else {
				result += "<b>" + item + "</b>";
			}		
		}
		result += "]";
		return result;
	},

	// Used to initialize a stability analysis button in the detail panels.
	initStabilityButton(id, button, dropdown, container) {
		let loading = document.getElementById("loading-indicator");

		button.onclick = function() {
			if (!UI.testResultsAvailable()) {return;};

			loading.classList.remove("invisible");
			let behaviour = dropdown.value;

			ComputeEngine.AttractorTree.getStabilityData(id, behaviour, (e, r) => {
				loading.classList.add("invisible");
				if (e !== undefined) {
					console.log(e);
					Warning.displayWarning("Cannot load stability data: "+e);                   
				} else {
					console.log(r);
					let content = "<h4>Stability analysis:</h4>";
					for (item of r) {
						let variableName = item.variable;
						if (item.data.length == 1) {            			
							content += "<div><b>" + variableName + "</b>: always "+ TreeExplorer._vector_to_string(item.data[0].vector)+"</div>";            			
						} else {            			
							content += "<div><b>" + variableName + "</b>:</br>";
							for (data of item.data) {
								content += " - " + TreeExplorer._vector_to_string(data.vector) + ": " + data.colors + TreeExplorer._getWitnessPanelForVariable(variableName, behaviour, data.vector) + "</br>";
							}
							content += "</div>"
						}            		
					}               
					container.innerHTML = content;
				}
			})
		}
	},

	_getWitnessPanelForVariable(variable, behaviour, vector) {
		return "<span class='witness-panel'><span class='inline-button' onclick='TreeExplorer.openStabilityWitness(\""+variable+"\",\""+behaviour+"\",\""+vector+"\");'>Witness</span> | <span class='inline-button' onclick='TreeExplorer.openStabilityAttractor(\""+variable+"\",\""+behaviour+"\",\""+vector+"\");'>Attractor</span></span>";
	},

	// move node up (positive steps) or down (negative steps)
	_moveNode(nodeId, steps) {
		const settings = CytoscapeTreeEditor.layoutSettings
		const spacing = settings.extraVerticalSpacings
		const change = (settings.layered ? settings.layerHeight : 50) * steps;
		if (spacing[nodeId] === undefined) {
			spacing[nodeId] = 0;
		}
		spacing[nodeId] += change;
		if (spacing[nodeId] <= 0) {
			delete spacing[nodeId];
		}
		CytoscapeTreeEditor.applyTreeLayout();
	},
}