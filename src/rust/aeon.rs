use web_view::*;

const INDEX: &str = include_str!("../../dist/editor.bundle.html");

use warp::Filter;

fn main() {
    std::thread::spawn(|| {
        web_server();
    });

    println!("Starting GUI");

    web_view::builder()
        .title("Aeon 2020")
        .content(Content::Url("http://localhost:3030/editor.html"))
        .size(1200, 800)
        .resizable(true)
        .debug(true)
        .user_data(())
        .invoke_handler(|web_view, arg| Ok(()))
        .run()
        .unwrap();

    println!("GUI closed.");
}

#[tokio::main]
async fn web_server() {
    println!("Started web server.");

    warp::serve(warp::fs::dir("dist"))
        .run(([127, 0, 0, 1], 3030))
        .await;

    println!("Web server closed.");
}