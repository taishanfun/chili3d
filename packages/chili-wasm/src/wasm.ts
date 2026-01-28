// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import MainModuleFactory, { MainModule } from "../lib/chili-wasm";
import wasmUrl from "../lib/chili-wasm.wasm?url";

declare global {
    var wasm: MainModule;
    var __CHILI_WASM_URL__: string | undefined;
}

export async function initWasm() {
    // 强制使用全局注入的 URL，彻底避免 Vite 默认的 ?url 逻辑（它在开发态会产生 /@fs/ 路径导致 MIME 错误）
    // @ts-ignore
    const overrideUrl = typeof __CHILI_WASM_URL__ !== "undefined" ? __CHILI_WASM_URL__ : undefined;

    if (!overrideUrl) {
        console.warn(
            "[ChiliWasm] __CHILI_WASM_URL__ is not defined. Falling back to default asset URL (may fail in Vite dev).",
        );
    }

    globalThis.wasm = await MainModuleFactory({
        locateFile: (path: string) => {
            if (path.endsWith(".wasm")) {
                const finalUrl = overrideUrl || wasmUrl;
                console.log("[ChiliWasm] Resolving wasm:", path, "->", finalUrl);
                return finalUrl;
            }
            return path;
        },
    });
    return globalThis.wasm;
}
