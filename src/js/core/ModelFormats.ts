import { Result } from "./Native"
import Config from './Config'
import { ReadMessage } from './worker/ModelFormatsWorker'

export type RegulationData = {
    source: string,
    target: string,
    isObservable: boolean,
    monotonicity: null | "activation" | "inhibition",
}


export type ModelData = {
    variables: { id: string, name: string }[],
    regulations: RegulationData[],
    metadata: { [key: string]: any }
}

/**
 * A module that is responsible for importing and exporting Boolean network
 * models to and from javascript.
 * 
 * Online, it is running using web assembly. On desktop, it uses native calls.
 */
export interface ModelFormats {
    readModelString(format: ".aeon" | ".sbml" | ".bnet", model: string): Promise<Result<ModelData>>
    writeModelString(format: ".aeon" | ".sbml", model: ModelData): Promise<Result<string>>    
}

class WebModelFormats implements ModelFormats {

    readModelString(
        format: ".aeon" | ".sbml" | ".bnet", 
        model: string
    ): Promise<Result<ModelData>> {
        return new Promise((resolve) => {
            let worker = new Worker('./worker/ModelFormatsWorker.ts');            
            worker.onmessage = (event) => {
                if (event.data == "ready") {
                    worker.postMessage({
                        type: "read",
                        format: format,
                        model: model
                    } as ReadMessage);
                    console.log("Message sent");
                } else {
                    resolve(event.data as Result<ModelData>);
                }
            }
        });
    }

    writeModelString(
        format: ".aeon" | ".sbml",
        model: ModelData
    ): Promise<Result<string>> {
        throw new Error("Method not implemented.");
    }

}

class NativeModelFormats implements ModelFormats {
    readModelString(format: ".aeon" | ".sbml" | ".bnet", model: string): Promise<Result<ModelData>> {
        throw new Error("Method not implemented.")
    }
    writeModelString(format: ".aeon" | ".sbml", model: ModelData): Promise<Result<string>> {
        throw new Error("Method not implemented.")
    }
}



function makeFormats(): ModelFormats {
    if (Config.is_native()) {
        return new NativeModelFormats();
    } else {
        return new WebModelFormats();
    }
}

let formats: ModelFormats = makeFormats();

export default formats;