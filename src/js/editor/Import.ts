import Events, { VariableData, RegulationData } from './EditorEvents';
import * as aeon from 'aeon-wasm';
import Cytoscape from './Cytoscape';

type Error = { message: string, html?: string };
type Result<T> = { result?: T, error?: Error[] };

type ModelData = {
    variables: { id: string, name: string }[],
    regulations: RegulationData[],
    metadata: { [key: string]: any }
}

export let Import: {
    importAeonModel: (model_string: string) => void,
    get_next_variable_id: () => string, // Find next available variable ID.
    // Try to create a new variable with the given properties (filling out the missing values).
    try_create_variable: (id?: string, name?: string, position?: { x: number, y: number }) => void,
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

            for (let regulation of model_data.regulations) {
                Events.model.regulation.create(regulation);
            }
        } 
        if (result.error !== undefined) {
            console.log("Invalid model");
            console.log(result.error);
        }
    },

    get_next_variable_id: function(): string {
        let i = 1;
        while (Cytoscape.variable_data(String(i)) !== undefined) { i += 1; }
        return String(i);
    },

    try_create_variable(id?: string, name?: string, position?: { x: number, y: number }) {
        if (id === undefined) { id = Import.get_next_variable_id(); }
        if (name === undefined) { name = "x_"+id; }
        if (Cytoscape.variable_data(id) !== undefined) {
            console.log("Variable", id, name, "already exists.");
        } else {
            Events.model.variable.create({ id: id, name: name, position: position })
        }        
    },

};

export default Import;