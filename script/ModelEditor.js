
/*
	Responsible for managing the UI of the model editor, i.e. adding/removing variables and regulations, focusing
	right elements when needed, etc.

	Remeber that this is not the ground "source of truth" for the model. That is `LiveModel`, these are just
	utility methods for dealing with the model editor UI.
*/
let ModelEditor = {
	// The element which contains all variable UI boxes.
	_variables: undefined,
	// Inputs for specifying model name and description
	_modelName: undefined,
	_modelDescription: undefined,

	// Template element that we use to create new variable boxes and regulation rows.
	_variableTemplate: undefined,
	_regulationTemplate: undefined,

	init() {
		this._variables = document.getElementById("model-variables");
		this._modelName = document.getElementById("model-name");
		this._modelDescription = document.getElementById("model-description");
		this._variableTemplate = document.getElementById("model-variable-template");
		this._regulationTemplate = document.getElementById("model-regulation-template");
		ensurePlaceholder(document.getElementById("model-description"));
	},

	// Return the name of this model as given by the user, or undefined if no name is set.
	getModelName() {
		let name = this._modelName.value;
		if (name.length == 0) return undefined;
		return name;
	},

	// Return the description opf this model as given by the user, or undefined if no description is given.
	// Note that the returned string can contain HTML, but it should be one line so it
	// should be safe to use almost anywhere.
	getModelDescription() {
		let description = this._modelDescription.innerHTML;
		if (description.length == 0) return undefined;
		return description;
	},

	setModelName(name) {
		this._modelName.value = name;
	},

	setModelDescription(description) {
		this._modelDescription.innerHTML = description;
	},

	updateStats() {
		let stats = LiveModel.stats();
		let statsTable = document.getElementById("model-stats");
		let rows = statsTable.getElementsByClassName("row");
		let row1 = rows[0];
		let row2 = rows[1];
		let row3 = rows[2];
		let row4 = rows[3];
		row1.children[1].textContent = stats.variableCount;
		row1.children[3].textContent = "2^" + stats.parameterVariables;
		row2.children[1].textContent = stats.regulationCount;
		row2.children[3].textContent = "2^" + stats.variableCount;
		row3.children[1].textContent = stats.maxInDegree;
		row3.children[3].textContent = stats.maxOutDegree;		
		if (stats.explicitParameters.length == 0) {
			row4.children[1].textContent = "(none)";
		} else {
			let parametersString = "";
			for (var i = 0; i < stats.explicitParameters.length; i++) {
				if (i != 0) parametersString += ", ";
				let name = stats.explicitParameters[i];
				parametersString += name;
			}
			row4.children[1].textContent = parametersString;
		}		
	},

	// Create a new variable box for the given id (without any regulations).
	addVariable(id, name) {
		let variableBox = this._variableTemplate.cloneNode(true);		
		let variableName = variableBox.getElementsByClassName("variable-name")[0];
		let updateFunction = variableBox.getElementsByClassName("variable-function")[0];
		variableBox.setAttribute("variable-id", id);
		variableBox.removeAttribute("id");
		variableName.value = name;		
		// On change, validate variable name and display error if needed.
		variableName.addEventListener("change", (e) => {			
			let error = LiveModel.renameVariable(id, variableName.value);
			if (error !== undefined) {
				alert(error);
				variableName.classList.add("error");
			} else {
				variableName.classList.remove("error");
			}
		});
		// On change, validate function and display error if needed.
		updateFunction.addEventListener("focusout", (e) => {		
			let error = LiveModel.setUpdateFunction(id, updateFunction.textContent);
			if (error !== undefined) {
				alert(error);
				updateFunction.classList.add("error");
			} else {
				updateFunction.classList.remove("error");
			}
		});
		updateFunction.setAttribute("data-placeholder", "$f_"+name+"(...)");
		// Enable synchronizing hover and selected state
		variableBox.addEventListener("mouseenter", (e) => {
			variableBox.classList.add("hover");
			CytoscapeEditor.hoverNode(id, true);
		});
		variableBox.addEventListener("mouseleave", (e) => {
			variableBox.classList.remove("hover");
			CytoscapeEditor.hoverNode(id, false);
		});
		// Enable show button
		variableBox.getElementsByClassName("model-variable-show")[0].addEventListener("click", (e) => {
			CytoscapeEditor.showNode(id);
		});
		// Enable remove button
		variableBox.getElementsByClassName("model-variable-remove")[0].addEventListener("click", (e) => {
			LiveModel.removeVariable(id);
		});			
		ensurePlaceholder(variableBox.getElementsByClassName("variable-function")[0]);
		this._variables.appendChild(variableBox);
	},

	// Set a message that is displayed next to the update function.
	setUpdateFunctionStatus(id, message, isError = false) {
		let box = this._getVariableBox(id);
		if (box !== undefined) {
			let status = box.getElementsByClassName("variable-function-status")[0];
			status.textContent = message;
			if (isError) {
				status.classList.add("red");
			} else {
				status.classList.remove("red");
			}
		}
	},

	// Allow to externally set which variable box should be hovered. (Remeber to unset afterwards)
	hoverVariable(id, isHover) {
		let box = this._getVariableBox(id);
		if (box !== undefined) {
			if (isHover) {
				box.classList.add("hover");
			} else {
				box.classList.remove("hover");
			}
		}
	},

	hoverRegulation(regulatorId, targetId, isHover) {
		let box = this._getVariableBox(targetId);
		if (box !== undefined) {
			let row = this._getRegulatorRow(box, regulatorId);
			if (row !== undefined) {
				if (isHover) {
					row.classList.add("hover");		
				} else {
					row.classList.remove("hover");
				}				
			}
		}
	},

	// Set which variable is currently selected (remember to also unselect afterwards)
	selectVariable(id, isSelected) {
		let box = this._getVariableBox(id);
		if (box !== undefined) {
			if (isSelected) {
				box.classList.add("selected");
			} else {
				box.classList.remove("selected");
			}
		}
	},

	// Remove a variable box and all associated regulations from the editor.
	removeVariable(id) {
		let variableBox = this._getVariableBox(id);
		if (variableBox !== undefined) {
			this._variables.removeChild(variableBox);
		}		
	},

	// Change the name of the given variable (if different - to avoid event loops).
	renameVariable(id, newName, oldName) {
		let variableBox = this._getVariableBox(id);
		if (variableBox !== undefined) {
			let nameInput = variableBox.getElementsByClassName("variable-name")[0];
			if (nameInput.value != newName) {
				nameInput.value = newName;
			}
		}	
		// Replace occurences of the variable in the update functions:
		let boxes = this._variables.children;
		// Regex which matches the old name plus one extra character at the end and beginning 
		// to verify that this is not a substring of another name.
		let oldNameRegex = new RegExp("[^a-zA-Z0-9_{}]"+oldName+"[^a-zA-Z0-9_{}]");		
		// The same, but name is at the very beginning
		let oldNameStartRegex = new RegExp("^"+oldName+"[^a-zA-Z0-9_{}]");
		// And end
		let oldNameEndRegex = new RegExp("[^a-zA-Z0-9_{}]"+oldName+"$");
		for (var i = 0; i < boxes.length; i++) {
			let box = boxes[i];
			let updateFunction = box.getElementsByClassName("variable-function")[0];
			let content = updateFunction.textContent;
			content = content.replace(oldNameRegex, (match) => {
				return match[0] + newName + match[match.length - 1];	// preserve the boundary 
			});
			content = content.replace(oldNameStartRegex, (match) => {
				return newName + match[match.length - 1];				// preserve the boundary 
			});
			content = content.replace(oldNameEndRegex, (match) => {
				return match[0] + newName;								// preserve the boundary 
			});
			updateFunction.textContent = content;
		}
	},

	// Focus on the name input of the given variable and select all text in this input.
	focusNameInput(id) {
		let variableBox = this._getVariableBox(id);
		if (variableBox !== undefined) {
			UI.ensureContentTabOpen(ContentTabs.modelEditor);
			let variableName = variableBox.getElementsByClassName("variable-name")[0];
			variableName.focus();
			variableName.select();
		}
	},

	focusFunctionInput(id) {
		let variableBox = this._getVariableBox(id);
		if (variableBox !== undefined) {
			UI.ensureContentTabOpen(ContentTabs.modelEditor);
			let updateFunction = variableBox.getElementsByClassName("variable-function")[0];
			updateFunction.focus();			
		}
	},

	// Change the content of the update function string.
	setUpdateFunction(id, functionString) {
		let variableBox = this._getVariableBox(id);
		if (variableBox !== undefined) {
			let updateFunction = variableBox.getElementsByClassName("variable-function")[0];
			updateFunction.innerHTML = functionString;
		}
	},

	// Ensure that the given regulation is shown in the editor (do not add duplicates).
	ensureRegulation(regulation) {
		let variableBox = this._getVariableBox(regulation.target);
		if (variableBox !== undefined) {
			let row = this._getRegulatorRow(variableBox, regulation.regulator);
			if (row === undefined) {
				// We have to create a new row
				row = this._regulationTemplate.cloneNode(true);
				row.removeAttribute("id");
				row.setAttribute("regulator-id", regulation.regulator);
				variableBox.getElementsByClassName("model-variable-regulators")[0].appendChild(row);
				let observable = row.getElementsByClassName("model-regulation-observable")[0];
				let monotonicity = row.getElementsByClassName("model-regulation-monotonicity")[0];
				// make text-button toggles work
				observable.addEventListener("click", (e) => {
					LiveModel.toggleObservability(regulation.regulator, regulation.target);
				});
				monotonicity.addEventListener("click", (e) => {
					LiveModel.toggleMonotonicity(regulation.regulator, regulation.target);
				})
				row.addEventListener("mouseenter", (e) => {
					row.classList.add("hover");
					CytoscapeEditor.hoverEdge(regulation.regulator, regulation.target, true);
				});
				row.addEventListener("mouseleave", (e) => {
					row.classList.remove("hover");
					CytoscapeEditor.hoverEdge(regulation.regulator, regulation.target, false);
				});
			}
			// Update row info...
			let regulatorName = row.getElementsByClassName("model-regulation-regulator")[0];
			let regulationShort = row.getElementsByClassName("model-regulation-short")[0];
			let observable = row.getElementsByClassName("model-regulation-observable")[0];
			let monotonicity = row.getElementsByClassName("model-regulation-monotonicity")[0];
			monotonicity.textContent = regulation.monotonicity;
			if (regulation.observable) {
				observable.textContent = "observable";
				observable.classList.remove("grey");
			} else {
				observable.textContent = "non-observable";
				observable.classList.add("grey");
			}
			regulatorName.textContent = LiveModel.getVariableName(regulation.regulator);
			let short = "-";
			monotonicity.classList.remove("red");
			monotonicity.classList.remove("green");
			monotonicity.classList.remove("grey");
			if (regulation.monotonicity == EdgeMonotonicity.unspecified) {
				short += "?";				
				monotonicity.classList.add("grey");
			}
			if (regulation.monotonicity == EdgeMonotonicity.activation) {
				short += ">";
				monotonicity.classList.add("green");
			}
			if (regulation.monotonicity == EdgeMonotonicity.inhibition) {
				short += "|";
				monotonicity.classList.add("red");
			}
			if (!regulation.observable) {
				short += "?";
			}
			regulationShort.textContent = short;
		}
	},

	// Remove regulation between the two specified variables.
	removeRegulation(regulatorId, targetId) {
		let variableBox = this._getVariableBox(targetId);
		if (variableBox !== undefined) {
			let row = this._getRegulatorRow(variableBox, regulatorId);
			if (row !== undefined) {
				variableBox.getElementsByClassName("model-variable-regulators")[0].removeChild(row);
			}
		}
	},

	// Utility method to find the variable box GUI element for the given variable.
	_getVariableBox(id) {
		let boxes = this._variables.children;
		for (var i = 0; i < boxes.length; i++) {
			let box = boxes[i];
			if (box.getAttribute("variable-id") == id) return box;
		}
		return undefined;
	},

	// Return a regulator row inside the given variable box.
	_getRegulatorRow(variableBox, regulatorId) {
		let regulators = variableBox.getElementsByClassName("model-variable-regulators")[0].children;
		for (var i = 0; i < regulators.length; i++) {
			let box = regulators[i];
			if (box.getAttribute("regulator-id") == regulatorId) return box;
		}
		return undefined;
	},

}
