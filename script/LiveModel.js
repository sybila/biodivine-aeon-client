/*
	Stores the PBN currently loaded into the editor. This is what you should interact with when
	you want to modify the model, not the editor or graph directly.

	It is the responsibility of the `LiveModel`` to always update `ModelEditor` and `CytoscapeEditor`
	to reflect the current state of the model.
*/
let LiveModel = {

	// used to provide unique variable ids
	_idCounter: 0,
	_variables: {},

	// Create a new variable with a default name. Returns an id of the variable.
	addVariable: function(position = [0,0]) {
		let id = this._idCounter;
		this._idCounter += 1;
		let name = "v_"+(id + 1);
		this._variables[id] = { name: name, id: id }
		CytoscapeEditor.addNode(id, name, position);
		ModelEditor.addVariable(id, name);
		return id;
	},

	// Remove the given variable from the model.
	removeVariable(id) {
		let variable = this._variables[id];
		if (variable === undefined) return;	// nothing to remove
		// prompt user to confirm action
		if (confirm(Strings.removeNodeCheck(variable['name']))) {
			delete this._variables[id];
			CytoscapeEditor.removeNode(id);
			ModelEditor.removeVariable(id);
		}
	},

	// Change the name of the variable to the given value, if the name is valid.
	// Return true if change was successful and false if not.
	renameVariable(id, newName) {
		let variable = this._variables[id];
		if (variable == undefined) return;
		if (!this._checkVariableName(newName)) {
			alert(Strings.invalidVariableName(newName));
			return false;
		} else {
			variable.name = newName;
			CytoscapeEditor.renameNode(id, newName);
			ModelEditor.renameVariable(id, newName)			
			return true;
		}		
	},

	// Check if the name is valid - it must contain only alphanumeric characters (and _ { })
	// and it must not be a name of another variable.
	_checkVariableName(name) {
		if (typeof name !== "string") return false;
		let has_valid_chars = name.match(/^[a-z0-9{}_]+$/i) != null;
		if (!has_valid_chars) return false;
		let keys = Object.keys(LiveModel._variables);
		for (var i = 0; i < keys.length; i++) {
			let key = keys[i];
			if (this._variables[key].name == name) return false;
		}
		return true;		
	}

}
