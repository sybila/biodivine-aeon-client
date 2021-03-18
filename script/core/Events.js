
let Events = {

	_event_listeners: {},

	// Registers a new event listener with the specified name string and callback function.
	// The function returns the registered callback so the caller can save it and remove it
	// later.
	addListener(name, callback) {
		if (typeof name !== "string") {
			throw `Events.addEventListener: Invalid name. Expected string, got ${name}.`;
		}
		if (typeof callback !== "function") {
			throw `Events.addEventListener: Invalid callback. Expected function, got ${callback}.`;
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
	removeListener(name, callback) {
		if (typeof name !== "string") {
			throw `Events.removeEventListener: Invalid name. Expected string, got ${name}.`;
		}
		if (typeof callback !== "function") {
			throw `Events.removeEventListener: Invalid callback. Expected function, got ${callback}.`;
		}
		if (this._event_listeners[name] === undefined) {
			throw `Events.removeEventListener: No callback registered for event ${name}.`;
		}
		let removed = _.remove(this._event_listeners[name], (v) => v === callback);
		if (removed.length == 0) {
			throw `Events.removeEventListener: Removing a callback to event ${name} that was not registered.`;
		}
		return removed[0];
	},

	emit(name, payload) {
		let listeners = this._event_listeners[name];
		if (listeners !== undefined) {
			for (listener of listeners) {
				listener(payload);
			}
		} else if (Config.DEBUG_MODE) {
			console.log("Unhandled event:", name, payload);
		}
	},

}