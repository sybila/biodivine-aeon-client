/*
	This script defines configuration values for other components.
*/

/**
 * Non-configurable constants that are used in Aeon components.
 */
export type ConfigConstants = {
	VERSION: string,
	DOUBLE_CLICK_DELAY: number,	
}

/**
 * A configuration object that stores basic information about the environment 
 * we are running in. The configuration values can be populated using an url
 * argument (for example, `?debug_mode=true` turns on debug mode).
 */
class AeonConfig {
	
	/**
	 * This can be used to toggle extra log output in the console.
	 */
	readonly DEBUG_MODE: boolean;
	
	/**
	 * When true, the frontend is running as a desktop app. This mainly means that
	 * backend is not connected as web assembly, but is part of the GUI process 
	 * and communicates via `external` function.
	 *	
	 * We could try to derive this automatically by looking for global `external` function,
	 * but it seems like some browsers actually define this for some internal functionality,
	 * so it is best to just have this set globally.
	 */
	readonly NATIVE_MODE: boolean;

	/**
	 * Default values for some unmodifiable application-wide constants.
	 */
	readonly CONSTANTS: ConfigConstants;

	constructor() {
		this.CONSTANTS = {
			VERSION: "0.5.0",
			DOUBLE_CLICK_DELAY: 400,
		};
		const urlParams = new URLSearchParams(window.location.search);
		this.DEBUG_MODE = urlParams.get('debug_mode') == "true";
		this.NATIVE_MODE = urlParams.get('native_mode') == "true";
	}

	is_online(): boolean {
		return !this.NATIVE_MODE;
	}

	is_native(): boolean {
		return this.NATIVE_MODE;
	}

}

let config_singleton = new AeonConfig();
Object.freeze(config_singleton);
export default config_singleton;