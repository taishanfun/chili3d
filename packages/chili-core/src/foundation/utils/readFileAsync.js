// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Result } from "..";
const isIOS =
    /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ||
    (navigator.maxTouchPoints > 0 && /(Macintosh)/.test(navigator.userAgent));
export async function readFilesAsync(accept, multiple) {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = multiple;
        if (!isIOS) {
            input.accept = accept;
        }
        input.style.visibility = "hidden";
        const cleanup = () => document.body.removeChild(input);
        input.onchange = () => {
            cleanup();
            resolve(input.files ? Result.ok(input.files) : Result.err("no files selected"));
        };
        input.oncancel = () => {
            cleanup();
            resolve(Result.err("cancel"));
        };
        document.body.appendChild(input);
        input.click();
    });
}
export async function readFileAsync(accept, multiple, method = "readAsText") {
    const filesResult = await readFilesAsync(accept, multiple);
    return filesResult.isOk ? readInputedFiles(filesResult.value, method) : filesResult.parse();
}
async function readInputedFiles(files, method) {
    const fileDataPromises = Array.from(files).map(async (file) => {
        const data = await readFileDataAsync(file, method);
        if (!data) {
            throw new Error(`Error occurred reading file: ${file.name}`);
        }
        return { fileName: file.name, data };
    });
    try {
        const result = await Promise.all(fileDataPromises);
        return Result.ok(result);
    } catch (error) {
        return Result.err(error.message);
    }
}
function readFileDataAsync(file, method) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.readyState === FileReader.DONE) {
                resolve(e.target.result);
            }
        };
        reader.onerror = () => resolve(null);
        reader[method](file);
    });
}
