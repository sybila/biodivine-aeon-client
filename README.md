## Aeon Client

This is a web based user interface for the [Aeon](http://biodivine.fi.muni.cz/aeon) tool. The project contains a static HTML+JS website. To run the GUI locally, you simply need to download the contents of this repository, run `python3 -m http.server 8080` and open `http://localhost:8080` in your favourite browser. To deploy the GUI on your server, proceed as with any other static website (i.e. copy the files to the desired directory and configure the server to make them publicly available).

### AEON WASM

Some of the features are delegated to a WASM library which exports the native AEON features so that we don't have to re-implement them in JavaScript. This funcitonality is in the `aeon-wasm` folder. Currently, our strategy is to have the fully built version of `aeon-wasm` in the repository so that it can be deployed directly. Hence, if you change some of the code in `aeon-wasm/src/`, you need to run `wasm-pack build --target web` in the `aeon-wasm` folder to rebuild the package. The "main" JS project will then automatically see the updated files. However, note that deployments therefore also need to include the `aeon-wasm` folder.