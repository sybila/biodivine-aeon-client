import * as aeon from 'aeon-wasm';
import { ModelData } from '../ModelFormats';
import { Result } from '../Native';
const ctx: Worker = self as any;

export type ReadMessage = {
    request: number,
    type: "read",
    format: ".aeon" | ".sbml" | ".bnet",
    model: string,
}

export type WriteMessage = {
    type: "write",
    format: ".aeon" | ".sbml",
    model: ModelData,
}

export type Message = ReadMessage | WriteMessage;

ctx.onmessage = function(event) {
    let message = event.data as Message;
    if (message.type == "read") {
        let modelString = message.model;
        let modelData: Result<ModelData>;
        try {
            if (message.format == ".aeon") {
                modelData = JSON.parse(aeon.read_aeon_model(modelString));
            } else if (message.format == ".sbml") {
                modelData = JSON.parse(aeon.read_sbml_model(modelString));
            } else if (message.format == ".bnet") {
                modelData = JSON.parse(aeon.read_bnet_model(modelString));
            } else {
                modelData = { error: [ { message: `Unsupported file format: ${message.format}` } ]};
            }
        } catch (e) {
            modelData = { error: [{ message: String(e) }]};
        }        
        ctx.postMessage(modelData);
    } else if (message.type == "write") {
        ctx.postMessage({ error: [{ message: "Not supported." }] } as Result<string>);
    }    
}

ctx.postMessage("ready");