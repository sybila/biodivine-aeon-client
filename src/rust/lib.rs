#[macro_use]
extern crate json;

extern crate wasm_bindgen;
use biodivine_lib_param_bn::sbml::Layout;
use biodivine_lib_param_bn::{BooleanNetwork, Monotonicity};
use json::JsonValue;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;


#[wasm_bindgen]
pub fn read_bnet_model(model_str: String) -> String {
    let model = BooleanNetwork::try_from_bnet(model_str.as_str());
    let value = match model {
        Ok(network) => {
            object! {
                "result": network_to_json(&network)
            }
        }
        Err(error) => {
            object! {
                "error": array![
                    object! { "message": error.clone() }
                ]
            }
        }
    };

    value.to_string()
}

#[wasm_bindgen]
pub fn read_aeon_model(model_str: String) -> String {
    let model = BooleanNetwork::try_from(model_str.as_str());
    let value = match model {
        Ok(network) => {
            let mut value = network_to_json(&network);
            let meta_data = extract_metadata(model_str.as_str());
            value["metadata"] = meta_data;
            object! {
                "result": value
            }
        }
        Err(error) => {
            object! {
                "error": array![
                    object! { "message": error.clone() }
                ]
            }
        }
    };

    value.to_string()
}

#[wasm_bindgen]
pub fn read_sbml_model(model_str: String) -> String {
    let mut warnings = Vec::new();
    let result = BooleanNetwork::try_from_sbml_strict(model_str.as_str(), &mut warnings);
    let value = match result {
        Ok((network, layout)) => {
            let mut value = network_to_json(&network);
            let meta_data = layout_to_metadata(&layout);
            value["metadata"] = meta_data;
            let mut result = object! { "result": value };
            if !warnings.is_empty() {
                // If there are some warnings, export them as well.
                let mut errors = JsonValue::new_array();
                for warning in warnings.iter() {
                    errors
                        .push(object! {
                            "message": warning.clone(),
                        })
                        .unwrap();
                }
                result["error"] = errors;
            }
            result
        }
        Err(error) => {
            object! {
                "error": array![
                    object! { "message": error.clone() }
                ]
            }
        }
    };

    value.to_string()
}

fn network_to_json(network: &BooleanNetwork) -> JsonValue {
    let graph = network.as_graph();
    let variables = graph
        .variables()
        .map(|id| {
            object! {
                "id": usize::from(id).to_string(),
                "name": graph.get_variable_name(id).clone(),
            }
        })
        .collect::<Vec<_>>();
    let regulations = graph
        .regulations()
        .map(|r| {
            object! {
                "regulator": usize::from(r.get_regulator()).to_string(),
                "target": usize::from(r.get_target()).to_string(),
                "observable": r.is_observable(),
                "monotonicity": r.get_monotonicity().map(|m| monotonicity_to_json(m)),
            }
        })
        .collect::<Vec<_>>();
    object! {
        "variables": variables,
        "regulations": regulations,
        "metadata": JsonValue::new_object(),
    }
}

fn monotonicity_to_json(m: Monotonicity) -> JsonValue {
    match m {
        Monotonicity::Activation => "activation".into(),
        Monotonicity::Inhibition => "inhibition".into(),
    }
}

fn layout_to_metadata(layout: &Layout) -> JsonValue {
    let mut positions = JsonValue::new_object();
    for (name, position) in layout.iter() {
        positions[name.as_str()] = format!("{},{}", position.0, position.1).into();
    }
    return object! { "position": positions };
}

fn extract_metadata(model: &str) -> JsonValue {
    let mut metadata = JsonValue::new_object();
    model.lines().map(|l| l.trim()).for_each(|line| {
        if line.starts_with('#') {
            let segments = line[1..].splitn(2,':').collect::<Vec<_>>();
            apply_metadata(&mut metadata, &segments);
        }
    });

    metadata
}

fn apply_metadata(metadata: &mut JsonValue, data: &[&str]) {
    if data.len() < 2 {
        return;
    } else if data[0] == "position" {   // Keep splitting:
        let next_level = data[1].splitn(2, ':').collect::<Vec<_>>();
        if metadata.has_key(data[0]) {
            apply_metadata(&mut metadata[data[0]], &next_level);
        } else {
            let mut value = JsonValue::new_object();
            apply_metadata(&mut value, &next_level);
            metadata.insert(data[0], value).unwrap();
        }
    } else {
        metadata.insert(data[0], data[1]).unwrap();
    }
}
