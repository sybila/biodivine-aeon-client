let ComputeEngine = {

	_address: "http://localhost:8000",
	_connected: false,
	_pingRepeatToken: undefined,

	openConnection() {
		this.ping(false);
	},

	closeConnection() {
		if (this._pingRepeatToken !== undefined) {
			clearTimeout(this._pingRepeatToken);
			this._pingRepeatToken = undefined;
			return true;
		} else {
			return false;
		}		
	},

	isConnected() {
		return this._connected;
	},

	validateUpdateFunction(modelFragment, callback) {
		if (this.isConnected()) {
			return this._backendRequest("/check_update_function", callback, "POST", modelFragment);
		} else {
			callback("Compute engine not connected.");
			return undefined;
		}
	},

	ping(keepAlive = false, interval = 2000) {
		console.log("...ping...");
		// if this is a keepAlive ping, cancel any previous pings...
		if (keepAlive && this._pingRepeatToken !== undefined) {
			clearTimeout(this._pingRepeatToken);
			this._pingRepeatToken = undefined;
		}		
		this._backendRequest("/ping", (error, response) => {
			this._connected = error === undefined;
			// Schedule a ping for later if requested.
			if (keepAlive && error === undefined) {
				this._pingRepeatToken = setTimeout(() => { this.ping(true); }, interval);
			}
		});
	},

	// Build and return an asynchronous request with given parameters.
	_backendRequest(url, callback = undefined, method = 'GET', postData = undefined) {
        var req = new XMLHttpRequest();

        req.onload = function() {
        	console.log(req.response);
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
        	console.log("error");
        	if (callback !== undefined) {
				callback("error", undefined);
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