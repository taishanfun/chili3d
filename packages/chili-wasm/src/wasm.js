// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import MainModuleFactory from "../lib/chili-wasm";
export async function initWasm() {
    globalThis.wasm = await MainModuleFactory();
    return globalThis.wasm;
}
