import UiBus from '../../core/UiEvents';
import Dialogs from '../../core/Dialogs';
import LiveModel from '../LiveModel';
import Formats, { ModelData } from '../../core/ModelFormats';
import { Result } from '../../core/Native';

/**
 * Create a nicer error message that we can show inside an alert dialog.
 */
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

async function importModelFile(format: ".aeon" | ".sbml" | ".bnet"): Promise<void> {
    let file_extension: string = format;
    if (format == ".sbml") { file_extension = ".sbml,.xml"; }
    
    // .bnet is currently experimental, so display a message first.
    if (format == ".bnet") {
        let isOk = await Dialogs.confirm("BoolNet support is currently experimental. You may encounter valid `.bnet` models which cannot be imported. Continue?");
        if (!isOk) { return; }
    }
    
    let model_string = await Dialogs.openFile(file_extension);
    let model = await Formats.readModelString(format, model_string);
    
    // Now perform the actual import
    if (model.result === undefined) {   // Import failed
        return Dialogs.alert(make_error_message(model));        
    }

    if (!LiveModel.isEmpty()) { // If the model is not empty, ask if overwrite.
        let message = "Overwrite current model?";
        if (model.error !== undefined) {
            // If there are warnings, add them to the message.
            message = make_error_message(model) + "\n\n" + message;
        }
        let isOk = await Dialogs.confirm(message);
        if (!isOk) { return; }
    } else if (model.error !== undefined) {
        // Show warnings dialog if there are some, but don't await.
        Dialogs.alert(make_error_message(model))
    }

    await LiveModel.clear();
        
    let layout_applied = false;
    let model_data = model.result;
    let positions = model_data.metadata["position"];
    if (positions === undefined) {
        positions = {}; // No positions set.
    }

    // First, create all variables.
    await Promise.all(model_data.variables.map((variable) => {
        let position = undefined;
        // Try to parse position data from metadata string.
        if (positions[variable.name] !== undefined) {
            let position_data = positions[variable.name].split(",");
            if (position_data.length == 2) {
                let x = parseFloat(position_data[0]);
                let y = parseFloat(position_data[1]);
                if (x === x && y === y) {	// test for NaN
                    layout_applied = true;
                    position = { x: x, y: y };
                }				                        
            }
        }
        return LiveModel.ensureVariable({
            id: variable.id,
            name: variable.name,
            position: position
        })
    }));

    // Then, create all regulations.
    await Promise.all(model_data.regulations.map((regulation) => {
        LiveModel.ensureRegulation({
            source: regulation.source,
            target: regulation.target,
            isObservable: regulation.isObservable,
            monotonicity: regulation.monotonicity
        })
    }));
            
    // TODO: Update model name and description:
    /*if (model_data.metadata["name"] !== undefined) {
        Events.value("model-name", model_data.metadata["name"]);
    }                
    if (model_data.metadata["description"] !== undefined) {
        console.log(String(model_data.metadata["description"]));
        Events.value("model-description", model_data.metadata["description"]);
    }*/

    // TODO: Apply zoom to fit.
    //UiBus.emit("click", "graph-zoom-to-fit");
            
    if (!layout_applied) {
        let applyLayout = await Dialogs.confirm("Model seems to be missing layout data. Do you want to apply an automatic layout now?");
        if (applyLayout) {
            // TODO: Apply layout.
            //UiBus.emit("click", "graph-apply-layout");
        }        
    }
}

/**
 * Register event listeners that will enable model import.
 */
export function enableImport() {
    UiBus.onClick('model-import-aeon', function() {        
        UiBus.load(importModelFile(".aeon"));        
    });

    UiBus.onClick('model-import-sbml', function() {
        UiBus.load(importModelFile(".sbml"));
    });

    UiBus.onClick('model-import-bnet', function() {
        UiBus.load(importModelFile(".bnet"));
    });
}

export default enableImport;