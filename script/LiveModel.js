/*
	Stores the PBN currently loaded into the editor. This is what you should interact with when
	you want to modify the model, not the editor or graph directly.

	It is the responsibility of the `LiveModel`` to always update `ModelEditor` and `CytoscapeEditor`
	to reflect the current state of the model.
*/
let LiveModel = {

	// used to provide unique variable ids
	_idCounter: 0,
	// keys are variable ids, values are variable objects { id, name }
	_variables: {},
	// keys are variable ids, values are update function strings
	_updateFunctions: {},
	_regulations: [],

	// Get the name of the variable with given id.
	getVariableName(id) {
		let variable = this._variables[id];
		if (variable === undefined) return undefined;
		return variable.name;
	},

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
			// First, explicitly remove all regulations that have something to do with us.
			for (var i = 0; i < this._regulations.length; i++) {
				let reg = this._regulations[i];
				if (reg.regulator == id || reg.target == id) this._removeRegulation(reg);
			}
			delete this._variables[id];
			CytoscapeEditor.removeNode(id);
			ModelEditor.removeVariable(id);
		}
	},

	// Change the name of the variable to the given value, if the name is valid.
	// Return undefined if the change was successful, otherwise return error string.
	renameVariable(id, newName) {
		let variable = this._variables[id];
		if (variable == undefined) return;
		let error = this._checkVariableName(id, newName);
		if (error !== undefined) {
			error = Strings.invalidVariableName(newName) + " " + error;			
			return error;
		} else {
			variable.name = newName;
			CytoscapeEditor.renameNode(id, newName);
			ModelEditor.renameVariable(id, newName)			
			// We also have to notify every regulation this variable appears in:
			// (technically, we don't have to notify regulations where variable appears
			// as target because that is not displayed right now anywhere, but we 
			// might as well notify them anyway).
			for (var i = 0; i < this._regulations.length; i++) {
				let reg = this._regulations[i];
				if (reg.regulator == id || reg.target == id) this._regulationChanged(reg);
			}
			return undefined;
		}		
	},

	// Try to set the update function for given variable. If the function is not valid, return 
	// error string, otherwise return undefined.
	setUpdateFunction(id, functionString) {
		let variable = this._variables[id];
		if (variable === undefined) return "Unknown variable '"+id+"'.";
		let error = this._checkUpdateFunction(id, functionString);
		if (error !== undefined) {
			error = Strings.invalidUpdateFunction(variable.name) + " " + error;
			return error;
		} else {
			if (functionString.length == 0) {
				delete this._updateFunctions[id];
			} else {
				this._updateFunctions[id] = functionString;
			}			
			// TODO: Run server analysis
		}
	},

	// True if there exists a regulation between the two variables, return it, otherwise give undefined.
	findRegulation(regulatorId, targetId) {
		for (var i = 0; i < this._regulations.length; i++) {
			let reg = this._regulations[i];
			if (reg.regulator == regulatorId && reg.target == targetId) return reg;
		}
		return undefined;
	},

	// Return a list of regulations that cthe given id is currently target of.
	regulationsOf(targetId) {
		let result = [];
		for (var i = 0; i < this._regulations.length; i++) {
			let reg = this._regulations[i];
			if (reg.target == targetId) result.push(reg);
		}
		return result;
	},

	// Try to add the specified regulation to the model. Return true if added successfully
	// and false if not (e.g. already exists).
	addRegulation(regulatorId, targetId, isObservable, monotonicity) {
		if (this.findRegulation(regulatorId, targetId) !== undefined) return false;
		let regulation = {
			regulator: regulatorId, target: targetId,
			observable: isObservable, monotonicity: monotonicity
		}
		this._regulations.push(regulation);
		this._regulationChanged(regulation);
		return true;
	},

	// Remove regulation between the two variables (if it is present). Return true if remove was successful.
	removeRegulation(regulatorId, targetId) {
		for (var i = 0; i < this._regulations.length; i++) {
			let reg = this._regulations[i];
			if (reg.regulator == regulatorId && reg.target == targetId) {
				return this._removeRegulation(reg);
			}
		}
		return false;
	},

	// Set the obsevability of the regulation between the two variables, if regulation exists.
	setObservability(regulatorId, targetId, isObservable) {
		let regulation = this.findRegulation(regulatorId, targetId);
		if (regulation !== undefined && regulation.observable != isObservable) {
			regulation.observable = isObservable;
			this._regulationChanged(regulation);
		}
	},

	// Switch observability of the given regulation.
	toggleObservability(regulatorId, targetId) {
		let regulation = this.findRegulation(regulatorId, targetId);
		if (regulation !== undefined) {
			regulation.observable = !regulation.observable;
			this._regulationChanged(regulation);
		}
	},

	// Set the monotonicity of the regulation between the two variables, if regulation exists.
	// Monotonicity should be one of `EdgeMonotonicity` constants.
	setMonotonicity(regulatorId, targetId, monotonicity) {
		let regulation = this.findRegulation(regulatorId, targetId);
		if (regulation !== undefined && regulation.monotonicity != monotonicity) {
			regulation.monotonicity = monotonicity;
			this._regulationChanged(regulation);
		}
	},

	// Switch monotonicity to next value
	toggleMonotonicity(regulatorId, targetId) {
		let regulation = this.findRegulation(regulatorId, targetId);
		if (regulation !== undefined) {
			let next = EdgeMonotonicity.unspecified;
			if (regulation.monotonicity == EdgeMonotonicity.unspecified) next = EdgeMonotonicity.activation;
			if (regulation.monotonicity == EdgeMonotonicity.activation) next = EdgeMonotonicity.inhibition;
			regulation.monotonicity = next;
			this._regulationChanged(regulation);
		}
	},

	_regulationChanged(regulation) {
		ModelEditor.ensureRegulation(regulation);
		CytoscapeEditor.ensureRegulation(regulation);
	},

	// Remove the given regulation object from the regulations array.
	_removeRegulation(regulation) {
		let index = this._regulations.indexOf(regulation);
		if (index > -1) {			
			this._regulations.splice(index, 1);
			CytoscapeEditor.removeRegulation(regulation.regulator, regulation.target);
			ModelEditor.removeRegulation(regulation.regulator, regulation.target);
			return true;
		}
		return false;
	},

	// Check if the name is valid - it must contain only alphanumeric characters (and _ { })
	// and it must not be a name of another variable.
	// If the name is valid, return undefined, otherwise return an error string.
	_checkVariableName(id, name) {
		if (typeof name !== "string") return "Name must be a string.";
		let has_valid_chars = name.match(/^[a-z0-9{}_]+$/i) != null;
		if (!has_valid_chars) return "Name can only contain letters, numbers and `_`, `{`, `}`.";
		let keys = Object.keys(LiveModel._variables);
		for (var i = 0; i < keys.length; i++) {
			let key = keys[i];
			let variable = this._variables[key];
			if (variable.name == name && variable.id != id) return "Variable with this name already exists";
		}
		return undefined;		
	},

	_checkUpdateFunction(id, functionString) {
		// TODO
		if (functionString.length == 0) return undefined;	// empty function is always ok
		return "Test error...";
	},

}
