/*
	This script defines configuration values for other components.
*/

export let Config = {

	// Current running version of Aeon. This is used to check for compatibility 
	// with the server and to display version info in the GUI.
	ENGINE_VERSION: "0.0.0-SNAPSHOT",

	// This can be used to toggle extra log output in the console.
	DEBUG_MODE: false,

	// When true, the frontend is running as a desktop app. This mainly means that
	// backend is not connected through HTTP, but is part of the GUI process 
	// and communicates via `external` function.
	//
	// We could try to derive this automatically by looking for global `external` function,
	// but it seems like some browsers actually define this for some internal functionality,
	// so it is best to just have this set globally.
	APP_MODE: false,

	// Applicable when in online mode. Sets the default address of the compute engine server.
	SERVER_ADDRESS: "http://localhost:8000",
}


// Load configuration from the url parameters.
function initConfigFromUrl() {
	const urlParams = new URLSearchParams(window.location.search);
	Config.DEBUG_MODE = urlParams.get('debug_mode') == "true";
	let server = urlParams.get('server_address');
	if (typeof(server) == "string") {
		Config.SERVER_ADDRESS = server;
	}
}

initConfigFromUrl();

export default Config;