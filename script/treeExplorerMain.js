
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
                let constant = "<div><b>Constant:</b> "+r["constant"].join("; ") + "<div>";
                if(r["constant"].length == 0) { constant = ""; }
                let sinkCount = "<div><b>Unique sinks:</b> "+r["sink_count"] + "<div>";
                if(r["sink_count"] == "0") { sinkCount = ""; }
                let content = alwaysTrue + alwaysFalse + constant + sinkCount;
                if(content.length == 0) {
                	content = "No stable variables found."
                }
                container.innerHTML = content;
            }
        })
    }
}