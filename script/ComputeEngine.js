
/*
	Compute engine object maintains connection to the rust backend that will actually
	do the work for us.
*/
let ComputeEngine = {

	_address: "http://localhost:8000",
	_connected: false,
	_pingRepeatToken: undefined,

	// Open connection, taking up to date address from user input.
	// Callback is called upon first ping.
	openConnection(callback = undefined) {
		this._address = document.getElementById("engine-address").value;
		this.ping(true, 2000, callback);		
	},

	// Open or close connection connection, depending on current status.
	toggleConnection(callback = undefined) {
		if (this._connected) {
			this.closeConnection();
		} else {
			this.openConnection(callback);
		}
	},

	// Close current connection - return true if really closed.
	closeConnection() {
		if (this._pingRepeatToken !== undefined) {
			clearTimeout(this._pingRepeatToken);
			this._pingRepeatToken = undefined;
			this._connected = false;
			UI.updateComputeEngineStatus("disconnected");
			return true;
		} else {
			return false;
		}		
	},

	// Return current connection status.
	isConnected() {
		return this._connected;
	},

	// Send a validation request for a model fragment.
	validateUpdateFunction(modelFragment, callback) {
		if (this.isConnected()) {
			return this._backendRequest("/check_update_function", callback, "POST", modelFragment);
		} else {
			callback("Compute engine not connected.");
			return undefined;
		}
	},

	sbmlToAeon(sbmlString, callback) {
		if (!this.isConnected()) {
			callback("Compute engine not connected.");
			return undefined;
		} else {
			return this._backendRequest("/sbml_to_aeon", callback, "POST", sbmlString);
		}
	},

	aeonToSbml(aeonString, callback) {
		if (!this.isConnected()) {
			callback("Compute engine not connected.");
			return undefined;
		} else {
			return this._backendRequest("/aeon_to_sbml", callback, "POST", aeonString);
		}
	},

	aeonToSbmlInstantiated(aeonString, callback) {
		if (!this.isConnected()) {
			callback("Compute engine not connected.");
			return undefined;
		} else {
			return this._backendRequest("/aeon_to_sbml_instantiated", callback, "POST", aeonString);
		}
	},

	// Send a ping request. If interval is set, the ping will be repeated
	// until connection is closed. (Callback is called only once)
	ping(keepAlive = false, interval = 2000, callback = undefined) {
		// if this is a keepAlive ping, cancel any previous pings...
		if (keepAlive && this._pingRepeatToken !== undefined) {
			clearTimeout(this._pingRepeatToken);
			this._pingRepeatToken = undefined;
		}		
		this._backendRequest("/ping", (error, response) => {
			this._connected = error === undefined;
			let status = "disconnected";
			if (this._connected) {
				status = "connected";
			}
			console.log("...ping..."+status+"...");
			UI.updateComputeEngineStatus(status);
			// Schedule a ping for later if requested.
			if (keepAlive && error === undefined) {
				this._pingRepeatToken = setTimeout(() => { this.ping(true, interval); }, interval);
			}
			if (callback !== undefined) {
				callback(error, response);
			}			
		});
	},

	// Build and return an asynchronous request with given parameters.
	_backendRequest(url, callback = undefined, method = 'GET', postData = undefined) {
        var req = new XMLHttpRequest();

        req.onload = function() {
        	if (callback !== undefined) {
        		let response = JSON.parse(req.response);
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

        req.open(method, this._address + url);
    	if (method == "POST" && postData !== undefined) {
    		req.send(postData);
    	} else {
    		req.send();
    	}

    	return req;
    },
}