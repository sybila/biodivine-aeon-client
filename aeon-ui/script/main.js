hasLocalStorage = false;

function init() {
	// Safari security alert
	let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	if (isSafari) {
		Warning.displayWarning(
			"At the moment, security measures in Safari may prevent you from connecting to the AEON compute engine.\n\n" +
			"You can still use the editor to view, modify and export models. While we work on this issue, you " +
			"can access full AEON functionaliy in Google Chrome."
		);
	}

	if (window.initialTabInfo == undefined ||
			window.modelId == undefined ||
				window.nextModelId == undefined ||
					window.modelCalc == undefined) {
		window.initialTabInfo = {type:"model", data: JSON.stringify("")};
		window.modelId = 0;
		window.nextModelId = { "value": 1 };
		window.modelCalc = {};
	}

	if (window.lastComputation != undefined) {
		ComputeEngine.Computation.setLastComputation(window.lastComputation);
	}

	if (window.model != undefined) {
		LiveModel.modelSave = window.model;
	}

	document.title = document.title + " " + window.initialTabInfo.type + " " + window.modelId;

	if (window.modelCalc[window.modelId] == undefined) {
		window.modelCalc[window.modelId] = 1;
	} else {
		window.modelCalc[window.modelId]++;
	}

	// Warn user that there is an unsaved model.
	window.onbeforeunload = function (e) {
		if (LiveModel.isEmpty()) {
			// Only warn when the model is not empty.
			return;
		}

		e = e || window.event;

		// In fact, most browsers will not display the text for security
		// reasons, but we have to return some text anyway.

		// For IE and Firefox prior to version 4
		if (e) {
			e.returnValue = Strings.closePrompt;
		}

		// For Safari
		return Strings.closePrompt;
	};

	// Update version links and label to match expected engine version:
	let version_string = "v"+EXPECTED_ENGINE_VERSION;
	document.getElementById("version").innerHTML = version_string;
	document.getElementById("engine-link-windows").href = document
		.getElementById("engine-link-windows")
		.href.replace("VERSION", version_string);

	document.getElementById("engine-link-macos").href = document
		.getElementById("engine-link-macos")
		.href.replace("VERSION", version_string);

	document.getElementById("engine-link-linux").href = document
		.getElementById("engine-link-linux")
		.href.replace("VERSION", version_string);

	try {
		localStorage.setItem('testing', '1');
		hasLocalStorage = true;
		console.log("Local storage available.");
	} catch (e) {
		console.log("Local storage not available.");
	}

	// Set engine address according to query parameter
	const urlParams = new URLSearchParams(window.location.search);
	const engineAddress = urlParams.get('engine');
	if (engineAddress !== undefined && engineAddress !== null && engineAddress.length > 0) {
		document.getElementById("engine-address").value = engineAddress;
	}

	UI.init();
	ModelEditor.init();
	ControllableEditor.init();
	PhenotypeEditor.init();
	CytoscapeEditor.init();
	Results.init();
	ControlResults.init();
	TabBar.init();
	Warning.init();
	ComputeEngine.Connection.openConnection();	// Try to automatically connect when first opened.
	ComputeEngine.Computation.Control.resetParameters();

	let witnessCallback = function(e, r) {
		UI.isLoading(false);
		if (e !== undefined) {
			Warning.displayWarning(e);
		} else {
			let error = LiveModel.Import.importAeon(r.model);
			if (error !== undefined) {
        		Warning.displayWarning(error);
        	}
        	UI.Visible.ensureContentTabOpen(ContentTabs.modelEditor);
		}
	}

	const requestedWitness = urlParams.get('witness');
	if (requestedWitness !== undefined && requestedWitness !== null && requestedWitness.length > 0) {
		UI.isLoading(true);
		ComputeEngine.getWitness(requestedWitness, witnessCallback, true);
	}

	const requestedTreeWitness = urlParams.get('tree_witness');	// Should be a node id.
	if (requestedTreeWitness !== undefined && requestedTreeWitness !== null) {
		UI.isLoading(true);
		const requestedVariable = urlParams.get('variable');
        const requestedBehaviour = urlParams.get('behaviour');
        const requestedVector = urlParams.get('vector');
        if(requestedVariable === undefined || requestedVariable === null || requestedVector === null) {
        	ComputeEngine.getTreeWitness(requestedTreeWitness, witnessCallback, true);
        } else {
        	// This is attractor stability query
            ComputeEngine._backendRequest('/get_stability_witness/' + requestedTreeWitness + '/' + encodeURI(requestedBehaviour) + '/' + encodeURI(requestedVariable) + '/' + encodeURI("["+requestedVector+"]"), witnessCallback, 'GET', null);
        }		
	}
}

let Strings = {
	removeNodeCheck(name) {
		return "Dou you really want to remove '"+name+"'?";
	},
	invalidVariableName(name) {
		return "Cannot use '"+name+"' as variable name.";
	},
	invalidUpdateFunction(name) {
		return "Cannot set update function for '"+name+"'.";
	},
	modelEmpty: "Cannot export an empty model.",
	modelWillBeErased: "This operation will overwrite your current model. Do you want to continue?",
	closePrompt: "There may be unsaved changes. Close window?",
}

/* This can be used to properly show placeholder for content editable stuff */
function fixEmptyEditable(e) {
	if (e.target.textContent.trim().length === 0) {
		e.target.textContent = "";		
	}
}

function ensurePlaceholder(el) {
	el.addEventListener("focusout", fixEmptyEditable);	
}

/*
	"Data types":
	id: Number
	regulation: {
		regulator: Id,
		target: Id,
		observable: bool,
		monotonicity: string from EdgeMonotonicity
	}
*/



