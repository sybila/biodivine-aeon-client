
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

	// Template element that we use to create new variable boxes.
	_variableTemplate: undefined,

	init() {
		this._variables = document.getElementById("model-variables");
		this._modelName = document.getElementById("model-name");
		this._modelDescription = document.getElementById("model-description");
		this._variableTemplate = document.getElementById("model-variable-template");
	},

	// Create a new variable box for the given id (without any regulations).
	addVariable(id, name) {
		let variableBox = this._variableTemplate.cloneNode(true);		
		let variableName = variableBox.getElementsByClassName("variable-name")[0];
		variableBox.setAttribute("variable-id", id);
		variableBox.removeAttribute("id");
		variableBox.classList.remove("gone");
		variableName.value = name;
		variableName.addEventListener("change", (e) => {
			// TODO: What happens if I rename the variable but the change is rejected?
			LiveModel.renameVariable(id, variableName.value);
		});
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
		this._variables.appendChild(variableBox);
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
	renameVariable(id, newName) {
		let variableBox = this._getVariableBox(id);
		if (variableBox !== undefined) {
			let nameInput = variableBox.getElementsByClassName("variable-name")[0];
			if (nameInput.value != newName) {
				nameInput.value = newName;
			}
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

	// Utility method to find the variable box GUI element for the given variable.
	_getVariableBox(id) {
		let boxes = this._variables.children;
		for (var i = 0; i < boxes.length; i++) {
			let box = boxes[i];
			if (box.getAttribute("variable-id") == id) return box;
		}
		return undefined;
	},

}
