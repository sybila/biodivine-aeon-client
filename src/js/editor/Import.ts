import Events, { VariableData } from './EditorEvents'
import * as aeon from 'aeon-wasm'

type Error = { message: string, html?: string };
type Result<T> = { result?: T, error?: Error[] };

type ModelData = {
    variables: { id: string, name: string }[],
    regulations: {
        regulator: string,
        target: string,
        observable: boolean,
        monotonicity: string,
    },
    metadata: { [key: string]: any }
}

export let Import: {
    importAeonModel: (model_string: string) => void,
} = {

    importAeonModel: function(model_string: string) {
        // TODO: Make this asynchronous!
        let json = JSON.parse(aeon.read_aeon_model(model_string));
        let result = json as Result<ModelData>;
        if (result.result !== undefined) {
            Events.model.clear();
            let model_data = result.result;
            for (let variable of model_data.variables) {
                let position = model_data.metadata["position"][variable.name];
                let event: VariableData = {
                    id: variable.id, name: variable.name
                };
                if (position !== undefined) {
                    let position_data = position.split(",");
                    if (position_data.length == 2) {
                        let x = parseFloat(position_data[0]);
				        let y = parseFloat(position_data[1]);
				        if (x === x && y === y) {	// test for NaN
                            event.position = { x: x, y: y };
				        }				                        
                    }
                }

                Events.model.variable.create(event);
            }
        } 
        if (result.error !== undefined) {
            console.log("Invalid model");
            console.log(result.error);
        }
    }

};

export default Import;