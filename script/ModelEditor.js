
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
		this._variables.appendChild(variableBox);
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
