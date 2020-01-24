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
	// keys are variable ids, values are update function strings with metadata { functionString, metadata }
	_updateFunctions: {},
	_regulations: [],

	// True if the model has no variables.
	isEmpty() {
		return Object.keys(this._variables).length == 0;
	},

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
		ModelEditor.updateStats();
		UI.setQuickHelpVisible(false);
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
			delete this._updateFunctions[id];
			CytoscapeEditor.removeNode(id);
			ModelEditor.removeVariable(id);
			ModelEditor.updateStats();
			if (this.isEmpty()) UI.setQuickHelpVisible(true);
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
			let oldName = variable.name;
			variable.name = newName;
			CytoscapeEditor.renameNode(id, newName);
			ModelEditor.renameVariable(id, newName, oldName);	
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
		let check = this._checkUpdateFunction(id, functionString);
		if (typeof check === "string") {
			error = Strings.invalidUpdateFunction(variable.name) + " " + check;
			return error;
		} else {
			if (functionString.length == 0) {
				delete this._updateFunctions[id];
			} else {
				this._updateFunctions[id] = {
					functionString: functionString,
					metadata: check,
				};
			}
			ModelEditor.updateStats();
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

	// Return a list of regulations that the given id is currently target of.
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
		ModelEditor.updateStats();
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

	// Export stats object
	stats() {
		let maxInDegree = 0;
		let maxOutDegree = 0;
		let keys = Object.keys(this._variables);
		let explicitParameterNames = new Set();
		let parameterVars = 0;
		for (var i = 0; i < keys.length; i++) {
			let key = keys[i];
			let variable = this._variables[key];
			let regulators = 0;
			let targets = 0;
			for (var j = 0; j < this._regulations.length; j++) {
				let r = this._regulations[j];
				if (r.target == variable.id) {
					regulators += 1;
				}
				if (r.regulator == variable.id) {
					targets += 1;
				}
			}
			if (regulators > maxInDegree) {
				maxInDegree = regulators;
			}
			if (targets > maxOutDegree) {
				maxOutDegree = targets;
			}
			if (this._updateFunctions[key] === undefined) {
				// If the variable has implicit update function, count the function rows as parameter vars
				parameterVars += (1 << regulators); 
			} else {
				let metadata = this._updateFunctions[key].metadata;
				for (let parameter of metadata.parameters) {
					let p_key = parameter.name+"("+parameter.cardinality+")";
					if (!explicitParameterNames.has(p_key)) {
						explicitParameterNames.add(p_key);
						parameterVars += (1 << parameter.cardinality);
					}
				}
			}
		}
		let explicitParameters = Array.from(explicitParameterNames);
		explicitParameters.sort();
		return { 
			maxInDegree: maxInDegree,
			maxOutDegree: maxOutDegree,
			variableCount: keys.length,
			parameterVariables: parameterVars,
			regulationCount: this._regulations.length,
			explicitParameters: explicitParameters,
		};
	},

	// Notify editors that a regulation has been changed.
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
			ModelEditor.updateStats();
			return true;
		}
		return false;
	},

	// If variable with the given name exists, return the variable object, otherwise return undefined.
	_variableFromName(name) {
		let keys = Object.keys(LiveModel._variables);
		for (var i = 0; i < keys.length; i++) {
			let key = keys[i];
			let variable = this._variables[key];
			if (variable.name == name) return variable;
		}
		return undefined;
	},

	// Check if the name is valid - it must contain only alphanumeric characters (and _ { })
	// and it must not be a name of another variable.
	// If the name is valid, return undefined, otherwise return an error string.
	_checkVariableName(id, name) {
		if (typeof name !== "string") return "Name must be a string.";
		let has_valid_chars = name.match(/^[a-z0-9{}_]+$/i) != null;
		if (!has_valid_chars) return "Name can only contain letters, numbers and `_`, `{`, `}`.";
		let existing_variable = this._variableFromName(name);
		if (existing_variable !== undefined && existing_variable.id != id) {
			return "Variable with this name already exists";
		}		
		return undefined;		
	},

	// Run as many quick static checks on the update function as possible, returning error string if
	// something goes wrong.
	// If check is successful, return a metadata object which contains the parameters used in the
	// function.
	_checkUpdateFunction(id, functionString) {
		if (functionString.length == 0) return undefined;	// empty function is always ok
		// First, try to tokenize the update function to get a nice representation of what is going on.
		let tokens = _tokenize_update_function(functionString);
		if (typeof tokens === "string") {	// tokenization failed
			return tokens;
		}
		tokens = this._process_function_calls(tokens);
		if (typeof tokens === "string") {	// function call parsing failed
			return tokens;
		}
		// Now perform some basic checks - we are not doing full parsing, so things like operator cardinality
		// are not checked, but we at least want to verify that we are not using any invalid variable names
		let names = new Set();			
		_extract_names_with_cardinalities(tokens, names);
		let parameters = new Set();		
		for (let item of names) {
			let variable = this._variableFromName(item.name);
			if (variable === undefined) {	// item is a parameter - save it
				parameters.add(item);
			}
			// Check if variable is used as parameter
			if (item.cardinality > 0) {	
				if (variable !== undefined) {
					return "Variable '"+item.name+"' used as parameter.";
				}
			}
			// if this is a variable, we have to verify that it is a regulator. If not, offer to make it one.
			if (variable !== undefined) {
				let regulation = this.findRegulation(variable.id, id);
				if (regulation === undefined) {
					let my_name = this.getVariableName(id);
					let message = "Variable '"+variable.name+"' does not regulate '"+my_name+"'.";
					if (confirm(message + " Do you want to create the regulation now?")) {
						this.addRegulation(variable.id, id, true, EdgeMonotonicity.unspecified);
					} else {
						return message;
					}
				}
			}			
		}
		// Check if parameters are used consistently with other functions
		let function_keys = Object.keys(LiveModel._updateFunctions);
		for (var i = 0; i < function_keys.length; i++) {
			let key = function_keys[i];
			let function_data = this._updateFunctions[key];
			for (let parameter of function_data.metadata.parameters) {
				for (let my_parameter of parameters) {
					if (parameter.name == my_parameter.name && parameter.cardinality != my_parameter.cardinality) {
						let message = "Parameter '"+my_parameter.name+"' used with "+my_parameter.cardinality+" argument(s).";
						message += " Variable '"+this._variables[key].name+"' already uses the same parameter with "+parameter.cardinality+" argument(s).";
						return message;
					}
				}
			}
		}		
		return { parameters: parameters };
	},

	/// In the tokenized update function, detect all occurrences of the function call pattern (i.e. x(a,b,c))
	/// and replace it with a new token which represents the function call.
	/// Returns either the modified token array or an error string if problem is found.
	/// Note that we also check if the names in calls are variable names.
	_process_function_calls(tokens) {
		for (var i = 0; i < tokens.length; i++) {
			let token = tokens[i];
			if (token.token === "name" && i+1 < tokens.length && tokens[i+1].token === "group") {			
				// we have a name that is followed by a group - this is a funciton call pattern!
				let arg_tokens = tokens[i+1].data;
				let args = [];
				if (arg_tokens.length == 0) {	// nullary function call - do nothing
				} else if (arg_tokens.length == 1) {	// unary function
					let arg = arg_tokens[0];
					if (arg.token !== "name") {	// argument must be a name.
						return "Expected name, but found "+arg.text+".";
					}
					args.push(arg.data);				
				} else {	// more arguments - read the whole list
					let j = 0;
					do {
						let arg = arg_tokens[j];
						if (arg.token !== "name") {	// argument must be a name.
							return "Expected name, but found "+arg.text+".";
						}
						let variable = this._variableFromName(arg.data);
						if (variable === undefined) {
							return "Unknown argument '"+arg.data+"'. Only variables allowed as arguments.";
						}
						args.push(arg.data);
						j += 1;
						if (j < arg_tokens.length) {	// if we are not at the end, expect a comma
							if (arg_tokens[j].token !== "comma") {
								return "Expected ',', but found "+arg_tokens[j].text+".";
							} else { 
								j += 1;
								if (j == arg_tokens.length) {
									return "Unexpected ',' at the end of an argument list.";
								}
							}
						}
					} while (j < arg_tokens.length);
				}	
				token.token = "call";
				token.args = args;
				tokens.splice(i+1, 1);	// remove the group - i will now point to first token after group			
			} else if (token.token === "group") { // recursively process group
				let result = this._process_function_calls(token.data);
				if (typeof result === "string") { return result; }
			}
		}
		return tokens;
	},

}

/// Given a token list and a result set, output all names in the form { name: "...", cardinality: x }
/// that occur in the function.
function _extract_names_with_cardinalities(tokens, names) {
	for (var i = 0; i < tokens.length; i++) {
		let token = tokens[i];
		if (token.token === "name") {
			names.add({ name: token.data, cardinality: 0 });
		}
		if (token.token === "call") {
			names.add({ name: token.data, cardinality: token.args.length });
			for (var j = 0; j < token.args.length; j++) {	// args are also names in the function
				names.add({ name: token.args[j], cardinality: 0 });
			}
		}
		if (token.token === "group") {
			_extract_names_with_cardinalities(token.data, names);
		}
	}
}

/// Turn the given update function into an array of tokens,
/// or an error string if tokenization fails. 
function _tokenize_update_function(str) {
	let result = _tokenize_update_function_recursive(str, 0, true);
	if (result.error !== undefined) {
		return result.error;
	} else {
		return result.data;
	}
}

/// A helper function for _tokenize_update_function
/// It also returns a continue index for recursive parsing of parenthesis.
/// In the recursive calls, the outer call always consumes the opening parenthesis
/// and the recursive call consumes the closing parenthesis.
function _tokenize_update_function_recursive(str, i, top) {
	let result = [];
	while (i < str.length) {
		let c = str[i];
		i += 1;	// move to next char immediately...
		if (/\s/.test(c)) { continue; }
		else if (c == '!') { result.push({ token: "not", text: "!" }); }
		else if (c == ',') { result.push({ token: "comma", text: "," }); }
		else if (c == '&') { result.push({ token: "and", text: "&" }); }
        else if (c == '|') { result.push({ token: "or", text: "|" }); }
        else if (c == '^') { result.push({ token: "xor", text: "^" }); }
        else if (c == '=') { 
        	if (i < str.length && str[i] == '>') {
        		i += 1;
        		result.push({ token: "imp", text: "=>" });
        	} else {
        		return { error: "Expected '=>' after '='." };
        	}        	
        }
        else if (c == '<') {
        	if (i+1 < str.length && str[i] == '=' && str[i+1] =='>') {
        		i += 2;
        		result.push({ token: "iff", text: "<=>" });
        	} else {
        		return { error: "Expected '<=>' after '<'." };
        	}
        }
        // '>' is invalid as a start of a token
        else if (c == '>') {
        	return { error: "Unexpected '>'." };
        }
        else if (c == ')') {
        	if (!top) {
        		return { data: result, continue_at: i };
        	} else {
        		return { error: "Unexpected ')'." };
        	}
        }
        else if (c == '(') {
        	let nested = _tokenize_update_function_recursive(str, i, false);
        	if (nested.error === undefined) {
        		i = nested.continue_at;
        		result.push({ token: "group", data: nested.data, text: "(...)" });
        	} else {
        		return { error: nested.error };
        	}
        }
        else if (/[a-z0-9{}_]+/i.test(c)) {
        	// start of a name
        	let name = c;
        	while (i < str.length) {
        		if (!/[a-z0-9{}_]+/.test(str[i])) { break; } else {
        			name += str[i];
        			i += 1;
        		}
        	}
        	if (name == "true") {
        		result.push({ token: "true", text: name });
        	} else if (name == "false") {
        		result.push({ token: "false", text: "false" });
        	} else {
        		result.push({ token: "name", data: name, text: name });
        	}        	
        }
        else { return { error: "Unexpected '"+c+"'." }; }        
	}
	if (top) {
		if (i < str.length) {	// this should not happen, but just in case...
			return { error: "Unexpected '"+str[i]+"'." }
		} else {				// strictly speaking, continue_at is useless here, but whatever
			return { data: result, continue_at: i };
		}		
	} else {
		// if not top level, we always return from the while loop.
		return { error: "Expected ')'." };
	}
	return { data: result };
}