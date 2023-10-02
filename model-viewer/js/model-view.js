
/**
 * @param {*} element The HTML element where the model layout should be rendered (a <div> is fine).
 * @param {*} modelString The .aeon string of the model that should be displayed.
 */
function show_model(container, modelString) {    
    CytoscapeEditor.init(container);
    LiveModel.importAeon(modelString);
}