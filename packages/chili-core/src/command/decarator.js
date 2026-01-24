// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
const commandRegistry = new Map();
export function command(metadata) {
    return (constructor) => {
        commandRegistry.set(metadata.key, constructor);
        constructor.prototype.data = metadata;
    };
}
export var Command;
(function (Command) {
    function getData(target) {
        if (typeof target === "string") {
            const constructor = commandRegistry.get(target);
            return constructor?.prototype.data;
        }
        const prototype = typeof target === "function" ? target.prototype : Object.getPrototypeOf(target);
        return prototype.data;
    }
    Command.getData = getData;
    function get(name) {
        return commandRegistry.get(name);
    }
    Command.get = get;
})(Command || (Command = {}));
