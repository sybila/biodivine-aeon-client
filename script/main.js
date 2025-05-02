hasLocalStorage = false;

function init() {
	// Safari security alert
	let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	if (isSafari) {
		alert(
			"At the moment, security measures in Safari may prevent you from connecting to the AEON compute engine.\n\n" + 
			"You can still use the editor to view, modify and export models. While we work on this issue, you " + 
			"can access full AEON functionaliy in Google Chrome."
		);
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
	CytoscapeEditor.init();			
	ComputeEngine.openConnection();	// Try to automatically connect when first opened.

	let witnessCallback = function(e, r) {
		UI.isLoading(false);
		if (e !== undefined) {
			alert(e);
		} else {
			let error = LiveModel.importAeon(r.model);				
			if (error !== undefined) {
        		alert(error);
        	}
        	UI.ensureContentTabOpen(ContentTabs.modelEditor);
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

	loadBbmData();
}

/**
 * Populate the import model table with BBM models.
 */
async function loadBbmData() {
	bbmTable = document.getElementById("bbm-table")
	
	try {
		// Load the BBM dataset from github. 

		// We start by obtaining the latest commit hash.
		let commit_url = 'https://api.github.com/repos/sybila/biodivine-boolean-models/commits/main'
		commitData = await sendGithubRequest(commit_url);

		// Then, we find the `models` directory inside the repository.
		let url = `https://api.github.com/repos/sybila/biodivine-boolean-models/git/trees/${commitData['sha']}`
		let repo_content = await sendGithubRequest(url);
		let models_url = null;
		for (let item of repo_content["tree"]) {
			if(item["path"] == "models") {
				models_url = item["url"];
				break;
			}
		}

		// Dump all model names, ids and sizes.
		let models_content = await sendGithubRequest(models_url);
		let models = [];
		let name_regex = /\[id-(\d+)\]__\[var-(\d+)\]__\[in-(\d+)\]__\[([A-Z0-9_-]+)\]/
		for (let item of models_content["tree"]) {			
			m = item["path"].match(name_regex)
			if (m === null) {
				continue
			}
			models.push([m[1], m[2], m[4], item["url"]])			
		}

		// Generate table HTML content.
		tableContent = "<tbody>"
		for (let model of models) {
			tableContent += `
				<tr data-model-id='${model[0]}' data-model-url='${model[3]}' onclick='openBbmModel(this)'>
					<td>${model[0]}</td>
					<td>${model[2]}</td>
					<td>${model[1]}</td>
				</tr>
			`
		}
		tableContent += "</tbody>"

		bbmTable.innerHTML = bbmTable.innerHTML + tableContent
	} catch (e) {
		error_row = `
			<tr>
				<td></td>
				<td>${e}</td>
				<td></td>
			</tr>
		`;
		bbmTable.innerHTML = bbmTable.innerHTML + error_row;
	}
}

/**
 * A helper method that constructs and executes a synchronous HTTP request to the Github API.
 * 
 * TODO: This currently cannot catch an error if the connection is completely down. It just silently fails. 
 */
async function sendGithubRequest(url) {
	return new Promise((resolve, reject) => {
		try {
			var request = new XMLHttpRequest();
			request.onload = (_e) => {
				if (request.readyState === 4) {
					if (request.status === 200) {
						resolve(JSON.parse(request.responseText));
					} else {
						reject(request.statusText);
					}
				}
			};
			request.onerror = (_e) => {
				reject(request.statusText);
			};
			request.open("GET", url, true);
			request.setRequestHeader("Accept", "application/vnd.github+json")
			request.setRequestHeader("X-GitHub-Api-Version", "2022-11-28")
			request.send(null);
		} catch (e) {
			reject(e);
		}
	});
}

async function openBbmModel(e) {
	try {
		UI.isLoading(true);
		modelFolder = await sendGithubRequest(e.dataset.modelUrl);
		fileUrl = null;
		for (let file of modelFolder["tree"]) {
			if (file["path"] == "model.aeon") {
				fileUrl = file["url"];
				break;
			}
		}

		modelData = await sendGithubRequest(fileUrl);
		aeonModel = atob(modelData["content"]);
		LiveModel.importAeon(aeonModel);
	} catch (e) {
		alert(e);
	} finally {
		UI.isLoading(false);
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

hotkeys('e', function(event, handler) {	
	if (UI.isNodeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("node-menu-edit-name"), "click");
	}	
});

hotkeys('f', function(event, handler) {	
	if (UI.isNodeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("node-menu-edit-function"), "click");
	}	
});

hotkeys('backspace', function(event, handler) {	
	if (UI.isNodeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("node-menu-remove"), "click");
	}	
	if (UI.isEdgeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("edge-menu-remove"), "click");
	}
});

hotkeys('o', function(event, handler) {	
	if (UI.isEdgeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("edge-menu-observability"), "click");
	}	
});

hotkeys('m', function(event, handler) {	
	if (UI.isEdgeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("edge-menu-monotonicity"), "click");
	}	
});

hotkeys('n,+', function(event, handler) {	
	event.preventDefault();
	let id = LiveModel.addVariable();
	CytoscapeEditor.showNode(id);
});

hotkeys('h', { keyup: true }, function(event, handler) {
	if (event.type === 'keydown') {
		UI.setQuickHelpVisible(true);
	}
	if (event.type === 'keyup') {
		UI.setQuickHelpVisible(false);
	}	
});


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