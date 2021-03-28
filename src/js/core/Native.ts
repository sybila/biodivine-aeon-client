import Config from './Config';

/**
 * Native request describes a piece of data that will be sent to the
 * native process and can then receive a response back.
 */
type NativeRequest = {
    path: string,
    data: any,
}

class NativeBridge {

    /**
     * Map where we store the callbacks for requrests which were sent to the
     * native backend but have not been answered yet.
     */
    pendingRequests: { [key: string]: (response: any) => void, } = {}
    nextId: number = 0

    /**
     * This function is used by the frontend code to send data to backend.
     * @param path A path string that tells the backend where this request is headed.
     * @param data Arbitrary object that will be passed off as JSON.
     * @returns A promise to the response provided by the backend.
     */
    async send(path: string, data: any): Promise<any> {        
        return new Promise((resolve: (response: any) => void) => {            
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
    response(id: string, response: any) {
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
Object.freeze(native_bridge);
export default native_bridge;

// Export native bridge as a global window property so that the 
// native backend can access it conveniently.
(window as any).native_bridge = native_bridge;
