
/**
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

	/** Functions and properties for filtering variables from the model editor. */
	Filter: {
		// Text bar for filter input.
		_filterInput: undefined,

		/** Processes filter input in the form of string into array of variable names.
		 * 	CutFromStart (int) determines how many characters should be removed from the start of the string.
		*/
		_processFilterInput(cutFromStart, filterValue) {
			filterValue = filterValue.substring(cutFromStart);
			return filterValue.split(",").map(item => item.trim())
		},
	
		/** Gets all regulator ID of variables from the targetVariables array (array of variable name strings). */
		_getRegulators(targetVariables) {
			const regulatorIDs = new Set();

			for (varName of targetVariables) {
				const variable = LiveModel.Variables.variableFromName(varName);

				if (variable != undefined) {
					const regulations = LiveModel.Regulations.regulationsOf(variable.id);
					regulations.forEach(regulation => { regulatorIDs.add(regulation.regulator); } );
				}
			}
			
			return regulatorIDs;
		},

		/** Tests if variableName string contains one of the strings in the namesToKeep array. */
		_includesToKeep(namesToKeep, variableName) {
			for (toKeepString of namesToKeep) {
				if (variableName.includes(toKeepString)) {
					return true;
				}
			}

			return false;
		},
	
		/** Filters variables from the ModelEditor depending on the this._filterInput value.
		 * 	If this._filterInput value starts with "//target: " string then displays all regulators of the variables.
		 */
		filterVariables() {
			const filterValue = this._filterInput.value;
			const findRegulators = filterValue.startsWith("//target: ");

			const variableNames = this._processFilterInput(findRegulators == true ? 9 : 0, filterValue);
			const showAll = variableNames.length < 1 || variableNames[variableNames.length - 1] == "";

			const regulatorIds = (showAll == false && findRegulators == true) ? this._getRegulators(variableNames) : undefined;
			
			console.log(regulatorIds);
			LiveModel.Variables.getAllVariables().forEach(variable => {
				const variableBox = ModelEditor._getVariableBox(variable.id);

				if (showAll == true) {
					variableBox.style.display = "";
				} else if (findRegulators == true) {
					variableBox.style.display = regulatorIds.has(variable.id) ? "" : "none";
				} else {
					variableBox.style.display = this._includesToKeep(variableNames, variable.name) ? "" : "none";
				}
			})
		}
	},

	init() {
		this._variables = document.getElementById("model-variables");
		this._modelName = document.getElementById("model-name");
		this._modelDescription = document.getElementById("model-description");
		this._variableTemplate = document.getElementById("model-variable-template");
		this._regulationTemplate = document.getElementById("model-regulation-template");
		this.Filter._filterInput = document.getElementById("variable-filter");
		this.Filter._filterInput.value = "";
		this._modelDescriptionShown = false;
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
		let stats = LiveModel.Export.stats();
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
		let showVariableInfo = variableBox.getElementsByClassName("centered-button")[0];
		let variableControllability = variableBox.getElementsByClassName("centered-button")[1];
		let variablePhenotype = variableBox.getElementsByClassName("centered-button")[2];
		let variableInfo = variableBox.getElementsByClassName("scrolling-container")[0];
		let variableName = variableBox.getElementsByClassName("variable-name")[0];
		let updateFunction = variableBox.getElementsByClassName("variable-function")[0];
		const variable = LiveModel.Variables.variableFromId(id);

		variableBox.setAttribute("variable-id", id);
		variableBox.removeAttribute("id");
		variableName.value = name;

		variableControllability.style.backgroundColor = variable.controllable ? "#FFFF66" : "#B0BEC5";
		variablePhenotype.style.backgroundColor = variable.phenotype == null ? "#B0BEC5" :
													variable.phenotype ? "green" : "red";
		variableInfo.style.display = "none";

		showVariableInfo.setAttribute("variable-id", id);
		variableControllability.setAttribute("variable-id", id);
		variablePhenotype.setAttribute("variable-id", id);

		showVariableInfo.addEventListener("click", (e) => {
			const buttonDivs = e.target.getElementsByTagName('div');
			const buttonArrow = buttonDivs[0];
			const variableBox = this._getVariableBox(e.target.getAttribute("variable-id"));
			const variableInfo = variableBox.getElementsByClassName("scrolling-container")[0];

			if (variableInfo.style.display == "none") {
				variableInfo.style.display = "";
				buttonArrow.classList.remove("down");
				buttonArrow.classList.add("up");
				buttonArrow.style.top = "20%";
			} else {
				variableInfo.style.display = "none";
				buttonArrow.classList.remove("up");
				buttonArrow.classList.add("down");
				buttonArrow.style.top = "35%";
			}
		})

		variableControllability.addEventListener("click", (e) => {
			const button = e.target;
			const variable = LiveModel.Variables.variableFromId(button.getAttribute("variable-id"));

			LiveModel.Control.changeControllableById(id, !variable.controllable);
		})

		variablePhenotype.addEventListener("click", (e) => {
			const button = e.target;
			const variable = LiveModel.Variables.variableFromId(button.getAttribute("variable-id"));

			var newPhen = variable.phenotype == null ? true : variable.phenotype == true ? false : null;

			LiveModel.Control.changePhenotypeById(variable.id, newPhen);
		})

		// On change, validate variable name and display error if needed.
		variableName.addEventListener("change", (e) => {
			let error = LiveModel.Variables.renameVariable(id, variableName.value);
			if (error !== undefined) {
				Warning.displayWarning(error);
				variableName.classList.add("error");
			} else {
				variableName.classList.remove("error");
			}
		});

		variableName.addEventListener("focus", () => {
			LiveModel._modelModified();
		});

		updateFunction.addEventListener("focus", () => {
			LiveModel._modelModified();
		});

		// On change, validate function and display error if needed.
		updateFunction.addEventListener("focusout", (e) => {
			let error = LiveModel.UpdateFunctions.setUpdateFunction(id, updateFunction.textContent);
			if (error !== undefined) {
				Warning.displayWarning(error);
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

		let variableShowButton = variableBox.getElementsByClassName("model-variable-show")[0];
		// Enable show button
		variableShowButton.addEventListener("click", (e) => {
			CytoscapeEditor.showNode(id);
		});

		variableShowButton.addEventListener("mouseenter", (e) => {
			UI.HoverHint.displayHover(e.target, 37, 0, 'Find variable');
		});

		variableShowButton.addEventListener("mouseleave", () => {
			UI.HoverHint.hideHover();
		});

		let removeVarButton = variableBox.getElementsByClassName("model-variable-remove")[0];
		// Enable remove button
		removeVarButton.addEventListener("click", () => {
			LiveModel.Variables.removeVariable(id);
		});
		removeVarButton.addEventListener("mouseenter", (e) => {
			UI.HoverHint.displayHover(e.target, 37, 0, 'Remove variable');
		});
		removeVarButton.addEventListener("mouseleave", () => {
			UI.HoverHint.hideHover();
		});

		ensurePlaceholder(variableBox.getElementsByClassName("variable-function")[0]);
		this._variables.appendChild(variableBox);
	},

	// Set a message that is displayed next to the update function.
	setUpdateFunctionStatus(id, message, isError = false) {
		let box = this._getVariableBox(id);
		if (box !== undefined) {
			let status = box.getElementsByClassName("variable-function-status")[0];
			status.innerHTML = message;
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
			UI.Visible.ensureContentTabOpen(ContentTabs.modelEditor);
			let variableName = variableBox.getElementsByClassName("variable-name")[0];
			variableName.focus();
			variableName.select();
		}
	},

	focusFunctionInput(id) {
		let variableBox = this._getVariableBox(id);
		if (variableBox !== undefined) {
			UI.Visible.ensureContentTabOpen(ContentTabs.modelEditor);

			const variableInfo = variableBox.getElementsByClassName("scrolling-container")[0];

			if (variableInfo.style.display == "none") {
				variableInfo.style.display = "";
			}

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
					LiveModel.Regulations.toggleObservability(regulation.regulator, regulation.target);
				});
				monotonicity.addEventListener("click", (e) => {
					LiveModel.Regulations.toggleMonotonicity(regulation.regulator, regulation.target);
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
			regulatorName.textContent = LiveModel.Variables.getVariableName(regulation.regulator);
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

	/** Toggles visibility of the model description. */
	toggleModelDescription() {
		const toggleButton = document.getElementById("button-model-description");
		if (this._modelDescription.style.display == "") {
			toggleButton.innerHTML = "Show model description";
			this._modelDescription.style.display = "none";
		} else {
			toggleButton.innerHTML = "Hide model description";
			this._modelDescription.style.display = "";
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

	/** Updates phenotype button colour of the variable in the ModelEditor. */
	updatePhenotype(variable) {
		const button = this._getVariableBox(variable.id).getElementsByClassName("centered-button")[2];
		

		if (variable.phenotype == null) {
			button.style.backgroundColor = "#B0BEC5";

		} else if (variable.phenotype) {
			button.style.backgroundColor = "green";
		} else {
			button.style.backgroundColor = "red";
		}
	},

	/** Updates controll button colour of the variable in the ModelEditor. */
	updateControllable(variable) {
		const button = this._getVariableBox(variable.id).getElementsByClassName("centered-button")[1];

		if (variable.controllable) {
			button.style.backgroundColor = "#FFFF66";
		} else {
			button.style.backgroundColor = "#B0BEC5";
		}
	},
}
