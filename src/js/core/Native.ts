import Config from './Config';

/**
 * An error type that may be returned by a native call.
 */
export type Error = { message: string, html?: string };

/**
 * A result type which is returned by a native call.
 * 
 * Note that result and error are not mutually exclusive. If the result
 * is present, then then error still may be included to indicate some
 * warnings. It is up to the native call to specify the semantics.
 */
export type Result<T> = { result?: T, error?: Error[] };


/**
 * Native bridge is a helper singleton which is responsible for communication with the native interface. 
 * 
 * It allows you to send a request and then handle the response to that request via a `Promise`.
 */
class NativeBridge {

    /**
     * Map where we store the callbacks for requrests which were sent to the
     * native backend but have not been answered yet.
     */
    pendingRequests: { [key: string]: (response: Result<any>) => void, } = {}
    nextId: number = 0

    /**
     * This function is used by the frontend code to send data to backend.
     * @param path A path string that tells the backend where this request is headed.
     * @param data Arbitrary object that will be passed off as JSON.
     * @returns A promise to the response provided by the backend.
     */
    async send<T>(path: string, data: any): Promise<Result<T>> {        
        return new Promise<Result<T>>((resolve: (response: Result<T>) => void) => {            
            let requestId = String(this.nextId);
            this.nextId += 1;
            this.pendingRequests[requestId] = resolve;
            // External is a function provided by the webview library.
            (external as any).invoke(JSON.stringify({
                request_id: requestId,
                path: path,
                data: data,
            }));
        });        
    }

    /**
     * A method that should be called from the backend using `window.native_bridge.response`.
     * @param id Id of the request the backend is responding to.
     * @param response Arbitrary data (most likely JSON-ish).
     */
    respond(id: string, response: Result<any>) {
        let responder = this.pendingRequests[id];
        if (responder) {            
            responder(response);
            delete this.pendingRequests["id"];            
        } else if (Config.DEBUG_MODE) {
            console.log("Unhandled response: ", response);
        }
    }
}

let native_bridge = new NativeBridge();
// Note: we cannot freeze NativeBridge, because it has a mutable internal map.
export default native_bridge;

// Export native bridge as a global window property so that the 
// native backend can access it conveniently.
(window as any).native_bridge = native_bridge;
