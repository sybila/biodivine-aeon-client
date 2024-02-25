
// This JavaScript module imports the native features that are implemented
// in `aeon-wasm` and injects them into the global (non-module) API used
// by the rest of the GUI. Until wasm is loaded, these features do not work,
// hence we display the loading indicator in the meantime. 

// The reason why only this file is a module and the other are not is historical:
// we need modules to use WASM, but the original AEON code does not support modules.
// Hence, since we don't want to rewrite the GUI completely, we are instead using
// this "patch" to inject the WASM features into the old code.

import init, { sbml_to_aeon, aeon_to_sbml, aeon_to_sbml_instantiated, aeon_to_bnet, bnet_to_aeon } from "../aeon-wasm/pkg/aeon_wasm.js";

UI.isLoading(true);
init().then(() => {
    // Methods that provide conversions between `.aeon` and `.sbml/.bnet`.
    ComputeEngine.sbmlToAeon = function(sbmlString, callback) {
        try {
            const aeon = sbml_to_aeon(sbmlString);            
            callback(undefined, { 'model': aeon });
        } catch (e) {
            callback(e, undefined);
        }
    }
    ComputeEngine.aeonToSbml = function(aeonString, callback) {
        try {
            const sbml = aeon_to_sbml(aeonString);            
            callback(undefined, { 'model': sbml });
        } catch (e) {
            callback(e, undefined);
        }
    }
    ComputeEngine.aeonToSbmlInstantiated = function(aeonString, callback) {
        try {
            const sbml = aeon_to_sbml_instantiated(aeonString);            
            callback(undefined, { 'model': sbml });
        } catch (e) {
            callback(e, undefined);
        }
    }
    ComputeEngine.aeonToBnet = function(aeonString, callback) {
        try {
            const bnet = aeon_to_bnet(aeonString);            
            callback(undefined, { 'model': bnet });
        } catch (e) {
            callback(e, undefined);
        }
    }
    ComputeEngine.bnetToAeon = function(bnetString, callback) {
        try {
            const bnet = bnet_to_aeon(bnetString);            
            callback(undefined, { 'model': bnet });
        } catch (e) {
            callback(e, undefined);
        }
    }
    UI.isLoading(false);
});