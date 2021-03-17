
function _get_bridge_implementation() {
	if (Config.APP_MODE) {
		return _NativeBridge;
	} else {
		return _HttpBridge;
	}
}

let Bridge = {

	_event_listeners: {},
	_bridge: _get_bridge_implementation(),

	__init__() {
		this._bridge.setEventListener(function (name, data) {
			Bridge.__dispatch_event(name, data);
		})
	},

	__dispatch_event(name, data) {
		let listeners = this._event_listeners[name];
		if (listeners !== undefined) {
			for (listener of listeners) {
				listener(data);
			}
		} else if (Config.DEBUG_MODE) {
			console.log("Unhandled event: ", name, data);
		}
	},

	__handle_response(callback, response) {
		if (callback === undefined) {
			return;
		}
		
		let value = undefined;
		try {
			value = JSON.parse(response);
		} catch (error) {
			callback({ error: [ { "text": "Invalid response: "+error }] });
			return;
		}

		callback(value);
	},

	// Registers a new event listener with the specified name string and callback function.
	// The function returns the registered callback so the caller can save it and remove it
	// later.
	addEventListener(name, callback) {
		if (typeof name !== "string") {
			throw `Bridge.addEventListener: Invalid name. Expected string, got ${name}.`;
		}
		if (typeof callback !== "function") {
			throw `Bridge.addEventListener: Invalid callback. Expected function, got ${callback}.`;
		}
		if (this._event_listeners[name] === undefined) {
			this._event_listeners[name] = [callback];			
		} else {
			this._event_listeners[name].push(callback);
		}
		return callback;
	},

	// Un-register an event listener which was previously registered using `addEventListener`.
	//
	// Returns the removed callback.
	removeEventListener(name, callback) {
		if (typeof name !== "string") {
			throw `Bridge.removeEventListener: Invalid name. Expected string, got ${name}.`;
		}
		if (typeof callback !== "function") {
			throw `Bridge.removeEventListener: Invalid callback. Expected function, got ${callback}.`;
		}
		if (this._event_listeners[name] === undefined) {
			throw `Bridge.removeEventListener: No callback registered for event ${name}.`;
		}
		let removed = _.remove(this._event_listeners[name], (v) => v === callback);
		if (removed.length == 0) {
			throw `Bridge.removeEventListener: Removing a callback to event ${name} that was not registered.`;
		}
		return removed[0];
	},

	// Send a get request that will be handled by the backend.
	//
	// The callback will receive a JSON response as described in README.
	getRequest(path, arguments, callback) {
		if (typeof path !== "string") {
			throw `Brdige.getRequest: Invalid path. Expected string, got ${path}.`;
		}
		if (typeof arguments !== "object" && typeof arguments !== "undefined") {
			throw `Brdige.getRequest: Invalid arguments. Expected optional object, got ${arguments}.`;	
		}
		if (typeof callback !== "function") {
			throw `Brdige.getRequest: Invalid callback. Expected function, got ${callback}.`;
		}
		this._bridge.makeRequest('GET', path, arguments, undefined, (response) => {
			this.__handle_response(response);
		});
	},

	// The same as `getRequest`, but contains an optional body string and if the request
	// is done over HTTP, it will be a post request.
	postRequest(path, arguments, body, callback) {
		if (typeof path !== "string") {
			throw `Brdige.postRequest: Invalid path. Expected string, got ${path}.`;
		}
		if (typeof arguments !== "object" && typeof arguments !== "undefined") {
			throw `Brdige.postRequest: Invalid arguments. Expected optional object, got ${arguments}.`;	
		}
		if (typeof arguments !== "string" && typeof arguments !== "undefined") {
			throw `Brdige.postRequest: Invalid body. Expected optional string, got ${arguments}.`;
		}
		if (typeof callback !== "function") {
			throw `Brdige.postRequest: Invalid callback. Expected function, got ${callback}.`;
		}
		this._bridge.makeRequest('POST', path, arguments, body, (response) => {
			this.__handle_response(response);
		});
	},


}

Bridge.__init__();