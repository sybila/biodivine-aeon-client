
function Math_dimPercent(cardinality, total) {
	return Math.round(((Math.log2(cardinality)+1) / (Math.log2(total)+1)) * 100);
}

function Math_percent(cardinality, total) {
	return Math.round((cardinality / total) * 100);
}

function init() {
	// Set engine address according to query parameter
	const urlParams = new URLSearchParams(window.location.search);
	const engineAddress = urlParams.get('engine');	
	console.log(engineAddress);
	ComputeEngine.openConnection(undefined, engineAddress);
	
	CytoscapeEditor.init();

	let checkbox = document.getElementById("mass-distribution");
	let label = document.getElementById("mass-distribution-label");
	checkbox.addEventListener('change', (event) => {
	  	if (event.target.checked) {
    		CytoscapeEditor.setMassEnabled();
    		label.classList.add("primary");
    		label.classList.add("bold");
  		} else {
    		CytoscapeEditor.setMassDisabled();
    		label.classList.remove("primary");
    		label.classList.remove("bold");
  		}
	});

	document.fonts.load('1rem "symbols"').then(() => {
	document.fonts.load('1rem "FiraMono"').then(() => {
		loadBifurcationTree();
	})});

	var slider = document.getElementById("precision-slider");
	var output = document.getElementById("precision-value");
	output.innerHTML = slider.value/100.0 + "%";

	slider.oninput = function() {
  		output.innerHTML = this.value/100.0 + "%";
	}

	slider.onmouseup = function() {
		setPrecision(slider.value);
	}

	ComputeEngine.getTreePrecision((e, r) => {		
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
		autoExpandBifurcationTree(CytoscapeEditor.getSelectedNodeId(), depth.value);
	}

}

function autoExpandBifurcationTree(node, depth, fit = true) {
	let loading = document.getElementById("loading-indicator");
	loading.classList.remove("invisible");
	ComputeEngine.autoExpandBifurcationTree(node, depth, (e, r) => {		
		if (r !== undefined && r.length > 0) {
			for (node of r) {
				CytoscapeEditor.ensureNode(node);
			}
			for (node of r) {
				if (node.type == "decision") {
					CytoscapeEditor.ensureEdge(node.id, node.left, false);
					CytoscapeEditor.ensureEdge(node.id, node.right, true);
				}
			}

			CytoscapeEditor.applyTreeLayout();
			if (fit) {
				CytoscapeEditor.fit();				
			}
		} else {
			alert(e);
		}
		loading.classList.add("invisible");
		CytoscapeEditor.refreshSelection();
	}, true);
}

function loadBifurcationTree(fit = true) {
	let loading = document.getElementById("loading-indicator");
	loading.classList.remove("invisible");
	ComputeEngine.getBifurcationTree((e, r) => {		
		if (r !== undefined && r.length > 0) {
			CytoscapeEditor.removeAll();	// remove old tree if present
			for (node of r) {
				CytoscapeEditor.ensureNode(node);
			}
			for (node of r) {
				if (node.type == "decision") {
					CytoscapeEditor.ensureEdge(node.id, node.left, false);
					CytoscapeEditor.ensureEdge(node.id, node.right, true);
				}
			}

			CytoscapeEditor.applyTreeLayout();
			if (fit) {
				CytoscapeEditor.fit();				
			}			
		}			
		loading.classList.add("invisible");
	}, true);
}

function setPrecision(precision) {
	let loading = document.getElementById("loading-indicator");
	loading.classList.remove("invisible");
	ComputeEngine.applyTreePrecision(precision, (e, r) => {
		loadBifurcationTree(false);
	});
}

function removeNode(nodeId) {
	ComputeEngine.deleteDecision(nodeId, (e, r) => {
		console.log(r);		
		if (r.removed.length > 0) {
			for (removed of r.removed) {
				CytoscapeEditor.removeNode(removed);
			} 
		}
		if (r.node !== undefined) {
			CytoscapeEditor.ensureNode(r.node);
			CytoscapeEditor.refreshSelection(r.node.id);
		}
	});
}

function selectAttribute(node, attr) {
	ComputeEngine.selectDecisionAttribute(node, attr, (e, r) => {
		console.log(r);
		for (node of r) {
			CytoscapeEditor.ensureNode(node);
		}
		for (node of r) {
			if (node.type == "decision") {
				CytoscapeEditor.ensureEdge(node.id, node.left, false);
				CytoscapeEditor.ensureEdge(node.id, node.right, true);
			}
		}
		CytoscapeEditor.applyTreeLayout();
		CytoscapeEditor.refreshSelection();
	});
}

/* Open witness network for the currently selected tree node. */
function openTreeWitness() {
	let node = CytoscapeEditor.getSelectedNodeId();
	if (node === undefined) {
		return;
	}
	const url = window.location.pathname.replace("tree_explorer.html", "index.html");
    window.open(url + '?engine=' + encodeURI(ComputeEngine.getAddress()) + "&tree_witness="+ encodeURI(node));
}

function openStabilityWitness(variable, behaviour) {
	let node = CytoscapeEditor.getSelectedNodeId();
	if (node === undefined) {
		return;
	}
	const url = window.location.pathname.replace("tree_explorer.html", "index.html");
    window.open(url + '?engine=' + encodeURI(ComputeEngine.getAddress()) + "&tree_witness="+ encodeURI(node) + "&variable=" + encodeURI(variable) + "&value=" + encodeURI(behaviour));
}

/* Open attractors for the currently selected tree node. */
function openTreeAttractor() {
	let node = CytoscapeEditor.getSelectedNodeId();
	if (node === undefined) {
		return;
	}
	const url = window.location.pathname.replace("tree_explorer.html", "explorer.html");
    window.open(url + '?engine=' + encodeURI(ComputeEngine.getAddress()) + "&tree_witness="+ encodeURI(node));
}

function openStabilityAttractor(variable, behaviour) {
	let node = CytoscapeEditor.getSelectedNodeId();
	if (node === undefined) {
		return;
	}
	const url = window.location.pathname.replace("tree_explorer.html", "explorer.html");
    window.open(url + '?engine=' + encodeURI(ComputeEngine.getAddress()) + "&tree_witness="+ encodeURI(node) + "&variable=" + encodeURI(variable) + "&value=" + encodeURI(behaviour));
}

// Used to initialize a stability analysis button in the detail panels.
function initStabilityButton(id, button, container) {
    let loading = document.getElementById("loading-indicator");
    button.onclick = function() {
        loading.classList.remove("invisible");
        ComputeEngine.getStabilityData(id, (e, r) => {
            loading.classList.add("invisible");
            if (e !== undefined) {
                console.log(e);
                alert("Cannot load stability data.");                   
            } else {
                button.classList.add("gone");             
                let alwaysTrue = "<div><b>Always true:</b> <span class='green'>"+r["always_true"].join("; ") + "</span><div>";
                if(r["always_true"].length == 0) { alwaysTrue = ""; }
                let alwaysFalse = "<div><b>Always false:</b> <span class='red'>"+r["always_false"].join("; ") + "</span><div>";
                if(r["always_false"].length == 0) { alwaysFalse = ""; }
                let constant = "<div><b>Constant for parametrisation:</b> "+r["constant"].join("; ") + "<div>";
                if(r["constant"].length == 0) { constant = ""; }
                let content = alwaysTrue + alwaysFalse + constant;
                if(content.length == 0) {
                	content = "No stable variables found."
                } else {
                	content = "<h4>All attractors:</h4>" + content;
                }

                if('var_stability' in r) {
                	let var_analysis = "";
                	for(v of r['var_stability']) {
                		if('constant' in v) {
                			if(v['constant']) {
                				var_analysis += "<div><b>" + v['name'] + "</b>:</br> <span class='green'> - always true</span></div>"
                			} else {
                				var_analysis += "<div><b>" + v['name'] + "</b>:</br> <span class='red'> - always false</span></div>"
                			}
                		} else {
                			let distribution = "";
                			if(v['only_true'] > 0.0) {
                				distribution += " - With <span class='green'>true</span>: "+v['only_true'] + getWitnessPanelForVariable(v['name'], 'true')+"</br>";
                			}
                			if(v['only_false'] > 0.0) {
                				distribution += " - With <span class='red'>false</span>: "+v['only_false'] + getWitnessPanelForVariable(v['name'], 'false')+"</br>";
                			}
                			if(v['mixed'] > 0.0) {
                				distribution += " - With <b>both</b>: "+v['mixed'] + getWitnessPanelForVariable(v['name'], 'mixed')+"</br>";
                			}
                			var_analysis += "<div><b>" + v['name'] + "</b>:</br>" + distribution + "</div>";

                		}
                	}
                	if(var_analysis.length > 0) {
                		content += "<h4>Sink attractors:</h4>" + var_analysis;
                	}
                }
                container.innerHTML = content;
            }
        })
    }
}

function getWitnessPanelForVariable(variable, behaviour) {
	return "<span style='float: right;'><span class='inline-button' onclick='openStabilityWitness(\""+variable+"\",\""+behaviour+"\");'>Witness</span> | <span class='inline-button' onclick='openStabilityAttractor(\""+variable+"\",\""+behaviour+"\");'>Attractor</span></span>";
}

// Keyboard shortcuts for basic navigation:

hotkeys('up', function(event, handler) {	
	let selected = CytoscapeEditor.getSelectedNodeId();
	if (selected == undefined) {
		CytoscapeEditor.selectNode("0");	
	} else {
		let parent = CytoscapeEditor.getParentNode(selected);
		if (parent == undefined) { return; }
		CytoscapeEditor.selectNode(parent);
		event.preventDefault();
	}	
});

hotkeys('left', function(event, handler) {
	let selected = CytoscapeEditor.getSelectedNodeId();
	if (selected == undefined) {
		CytoscapeEditor.selectNode("0");	
	} else {

		let sibling = CytoscapeEditor.getSiblingNode(selected);
		if (sibling == undefined) { return; }
		CytoscapeEditor.selectNode(sibling);
		event.preventDefault();
	}	
});

hotkeys('right', function(event, handler) {
	let selected = CytoscapeEditor.getSelectedNodeId();
	if (selected == undefined) {
		CytoscapeEditor.selectNode("0");	
	} else {
		let sibling = CytoscapeEditor.getSiblingNode(selected);
		if (sibling == undefined) { return; }
		CytoscapeEditor.selectNode(sibling);
		event.preventDefault();
	}	
});

hotkeys('down', function(event, handler) {
	let selected = CytoscapeEditor.getSelectedNodeId();
	if (selected == undefined) {
		CytoscapeEditor.selectNode("0");	
	} else {
		let child = CytoscapeEditor.getChildNode(selected, true);
		if (child == undefined) { return; }
		CytoscapeEditor.selectNode(child);
		event.preventDefault();
	}	
});

hotkeys('shift+down', function(event, handler) {
	let selected = CytoscapeEditor.getSelectedNodeId();
	if (selected == undefined) {
		CytoscapeEditor.selectNode("0");	
	} else {
		let child = CytoscapeEditor.getChildNode(selected, false);
		if (child == undefined) { return; }
		CytoscapeEditor.selectNode(child);
		event.preventDefault();
	}	
});

hotkeys('backspace', function(event, handler) {	
	let selected = CytoscapeEditor.getSelectedNodeId();
	if (selected !== undefined && CytoscapeEditor.getNodeType(selected) == "decision") {
		event.preventDefault();
		if (confirm("Delete this node?")) {
			removeNode(selected);		
		}		
	}	
});

hotkeys('h', { keyup: true }, function(event, handler) {
	if (event.type === 'keydown') {
		document.getElementById("quick-help").classList.remove("gone");
	}
	if (event.type === 'keyup') {
		document.getElementById("quick-help").classList.add("gone");
	}	
});

hotkeys('s', function(event, handler) {
	let panel = document.getElementById("mixed-info");
	if (!panel.classList.contains("gone")) {
		fireEvent(document.getElementById("mixed-stability-analysis-button"), "click");
	}

	panel = document.getElementById("decision-info");
	if (!panel.classList.contains("gone")) {
		fireEvent(document.getElementById("decision-stability-analysis-button"), "click");
	}

	panel = document.getElementById("leaf-info");
	if (!panel.classList.contains("gone")) {
		fireEvent(document.getElementById("leaf-stability-analysis-button"), "click");
	}
});

hotkeys('d', function(event, handler) {
	let panel = document.getElementById("mixed-info");
	if (!panel.classList.contains("gone")) {
		fireEvent(document.getElementById("button-add-variable"), "click");
	}
})

// utility function to fire events on UI elements - we mainly need it to simulate clicks
function fireEvent(el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}