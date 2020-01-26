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
	addVariable: function(position = [0.0,0.0], name = undefined) {
		let id = this._idCounter;
		this._idCounter += 1;
		if (name === undefined) {
			name = "v_"+(id + 1);
		}		
		if (position === undefined) {
			position = [0.0, 0.0];
		}
		this._variables[id] = { name: name, id: id }
		CytoscapeEditor.addNode(id, name, position);
		ModelEditor.addVariable(id, name);
		ModelEditor.updateStats();
		UI.setQuickHelpVisible(false);
		// Just show the number of possible update functions, even though there are always two.
		this._validateUpdateFunction(id);
		this.saveToLocalStorage();
		return id;
	},

	// Remove the given variable from the model.
	removeVariable(id, force = false) {
		let variable = this._variables[id];
		if (variable === undefined) return;	// nothing to remove
		// prompt user to confirm action
		if (force || confirm(Strings.removeNodeCheck(variable['name']))) {
			// First, explicitly remove all regulations that have something to do with us.
			let update_regulations_after_delete = [];
			for (var i = 0; i < this._regulations.length; i++) {
				let reg = this._regulations[i];
				if (reg.regulator == id || reg.target == id) {
					this._removeRegulation(reg);
					update_regulations_after_delete.push(reg.target);
				}
			}
			delete this._variables[id];
			delete this._updateFunctions[id];
			CytoscapeEditor.removeNode(id);
			ModelEditor.removeVariable(id);
			ModelEditor.updateStats();
			if (this.isEmpty()) UI.setQuickHelpVisible(true);
			this.saveToLocalStorage();
			for (let id of update_regulations_after_delete) { 
				// We also have to recompute the update function - the variable just became a parameter...
					if (this._updateFunctions[id] !== undefined) {
						// Set the function - this will mark the variable as parameter in metadata
						this.setUpdateFunction(id, this._updateFunctions[id].functionString);
					}
					// And validate again.
					this._validateUpdateFunction(id);
			}
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
			this.saveToLocalStorage();
			return undefined;
		}		
	},

	// Try to set the update function for given variable. If the function is not valid, return 
	// error string, otherwise return undefined.
	setUpdateFunction(id, functionString) {
		let variable = this._variables[id];
		if (variable === undefined) {
			return "Unknown variable '"+id+"'.";
		}
		let check = this._checkUpdateFunction(id, functionString);
		if (typeof check === "string") {
			error = Strings.invalidUpdateFunction(variable.name) + " " + check;
			return error;
		} else {			
			if (functionString.length == 0) {				
				delete this._updateFunctions[id];
			} else {
				this._updateFunctions[id] = {
					// Replace all whitespace with single spaces since the model can't contain newlines.
					functionString: functionString.replace(/\s+/, " "),
					metadata: check,
				};				
			}
			ModelEditor.updateStats();
			this._validateUpdateFunction(id);
			this.saveToLocalStorage();
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

	// Export current model in Aeon text format, or undefined if model cannot be 
	// exported (no variables).
	exportAeon() {
		let result = "";
		let keys = Object.keys(this._variables);
		if (keys.length == 0) return undefined;
		let name = ModelEditor.getModelName();
		if (name !== undefined) {
			result += "#name:"+name+"\n";			
		}
		let description = ModelEditor.getModelDescription();
		if (description !== undefined) {
			result += "#description:"+description+"\n";
		}
		for (var i = 0; i < keys.length; i++) {
			let id = keys[i];
			let varName = this.getVariableName(id);
			let position = CytoscapeEditor.getNodePosition(id);
			if (position !== undefined) {
				result += "#position:"+varName+":"+position+"\n";
			}
			let fun = this._updateFunctions[id];
			if (fun !== undefined) {
				result += "$"+varName+":"+fun.functionString+"\n";
			}
			let regulations = this.regulationsOf(id);
			for (var j = 0; j < regulations.length; j++) {
				result += this._regulationToString(regulations[j]) + "\n";
			}
		}
		return result;
	},

	// Import model from Aeon file. If the import is successful, return undefined,
	// otherwise return an error string.
	importAeon(modelString) {
		if (!this.isEmpty() && !confirm(Strings.modelWillBeErased)) {
			// If there is some model loaded, let the user know it will be
			// overwritten. If he decides not to do it, just return...
			return undefined;
		}
		let lines = modelString.split("\n");
		// name1 -> name2
		let regulationRegex = /^\s*([a-zA-Z0-9_{}]+)\s*-([>|?])(\??)\s*([a-zA-Z0-9_{}]+)\s*$/;
		// #name:content
		let modelNameRegex = /^\s*#name:(.+)$/;
		// #description:content
		let modelDescriptionRegex = /^\s*#description:(.+)$/;
		// #position:var_name:num1,num2
		let positionRegex = /^\s*#position:([a-zA-Z0-9_{}]+):([+-]?\d+(\.\d+)?),([+-]?\d+(\.\d+)?)\s*$/;
		// $var_name:function_data
		let updateFunctionRegex = /^\s*\$\s*([a-zA-Z0-9_{}]+)\s*:\s*(.+)\s*$/;
		// #...
		let commentRegex = /^\s*#.?$/;

		let modelName = "";
		let modelDescription = "";
		let regulations = [];
		let positions = {};
		let updateFunctions = {};

		// First, parse all lines into intermediate objects:
		for (let line of lines) {
			if (line.trim().length == 0) continue;	// skip whitespace
			let match = line.match(regulationRegex);
			if (match !== null) {
				let monotonicity = EdgeMonotonicity.unspecified;
				if (match[2] == ">") monotonicity = EdgeMonotonicity.activation;
				if (match[2] == "|") monotonicity = EdgeMonotonicity.inhibition;
				regulations.push({
					regulatorName: match[1], targetName: match[4],
					monotonicity: monotonicity, observable: (match[3].length == 0),
				});
				continue;
			}
			match = line.match(modelNameRegex);
			if (match !== null) {
				modelName = match[1];
				continue;
			}
			match = line.match(modelDescriptionRegex);
			if (match !== null) {
				modelDescription += match[1];
				continue;
			}
			match = line.match(positionRegex);
			if (match !== null) {
				// The last group index is four because 3 is the decimal part of group 2.
				positions[match[1]] = [parseFloat(match[2]), parseFloat(match[4])];
				continue;
			}
			match = line.match(updateFunctionRegex);
			if (match !== null) {
				updateFunctions[match[1]] = match[2];
				continue;
			}
			if (line.match(commentRegex) === null) {
				return "Unexpected line in file: "+line;
			}			
		}
		
		/*
		console.log(modelName);
		console.log(modelDescription);
		console.log(regulations);
		console.log(positions);
		console.log(updateFunctions);
		*/

		this.clear();

		// Set model metadata
		ModelEditor.setModelName(modelName);
		ModelEditor.setModelDescription(modelDescription);
		// Add all regulations, creating variables if needed:
		for (let template of regulations) {			
			// Ensure regulator and target exist at requested positions...
			let regulator = this._variableFromName(template.regulatorName);
			if (regulator === undefined) {
				let position = positions[template.regulatorName];
				regulator = this.addVariable(position, template.regulatorName);
			} else {
				regulator = regulator.id;
			}
			let target = this._variableFromName(template.targetName);
			if (target === undefined) {
				let position = positions[template.targetName];				
				target = this.addVariable(position, template.targetName);
			} else {
				target = target.id;
			}
			// Create the actual regulation...
			this.addRegulation(regulator, target, template.observable, template.monotonicity);
		}	
		// Set all update functions
		let keys = Object.keys(updateFunctions);
		for (let key of keys) {
			let variable = this._variableFromName(key);
			if (variable === undefined) {
				variable = this.addVariable(positions[key], key);
			} else {
				variable = variable.id;
			}			
			// We actually have to also set the function in the model because we don't update it
			// from the set method...
			ModelEditor.setUpdateFunction(variable, updateFunctions[key]);			
			let error = this.setUpdateFunction(variable, updateFunctions[key]);
			if (error !== undefined) {
				alert(error);
			}
		}

		CytoscapeEditor.fit();

		return undefined;	// no error
	},

	// Erase the whole model
	clear() {
		let keys = Object.keys(this._variables);
		for (var i = 0; i < keys.length; i++) {
			this.removeVariable(keys[i], true);
		}
		ModelEditor.setModelName("");
		ModelEditor.setModelDescription("");
	},

	// Save the current state of the model to local storage.
	// TODO: This is only triggered when structure of the model changes (variables, regulations),
	// not metadata. Change this so that metadata are also preserved.
	saveToLocalStorage() {
		if (!hasLocalStorage) return;
		try {
			if (!this.isEmpty()) {
				localStorage.setItem('last_model', this.exportAeon());
			}			
		} catch (e) {
			console.log(e);
		}
	},

	loadFromLocalStorage() {
		try {
			let modelString = localStorage.getItem('last_model');
			if (modelString !== undefined && modelString !== null && modelString.length > 0) {
				this.importAeon(modelString);
			}			
		} catch (e) {
			alert("No recent model available. Make sure 'Block third-party cookies and site data' is disabled in your browser.");
			console.log(e);
		}
	},

	// Runs analysis of the update funciton asynchronously on server.
	_validateUpdateFunction(id) {
		let modelFragment = this._updateFunctionModelFragment(id);
		if (modelFragment !== undefined) {
			ComputeEngine.validateUpdateFunction(modelFragment, (error, result) => {
				if (error !== undefined) {
					ModelEditor.setUpdateFunctionStatus(id, "Error: "+error, true);
				} else {
					ModelEditor.setUpdateFunctionStatus(id, "Possible instantiations: "+result.cardinality, false);
				}
			});
		} else {
			ModelEditor.setUpdateFunctionStatus(id, "", false);
		}	
	},

	// Build a partial model that represents the parts necessary to analyze the update
	// function of given variable (and nothing else). This can be then sent to the server
	// to obtain info about the function.
	// If the variable does not have an explicit update function, return undefined.
	_updateFunctionModelFragment(id) {
		let name = this.getVariableName(id);
		let fragment = "";
		let regulations = this.regulationsOf(id);
		let varNames = new Set();
		for (var i = 0; i < regulations.length; i++) {
			if (regulations[i].regulator != id) {	// if not self-loop, save
				varNames.add(this.getVariableName(regulations[i].regulator));
			}			
			fragment += this._regulationToString(regulations[i]) + "\n";
		}
		// If there are no regulations, we technically there are two instantiations - true and false.
		// But the support for this is weird, so we just stop the whole process.
		// TODO: Fix this in backend.
		if (regulations.length == 0) {
			return undefined;
		}
		// Now add fixed update function for every other variable so that 
		// they do not create extra parameters.
		for (let name of varNames) {
			fragment += "$"+name+": false\n";
		}
		let fun = this._updateFunctions[id];
		// If we have a specified update function, put it into model - otherwise, 
		// keep it implicit.
		if (fun !== undefined) {
			fragment += "$"+name+": " + fun.functionString + "\n";		
		}
		return fragment;
	},

	// Output given regulation in string format understandable by our compute engine
	_regulationToString(regulation) {
		let regulatorName = this.getVariableName(regulation.regulator);
		let targetName = this.getVariableName(regulation.target);
		let arrow = "-";
		if (regulation.monotonicity == EdgeMonotonicity.unspecified) arrow += "?";
		if (regulation.monotonicity == EdgeMonotonicity.activation) arrow += ">";
		if (regulation.monotonicity == EdgeMonotonicity.inhibition) arrow += "|";
		if (!regulation.observable) arrow += "?";
		return regulatorName + " " + arrow + " " + targetName;
	},

	// Notify editors that a regulation has been changed.
	_regulationChanged(regulation) {
		ModelEditor.ensureRegulation(regulation);
		CytoscapeEditor.ensureRegulation(regulation);
		this._validateUpdateFunction(regulation.target);
		this.saveToLocalStorage();
	},

	// Remove the given regulation object from the regulations array.
	_removeRegulation(regulation) {
		let index = this._regulations.indexOf(regulation);
		if (index > -1) {			
			this._regulations.splice(index, 1);
			CytoscapeEditor.removeRegulation(regulation.regulator, regulation.target);
			ModelEditor.removeRegulation(regulation.regulator, regulation.target);
			ModelEditor.updateStats();
			this.saveToLocalStorage();
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
        else if (/[a-zA-Z0-9{}_]+/.test(c)) {
        	// start of a name
        	let name = c;
        	while (i < str.length) {
        		if (!/[a-zA-Z0-9{}_]+/.test(str[i])) { break; } else {
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