
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
		ComputeEngine.getBifurcationTree((e, r) => {		
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
				CytoscapeEditor.fit();				
			}			
		}, true);
	})});
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

/* Open attractors for the currently selected tree node. */
function openTreeAttractor() {
	let node = CytoscapeEditor.getSelectedNodeId();
	if (node === undefined) {
		return;
	}
	const url = window.location.pathname.replace("tree_explorer.html", "explorer.html");
    window.open(url + '?engine=' + encodeURI(ComputeEngine.getAddress()) + "&tree_witness="+ encodeURI(node));
}