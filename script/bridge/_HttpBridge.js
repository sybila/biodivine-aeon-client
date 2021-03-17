/*
	HTTP Bridge implements basic communication primitives for running requests on a remote
	Aeon server instance. It maintains a connection by repeatedly running a ping request on
	the server address.

	DO NOT USE THIS OBJECT DIRECTLY.

	Use Bridge.js which serves as a high-level wrapper around remote connection.
*/

let _HttpBridge = {

	_event_listener: function (e) { console.log(e); },


	// Set a default callback which is called for every event received by this bridge instance.
	//
	// The callback is a function with two arguments: event name and event data object.
	setEventListener(callback) {
		this._event_listener = callback;
	},

	// Send a new request, the result of which will be returned (as a string) using the
	// provided callback.
	//
	// When the request fails, an appropriate JSON string is returned.
	makeRequest(method, path, arguments, body, callback) {
		// First, build the URL we will be calling.
		let url = Config.SERVER_ADDRESS + path;

		if (arguments !== undefined) {
			let query_string = "";
			for (key of Object.keys(arguments)) {
				query_string += encodeURI(key)+"="+encodeURI(arguments[key])+"&";
			}
			if (query_string.length !== 0) {
				url += "?" + query_string.slice(0, -1);	// Remove last `&`.
			}
		}

		let request = new XMLHttpRequest();		

		request.onload = function() {
			if (Config.DEBUG_MODE) { 
				console.log("Request success: ", url); 
				console.log(request.response);
			}
			callback(request.response);
		}

		request.onerror = function(e) {
			if (Config.DEBUG_MODE) { console.log("Request failed: ", url); }
			callback('{"error": [ { "text": "Request not completed. Connection error." } ]}')
		}

		request.onabort = function() {
			if (Config.DEBUG_MODE) { console.log("Request aborted: ", url); }
			callback('{"error": [ { "text": "Request not completed. Request cancelled." } ]}')
		}

		if (Config.DEBUG_MODE) {
			console.log("Send request: ", url);
		}

		request.open(method, url);

		if (method == "POST" && body !== undefined) {
			request.send(body);
		} else {
			request.send();
		}
	},

}