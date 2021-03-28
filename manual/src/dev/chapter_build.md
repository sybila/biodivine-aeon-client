# Building Aeon

Since the main process of the desktop app is running Rust, the "main" build tool for Aeon is `cargo`. Furthermore, we use some additional automation provided by `cargo-make`. If you want to look at the original commands, look into `Makefile.toml` which defines the `cargo make *` commands.

### Installing Build Tools and Dependencies

1. Install [Rust](https://www.rust-lang.org/learn/get-started) (obviously) and [npm](https://www.npmjs.com/) which will handle JavaScript dependencies. For Rust, you should use the install script on the website, because installations from package managers (`apt`, `brew`, etc.) are sometimes incomplete or cannot switch between `stable` and `nightly` compiler (should not be necessary for Aeon, but be prepared). The install should not require admin privilages.

2. Make sure you have `cargo-make` installed: 

   ```bash
   cargo install --force cargo-make
   ```

3. Build the `aeon-wasm` package:

   ```bash
   cargo make aeon-wasm
   ```

   This should automatically install `wasm-pack` the first time you run it, but in case of any probelms, you can also install it manually (`cargo install --force wasm-pack`). Now, it you modify any Rust code, you should re-run `cargo make aeon-wasm` to compile the changes.

   > The binaries for the `aeon-wasm` package are located in `target/aeon-wasm-pkg`, which is included in the `package.json` file together with other JS dependencies. If you want to change the location of `aeon-wasm` or there is some other problem with the package, you can run `npm uninstall aeon-wasm` and then `npm install ./new/path/to/aeon-wasm`. However, this normally should not be necessary. 

4. Install JavaScript dependencies by running:

   ```bash
   npm install
   ```

   > This is necessary only before the first JavaScript build and if you change or update some dependencies in `package.json`.  

Now, the process changes based on what type of Aeon release you want to build.

#### Run Aeon locally as a website

To start a dev server which will run Aeon Online from your machine, run:

```bash
cargo make run-online
```

This will also automatically re-build the `aeon-wasm` module to keep it up-to-date. If everything works well, you should be able to access Aeon Online by visiting `http://localhost:1234` in your browser.

Alternatively, you can also run `npm run start` to only start the development server without rebuilding `aeon-wasm`. Note that any changes to JavaScript/HTML will be reloaded dynamically by the development server, so you don't have to restart the server. Only backend changes need to be re-compiled.

#### Build Aeon as a deployable website

To build a deployable version of Aeon Online, you need to execute

```bash
cargo make build-online
```

Similar to `run-online`, this builds the web assembly module, but instead of starting the development server, it will output all necessary files to `./target/aeon-online` folder. You then simply need to move the contents of this folder to your web server. By default, the bundled files use absolute paths and assume to be placed in the root of your server path (i.e. link to `page.html` becomes `/page.html`). You can change this behaviour by passing `--public-url /server/path` to the `build-online` command.

For example, if I want a version of Aeon that will be running at `/aeon/edition-2020/`, I can do that like this:

```bash
cargo make build-online -- --public-url /aeon/edition-2020/
```

> Note that opening the `.html` files directly will not work, because the use of JavaScript modules requires for them to be served from a web server, not from a local file.

#### Run Aeon locally as a desktop application

To run Aeon as a desktop application on your machine, execute

```bash
cargo make run-native
```

TODO:

#### Build Aeon as a distributable application

TODO





