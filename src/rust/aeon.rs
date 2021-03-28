use web_view::*;

use native_dialog::MessageDialog;
use json::JsonValue;

fn main() {
    std::thread::spawn(|| {
        web_server();
    });

    println!("Starting GUI");

    web_view::builder()
        .title("Aeon 2020")
        .content(Content::Url("http://localhost:3030/editor.html?native_mode=true"))
        .size(1200, 800)
        .resizable(true)
        .debug(true)
        .user_data(())
        .invoke_handler(|web_view, arg| {
            println!("Message: {}", arg);
            let message = json::parse(arg).unwrap_or_else(|_| {
                MessageDialog::new()
                    .set_title("Aeon Fatal Error")
                    .set_text(&format!("Message is not JSON: {}", arg))
                    .show_alert()
                    .unwrap();
                JsonValue::new_object()
            });

            println!("Message: {}", message);

            if message["path"] == "/core/dialogs/alert" {
                let alert = message["data"].as_str().unwrap();
                MessageDialog::new()
                    .set_title("Aeon")
                    .set_text(alert)
                    .show_alert()
                    .unwrap();
                post_response(web_view, message["request_id"].as_str().unwrap(), true);
            } else if message["path"] == "/code/dialogs/confirm" {
                let confirm = message["data"].as_str().unwrap();
                println!("Confirm! {}", confirm);
                let result = MessageDialog::new()
                    .set_text(confirm)
                    .set_title("Aeon")
                    .show_confirm()
                    .unwrap();
                post_response(web_view, message["request_id"].as_str().unwrap(), result);
            }
            Ok(())
        })
        .run()
        .unwrap();

    println!("GUI closed.");
}

fn post_response<T: Into<JsonValue>, V>(web_view: &mut WebView<V>, request_id: &str, response: T) {
    web_view.eval(&format!("window.native_bridge.respond(\"{}\", {{ result:{} }});", request_id, response.into().to_string())).unwrap();
}

#[tokio::main]
async fn web_server() {
    println!("Started web server.");

    warp::serve(warp::fs::dir("target/aeon-online"))
        .run(([127, 0, 0, 1], 3030))
        .await;

    println!("Web server closed.");
}