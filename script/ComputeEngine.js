/**
	Compute engine object maintains connection to the rust backend that will actually
	do the work for us.
*/
let ComputeEngine = {

	/** Functions and properties connected to connection of the ComputeEngine. */
	Connection: {
		_connected: false,
		_address: "http://localhost:8000",
		_pingRepeatToken: undefined,

		/** Open or close connection connection, depending on current status. */
		toggleConnection(callback = undefined) {
			if (this._connected) {
				this._closeConnection();
			} else {
				this.openConnection(callback);
			}
		},

		/** Open connection, taking up to date address from user input.
		Callback is called upon first ping. */
		openConnection(callback = undefined, address = undefined) {
			if (address !== undefined && address !== null) {
				this._address = address;
			} else if (document.getElementById("engine-address") != null) {
				this._address = document.getElementById("engine-address").value;
			}
			this._ping(true, 2000, function(error, ping) {
				if (ping !== undefined && ping["version"] != EXPECTED_ENGINE_VERSION) {
					Warning.displayWarning(`Your AEON client version is ${EXPECTED_ENGINE_VERSION}, 
											but your compute engine version is ${ping["version"]}.
											You may encounter compatibility issues. For best experience, please
											download recommended engine binary from the 'Compute Engine' panel.`);
				}
				if (callback !== undefined) {
					callback(error, ping);
				}
			});		
		},

		/** Close current connection - return true if really closed. */
		_closeConnection() {
			if (this._pingRepeatToken !== undefined) {
				clearTimeout(this._pingRepeatToken);
				this._pingRepeatToken = undefined;
				this._connected = false;
				if (typeof UI !== 'undefined') {
					UI.UpdateStatus.updateComputeEngineStatus("disconnected");
				}			
				return true;
			} else {
				return false;
			}		
		},

		/** Updates compute engine status (UI progress bar + computation status).
		 * 	If last computation was control, then creates new data for the UI function, else uses given ping response.*/
		_updateComputationStatus(status, response) {
			if (status == "disconnected") {
				UI.UpdateStatus.updateComputeEngineStatus("disconnected", {});
				return;
			};

			if (ComputeEngine.Computation._computationType == "control") {
				ComputeEngine.Computation.Control.getControlComputationStatus((e, r) => {
					if (e !== undefined) {
						console.log(e);
						Warning.displayWarning("Error: "+e);					
					};

					if (r != undefined) {
						UI.UpdateStatus.updateComputeEngineStatus(status, {type: "control",
																timestamp: r.isRunning == true ? r.elapsed : r.computationStarted + r.elapsed, 
																is_running: r.isRunning, 
																is_cancelled: r.computationCancelled, 
																error: e});
					}
				});
			} else {
				response.type = ComputeEngine.Computation._computationType;
				UI.UpdateStatus.updateComputeEngineStatus(status, response);
			}
		},

		/** Send a ping request. If interval is set, the ping will be repeated
		 until connection is closed. (Callback is called only once) */
		_ping(keepAlive = false, interval = 2000, callback = undefined) {
			// if this is a keepAlive ping, cancel any previous pings...
			if (keepAlive && this._pingRepeatToken !== undefined) {
				clearTimeout(this._pingRepeatToken);
				this._pingRepeatToken = undefined;
			}		
			ComputeEngine._backendRequest("/ping", (error, response) => {
				this._connected = error === undefined;
				let status = "disconnected";
				if (this._connected) {
					status = "connected";
				}
				//console.log("...ping..."+status+"...");
				if (typeof UI !== 'undefined') {
					this._updateComputationStatus(status, response);
				}			
				// Schedule a ping for later if requested.
				if (keepAlive && error === undefined) {
					this._pingRepeatToken = setTimeout(() => { this._ping(true, interval); }, interval);
				}
				
				if (callback !== undefined) {
					callback(error, response);
				}
			});
		},

		getAddress() {
			return this._address;
		},

		/** Return current connection status.*/
		_isConnected() {
			return this._connected;
		},
	},

	/** Functions and properties connected to starting/cancelling computation. */
	Computation: {
		/** Type of the last started computation in the form of string (attractor, control) */
		_computationType: undefined,
		/** A timestamp of last successfully started computation
		 if status returns a different timestamp, we know results are out of date */
		_lastComputation: undefined,
		/** If is true, then computes control, else computes attractor analysis. */
		_computeControl: false,
		//** If true then the computation is running or the results weren´t extracted yet. */
		waitingForResult: false,

		/** Functions used for computation of control. */
		Control: {
			//minRobustness (float) = minimal robustness of the computed perturbations
			_minRobustness: 0.0,
			//maxSize (int) = maximal size of the computed perturbations
			_maxSize: 0,
			//numberResults (int) = limits amount of computed perturbations. By default limited to 1_000_000, because we need to enumerate all results.
			_numberResults: 1000000,

			/** Starts computation of control.
			 *  aeonString (str) = model in the aeon format passed as string,
			 * 		control data are encoded as = #control:VARIABLENAME:CONTROLLABILITY,PHENOTYPESTATUS
			 * 		controlability values are true(controllable), false(not controllable), phenotype values are true(var in phenotype as true),
			 * 		false (var in phenotype as false), null (var not present in phenotype)
			*/
			_startControlComputation(aeonString, callback = undefined) {

				// oscillation (string) = "allowed"/"required"/"forbidden", matches the values used by the underlying control library
				const oscillation =  PhenotypeEditor.getOscillation();

				console.log(this._minRobustness);
				console.log(this._maxSize);
				console.log(this._numberResults);

				ComputeEngine._backendRequest(`/start_control_computation/${oscillation}/${this._minRobustness}/${this._maxSize}/${this._numberResults}`, (error, response) => {
					if (callback !== undefined) {
						callback(error, response);
					}			
				}, "POST", aeonString);
			},

			/** Cancels now running control computation and saves partial results.
			*/
			_cancelControlComputation(callback = undefined) {
				return ComputeEngine._backendRequest("/cancel_control_computation", (error, response) => {
					if (callback !== undefined) {
						callback(error, response);
					}			
				}, "POST");
			},

			/** Returns status of the computation at the moment. Only works if the computation is running or finished.
			 * 
			 * Returns an object with "computationStarted" (int; unix timestamp), "computationCancelled" (bool)
			 * "isRunning" (bool), "elapsed" (int; milliseconds), "version" (string),
			 * */
			getControlComputationStatus(callback = undefined) {		
				ComputeEngine._backendRequest("/get_control_computation_status", (error, response) => {
					if (callback !== undefined) {
						callback(error, response);
					}
				}, "GET");
			},

			/** Sets minimal robustness limit of the control computation. */
			setMinRobustness() {
				const newMinRob = document.getElementById("min-robustness-input").value;
				const convertedRob = parseFloat(newMinRob);

				if (isNaN(convertedRob) || newMinRob < 0) {
					this._minRobustness = 0.0;
				} else if (newMinRob > 100) {
					this._minRobustness = 1;
				} else {
					this._minRobustness = convertedRob / 100;
				}
			},

			/** Sets maximal size limit of the control computation.
			 * 	contrCount (boolean) = if contrCount is true then sets this._maxSize to the number of controllable variables,
			 * 							else sets it ot value from the "max-size-input" input field
			 */
			setMaxSize(contrCount) {
				let newSize = undefined;
				const inputField = document.getElementById("max-size-input");
				const controllableCount = ControllableEditor.getCountValue(true);

				if (contrCount == false) {
					newSize =  parseInt(inputField.value);
				} else {
					newSize = controllableCount;
				}

				if (isNaN(newSize) || newSize < 0) {
					this._maxSize = 0;
				} else if (newSize >= controllableCount) {
					this._maxSize = controllableCount;
				} else {
					this._maxSize = newSize;
				}

				if (contrCount == true) {
					this.updateParameterInputs();
				}
			},

			/** Sets maximal number of results of the control computation. */
			setNumberResults() {
				const newNumResults = document.getElementById("num-results-input").value;
				const convertedNum = parseInt(newNumResults);

				if (isNaN(convertedNum) || convertedNum < 1) {
					this._numberResults = 1000000;
				} else {
					this._numberResults = convertedNum;
				}
			},

			/** Sets values of all parameter inputs in the Start Computation module to current values. */
			updateParameterInputs() {
				document.getElementById("min-robustness-input").value = this._minRobustness * 100;
				document.getElementById("max-size-input").value = this._maxSize;
				document.getElementById("num-results-input").value = this._numberResults;
			},

			/** Resets value of the control computation parameters. (this._minRobustness, this._maxSize, this._numberResults) */
			resetParameters() {
				this._minRobustness = 0.0;
				this._maxSize = 0;
				this._numberResults = 1000000;
				this.updateParameterInputs();
			},
		},

		/** Tests if computation can be started. If not displays warning and returns false, else returns true. */
		_startComputationErrors(aeonString) {
			if (aeonString === undefined) {
				Warning.displayWarning("Empty model.");
				return false;
			}
			if (!ComputeEngine.Connection._isConnected()) {
				Warning.displayWarning("Compute engine not connected.");
				return false;
			}

			if (!Warning.resultsAvailableWarning()) {
				return false;
			}

			if (this._computeControl && PhenotypeEditor.isPhenotypeEmpty()) {
				Warning.displayWarning("Phenotype is empty. Add variables into the phenotype before performing control computation.");
				return false;
			}

			return true;
		},

		startComputation(aeonString) {	
			if (!this._startComputationErrors(aeonString)) {
				return undefined;
			}

			Results.clear();
			var callback = function(e, r) {
					if (e !== undefined) {
						console.log(e);
						ComputeEngine.Computation._computationType = undefined;
						Warning.displayWarning("Computation error: "+e);		
					} else {
						console.log("Started computation ",r.timestamp);
						ComputeEngine.Computation._lastComputation = r.timestamp;
					}

					ComputeEngine.Connection._ping();
			};

			this.waitingForResult = true;
			if (!this._computeControl) {
				this._computationType = "attractor";
				
				return ComputeEngine._backendRequest("/start_computation", (e, r) => {
					callback(e, r);
				}, "POST", aeonString);
			} else {
				this._computationType = "control";
				return this.Control._startControlComputation(aeonString, callback);
			}
		},

		cancelComputation() {
			if (!ComputeEngine.Connection._isConnected()) {
				Warning.displayWarning("Compute engine not connected.");
				return undefined;
			} else {
				const callback = function(e, r) {
					if (e !== undefined) {
						console.log(e);
						Warning.displayWarning("Error: "+e);					
					}

					ComputeEngine.Connection._ping();
				};

				if (this._computationType == "attractor") {
					return ComputeEngine._backendRequest("/cancel_computation", (e, r) =>  {callback(e, r);}, "POST", "");
				}

				return this.Control._cancelControlComputation(callback);
			}
		},

		/** Updates direction of the mode arrow depending on the current computation mode. */
		_updateModeArrow() {
			const modeArrow = document.getElementById("compute-mode-arrow");

			if (this._computeControl == true) {
				modeArrow.style.marginLeft = "10px";
				modeArrow.style.marginRight = "5px";
				modeArrow.classList.remove("left");
				modeArrow.classList.add("right");
			} else {
				modeArrow.style.marginLeft = "5px";
				modeArrow.style.marginRight = "10px";
				modeArrow.classList.remove("right");
				modeArrow.classList.add("left");
			}
		},

		/** Changes computation mode of the engine (changes value of the this._computeControl). */
		toggleComputationMode(computeControl) {
			this._computeControl = computeControl;

			const atractorButton = document.getElementById("button-attractor");
			const controlButton = document.getElementById("button-control");
			const controlSettings = document.getElementById("control-settings");
			
			if (computeControl) {
				atractorButton.style.backgroundColor = "#ECEFF1";
				controlButton.style.backgroundColor = '#B0BEC5';
				controlSettings.style.display = "";
			} else {
				atractorButton.style.backgroundColor = '#B0BEC5';
				controlButton.style.backgroundColor = '#ECEFF1';
				controlSettings.style.display = "none";
			}

			this._updateModeArrow();
		},

		/** Indicate that this is the computation the server currently stores */
		setActiveComputation(timestamp) {
			if (this._lastComputation != timestamp) {
				// if timestamp changed, switch to undefined.
				this._lastComputation = undefined;
			}
		},

		/** Return true if the computation on server is also the one we remember last */
		hasActiveComputation() {
			return this._lastComputation !== undefined;
		},

		/** Sets value of last computation (should be used only for initialization of new browser tab) */
		setLastComputation(timestamp) {
			this._lastComputation = timestamp;
		},

		/** Returns timestamp of last succesfully started computation. */
		getLastComputation() {
			return this._lastComputation;
		},
	},

	/** Functions used in the TreeExplorer and the CytoscapeTreeEditor. */
	AttractorTree: {

		getBifurcationTree(callback, force = false) {
			if (!force && !ComputeEngine.Connection._isConnected()) {
				callback("Compute engine not connected.");
				return undefined;
			} else {
				return ComputeEngine._backendRequest("/get_bifurcation_tree/", (e, r) => {
					if (callback !== undefined) {
						callback(e, r);
					}
				}, "GET");
			}
		},

		autoExpandBifurcationTree(node, depth, callback) {
			return ComputeEngine._backendRequest("/auto_expand/"+node+"/"+depth, (e, r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			}, "POST");
		},

		getDecisionAttributes(node, callback) {
			return ComputeEngine._backendRequest("/get_attributes/"+node, (e, r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			});
		},

		applyTreePrecision(precision, callback) {
			return ComputeEngine._backendRequest("/apply_tree_precision/"+precision, (e,r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			}, "POST");
		},

		getTreePrecision(callback) {
			return ComputeEngine._backendRequest("/get_tree_precision/", (e, r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			}, "GET");
		},

		selectDecisionAttribute(node, attr, callback) {
			return ComputeEngine._backendRequest("/apply_attribute/"+node+"/"+attr, (e, r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			}, "POST");
		},

		deleteDecision(nodeId, callback) {
			return ComputeEngine._backendRequest("/revert_decision/"+nodeId, (e, r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			}, "POST");
		},

		getStabilityData(nodeId, behaviour, callback) {
			return ComputeEngine._backendRequest("/get_stability_data/"+nodeId+"/"+behaviour, (e, r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			}, "GET");
		},
	},

	/** Functions used for conversions of format. All these functions are dynamically replaced with a "native" WASM module once it is loaded.*/
	Format: {
		aeonToSbml(_aeonString, callback) {
			// This function is dynamically replaced with a "native" WASM module once it is loaded.
			// See `patch-wasm.js` for details.
			callback("Compute engine not connected.");
			return undefined;		
		},

		sbmlToAeon(_sbmlString, callback) {
			// This function is dynamically replaced with a "native" WASM module once it is loaded.
			// See `patch-wasm.js` for details.
			callback("Compute engine not connected.");
			return undefined;
		},

		aeonToSbmlInstantiated(_aeonString, callback) {
			// This function is dynamically replaced with a "native" WASM module once it is loaded.
			// See `patch-wasm.js` for details.
			callback("Compute engine not connected.");
			return undefined;		
		},

		bnetToAeon(_bnetString, callback) {
			// This function is dynamically replaced with a "native" WASM module once it is loaded.
			// See `patch-wasm.js` for details.
			callback("Compute engine not connected.");
			return undefined;
		},

		aeonToBnet(_aeonString, callback) {
			// This function is dynamically replaced with a "native" WASM module once it is loaded.
			// See `patch-wasm.js` for details.
			callback("Compute engine not connected.");
			return undefined;		
		},	
	},

	/** Functions for requesting results from the compute engine. */
	Results: {
		/** Returns stats about the computation. Only works if a computation has completed.
		 * 
		 * Returns an object with "allColorsCount" (int), "perturbationCount" (int), "minimalPerturbationSize" (int), 
		 * "maximalPerturbationRobustness" (float), and "elapsed" (int; milliseconds).
		*/
		getControlStats(callback = undefined) {
			ComputeEngine._backendRequest("/get_control_stats", (error, response) => {
				if (callback !== undefined) {
					callback(error, response);
				}			
			}, "GET");
		},

		/** Returns all computed perturbations in iterable form (for example array of dicts, array of arrays, iterator of objects...)
		 * 
		 * The result is an array of objects, such that each object contains a "perturbation" (dictionary of fixed variables),
		 * "color_count" (number of colors for which the perturbation works), and "robustness" (float, 0-1).
		*/
		_getControlResults(callback = undefined) {
			ComputeEngine._backendRequest("/get_control_results", (error, response) => {
				if (callback !== undefined) {
					const data = {stats: undefined, results: undefined};

					this.getControlStats((e, r) => {
						if (e !== undefined) {
							console.log(e);
							Warning.displayWarning("Error: "+e);			
						}

						data.stats = r;
						data.results = response;
						callback(error, ComputeEngine.Computation._computationType, data);
					})
				}			
			}, "GET");
		},

		/** Request results from the compute engine. */
		getResults(callback) {
			if (!ComputeEngine.Connection._isConnected()) {
				callback("Compute engine not connected.");
				return undefined;
			} else {
				if (ComputeEngine.Computation._computationType == "attractor") {
					return ComputeEngine._backendRequest("/get_results", (e, r) => {
						console.log(e, ComputeEngine.Computation._computationType, r);
						if (callback !== undefined) {
							callback(e, ComputeEngine.Computation._computationType, r);
						}
					}, "GET");
				}

				return ComputeEngine.Results._getControlResults(callback);
			}
		},
	},

	/** Build and return an asynchronous request with given parameters. */
	_backendRequest(url, callback = undefined, method = 'GET', postData = undefined) {
        var req = new XMLHttpRequest();

        req.onload = function() {
        	if (callback !== undefined) {
        		let response = undefined;
				
				try {
					response = JSON.parse(req.response);
				} catch (e) {
					response = req.response;
				}
				
        		if (response.status) {
        			callback(undefined, response.result);
        		} else {	// server returned an error
        			callback(response.message, undefined);
        		}
        	}        	
        }

        req.onerror = function(e) {
        	if (callback !== undefined) {
				callback("Connection error", undefined);
        	}
        }

        req.onabort = function() {
        	console.log("abort: ", req);
        }

        req.open(method, this.Connection._address + url);
    	if (method == "POST" && postData !== undefined) {
    		req.send(postData);
    	} else {
    		req.send();
    	}

    	return req;
    },

	/** Send a validation request for a model fragment. */ 
	validateUpdateFunction(modelFragment, callback) {
		if (this.Connection._isConnected()) {
			return this._backendRequest("/check_update_function", callback, "POST", modelFragment);
		} else {
			callback("Compute engine not connected.");
			return undefined;
		}
	},

	// Force requests connection even when ping was not established (for situations
	// where this is the first call).
	getWitness(witness, callback, force = false) {		
		if (!force && !this.Connection._isConnected()) {
			callback("Compute engine not connected.");
			return undefined;
		} else {
			return this._backendRequest("/get_witness/"+witness, (e, r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			}, "GET");
		}
	},

	getTreeWitness(nodeId, callback, force = false) {
		if (!force && !this.Connection._isConnected()) {
			callback("Compute engine not connected.");
			return undefined;
		} else {
			return this._backendRequest("/get_tree_witness/"+nodeId, (e, r) => {
				if (callback !== undefined) {
					callback(e, r);
				}
			}, "GET");	
		}
	},
}