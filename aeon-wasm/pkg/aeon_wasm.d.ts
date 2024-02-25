/* tslint:disable */
/* eslint-disable */
/**
* @param {string} aeon_file
* @returns {string | undefined}
*/
export function check_model(aeon_file: string): string | undefined;
/**
* @param {string} sbml_string
* @returns {string}
*/
export function sbml_to_aeon(sbml_string: string): string;
/**
* @param {string} aeon_string
* @returns {string}
*/
export function aeon_to_sbml(aeon_string: string): string;
/**
* @param {string} aeon_string
* @returns {string}
*/
export function aeon_to_sbml_instantiated(aeon_string: string): string;
/**
* @param {string} bnet_string
* @returns {string}
*/
export function bnet_to_aeon(bnet_string: string): string;
/**
* @param {string} aeon_string
* @returns {string}
*/
export function aeon_to_bnet(aeon_string: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly check_model: (a: number, b: number, c: number) => void;
  readonly sbml_to_aeon: (a: number, b: number, c: number) => void;
  readonly aeon_to_sbml: (a: number, b: number, c: number) => void;
  readonly aeon_to_sbml_instantiated: (a: number, b: number, c: number) => void;
  readonly bnet_to_aeon: (a: number, b: number, c: number) => void;
  readonly aeon_to_bnet: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
