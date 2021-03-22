import Events, { VariableData, RegulationData } from './EditorEvents';
import * as aeon from 'aeon-wasm';
import Cytoscape from './Cytoscape';
import Dialogs, { ConfirmDialog } from '../core/Dialogs';

type Error = { message: string, html?: string };
type Result<T> = { result?: T, error?: Error[] };

type ModelData = {
    variables: { id: string, name: string }[],
    regulations: RegulationData[],
    metadata: { [key: string]: any }
}

function make_error_message(result: Result<ModelData>): string {
    if (result.error.length == 1 && result.result === undefined) {
        // Import failed and there is only one error.
        return "Import error: " + result.error[0].message;
    } else {
        // Import failed with multiple errors, or succeeded with some warnings.
        let message = "Import failed: \n";
        if (result.result !== undefined) { 
            message = `Import successful with warnings (${result.error.length}): \n`; 
        };
        for (let error of result.error) {
            if (message.length > 500) {
                // If the message is too long, skip remaining errors to make sure it 
                // looks presentable.
                message += ` ... truncated ... `;
                return message;
            }
            message += ` - ${error.message}\n`;
        }
        
        return message;
    }
}

// Respond to .aeon model import prompts.
Events.onClick("model-import-aeon", function() {
    Dialogs.select_file(".aeon", function(file_content) {
        Import.importAeonModel(file_content);
    });
});

// Respond to .sbml model import prompts.
Events.onClick("model-import-sbml", function() {
    Dialogs.select_file(".sbml,.xml", function(file_content) {
        Import.importSbmlModel(file_content);
    });
});

// Respond to .bnet model import prompts.
Events.onClick("model-import-bnet", function() {
    Dialogs.confirm({ 
        message: "BoolNet support is currently experimental. You may encounter valid `.bnet` models which cannot be imported. Continue?", 
        onPositive: function() {
            Dialogs.select_file(".bnet,.txt", function(file_content) {
                Import.importBnetModel(file_content);
            });
        }
    });    
});

export let Import: {
    importAeonModel: (model_string: string) => void,
    importSbmlModel: (model_string: string) => void,
    importBnetModel: (model_string: string) => void,
    importModel: (model: Result<ModelData>) => void,
    get_next_variable_id: () => string, // Find next available variable ID.
    // Try to create a new variable with the given properties (filling out the missing values).
    try_create_variable: (id?: string, name?: string, position?: { x: number, y: number }) => void,
} = {

    importModel: function(model: Result<ModelData>) {
        if (model.result === undefined) {
            // Import failt
            Dialogs.alert_error(make_error_message(model));
        } else {            
            let loadModel = () => {
                Events.model.clear();
                let model_data = model.result;
                let positions = model_data.metadata["position"];
                if (positions === undefined) {
                    positions = {}; // No positions set.
                }
                for (let variable of model_data.variables) {
                    let position = positions[variable.name];
                    let event: VariableData = {
                        id: variable.id, name: variable.name
                    };
                    if (position !== undefined) {   // Try to parse position data from string.
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

                Cytoscape.viewport_fit();
                // TODO: Prompt to apply auto layout if no position data was detected.
            }

            if (Cytoscape.is_empty()) {
                // No need to ask about overwriting current model.
                loadModel();
                if (model.error !== undefined) {
                    // Show warnings dialog.
                    Dialogs.alert_error(make_error_message(model));
                }
            } else {
                let message = "Overwrite current model?";
                if (model.error !== undefined) {
                    // If there are warnings, add them to the message.
                    message = make_error_message(model) + "\n\n" + message;
                }
                Dialogs.confirm({ message: message, onPositive: loadModel });
            }
        }
    },

    importAeonModel: function(model_string: string) {
        // TODO: Put all of this into a service worker, since it can take a lot of time!        
        let json = JSON.parse(aeon.read_aeon_model(model_string));
        let result = json as Result<ModelData>;
        Import.importModel(result);               
    },

    importSbmlModel: function(model_string: string) {
        // TODO: Put all of this into a service worker, since it can take a lot of time!        
        let json = JSON.parse(aeon.read_sbml_model(model_string));
        let result = json as Result<ModelData>;
        Import.importModel(result);     
    },

    importBnetModel: function(model_string: string) {
        let json = JSON.parse(aeon.read_bnet_model(model_string));
        let result = json as Result<ModelData>;
        Import.importModel(result);
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