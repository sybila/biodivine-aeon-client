#[macro_use]
extern crate json;

extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use biodivine_lib_param_bn::{BooleanNetwork, Monotonicity};
use std::convert::TryFrom;
use json::JsonValue;

#[wasm_bindgen]
pub fn read_aeon_model(model_str: String) -> String {
    let model = BooleanNetwork::try_from(model_str.as_str());
    let value = match model {
        Ok(network) => {
            let graph = network.as_graph();
            let variables = graph
                .variables()
                .map(|id| object! {
                    "id": usize::from(id).to_string(),
                    "name": graph.get_variable_name(id).clone(),
                })
                .collect::<Vec<_>>();
            let regulations = graph
                .regulations()
                .map(|r| object! {
                    "regulator": usize::from(r.get_regulator()).to_string(),
                    "target": usize::from(r.get_target()).to_string(),
                    "observable": r.is_observable(),
                    "monotonicity": r.get_monotonicity().map(|m| monotonicity_to_json(m)),
                })
                .collect::<Vec<_>>();
            object! {
                "result": object! {
                    "variables": variables,
                    "regulations": regulations,
                    "metadata": extract_metadata(model_str.as_str()),
                }
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

fn monotonicity_to_json(m: Monotonicity) -> JsonValue {
    match m {
        Monotonicity::Activation => "activation".into(),
        Monotonicity::Inhibition => "inhibition".into(),
    }
}

fn extract_metadata(model: &str) -> JsonValue {
    let mut metadata = JsonValue::new_object();
    model.lines().map(|l| l.trim()).for_each(|line| {
        if line.starts_with('#') {
            let segments = line[1..].split(':').collect::<Vec<_>>();
            apply_metadata(&mut metadata, &segments);
        }
    });

    metadata
}

fn apply_metadata(metadata: &mut JsonValue, data: &[&str]) {
    if data.len() < 2 {
        return
    } else if data.len() == 2 {
        metadata.insert(data[0], data[1]).unwrap();
    } else {
        if metadata.has_key(data[0]) {
            apply_metadata(&mut metadata[data[0]], &data[1..]);
        } else {
            let mut value = JsonValue::new_object();
            apply_metadata(&mut value, &data[1..]);
            metadata.insert(data[0], value).unwrap();
        }
    }
}