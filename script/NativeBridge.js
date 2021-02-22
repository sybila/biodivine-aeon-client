
console.log = console.info = console.error = function(str) {
    external.invoke(JSON.stringify({ "path": "log", "message": str, "requestId": 0 }));
}

/*
    The purpose of NativeBridge is to serve in place of a network connection to handle backend requests.

    Originally, these would be handled by the compute-engine binary, but in the 'edition' release, both
    compute engine and client are bundled into the same binary.

    Native bridge
*/
let NativeBridge = {

    // Used by NativeBridge to identify individual request-response pairs
    _requestId: 0,
    // A dictionary of pending requests, indexed by the requestId.
    _pending_request: {},

    // Internal method for incrementing of the request counter.
    nextRequestId() {
        this._requestId += 1;
        return this._requestId;
    },

    // Create a new request with the provided callback. The callback has two arguments: error and result.
    // In case of a successful request, error is undefined, otherwise it contains a message with explanation.
    //
    // The data argument is an object that will be serialized into json and must contain at the very least
    // a "path" that represents the endpoint which would be normally called.
    makeRequest(data, callback = undefined) {
        let id = this.nextRequestId();
        data['requestId'] = id;
        this._pending_request[id] = callback;
        try {
            external.invoke(JSON.stringify(data));
        } catch (err) {
            console.log(err);
            alert("Native bridge error: "+err);
        }
    },

    // This is a method that will be called by the native AEON process to pass data after request has been processed.
    // The data has to be a valid JSON string which contains the requestId provided in the original
    handleResponse(data) {
        try {
            if('requestId' in data) {
                let callback = this._pending_request[data['requestId']];
                if(callback !== undefined) {
                    if (data.status) {
                        callback(undefined, data.result);
                    } else {	// server returned an error
                        callback(data.message, undefined);
                    }
                }
            } else {
                alert('Invalid native response: '+JSON.stringify(data));
            }
        } catch (err) {
            alert(err);
        }
    },

}