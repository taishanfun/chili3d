import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootPackagePath = path.resolve(currentDir, "..", "package.json");
const rootPackage = JSON.parse(readFileSync(rootPackagePath, "utf-8"));

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    define: {
        __APP_VERSION__: JSON.stringify(rootPackage.version),
        __DOCUMENT_VERSION__: JSON.stringify(rootPackage.documentVersion),
    },
});
