// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { IDisposable } from "./disposable";
export var Deletable;
(function (Deletable) {
    function isDeletable(value) {
        return typeof value?.delete === "function" && value.delete.length === 0;
    }
    Deletable.isDeletable = isDeletable;
})(Deletable || (Deletable = {}));
export const gc = (action) => {
    const resources = new Set();
    const collectResource = (resource) => {
        resources.add(resource);
        return resource;
    };
    try {
        return action(collectResource);
    } finally {
        for (const resource of resources) {
            if (Deletable.isDeletable(resource)) {
                resource.delete();
            } else if (IDisposable.isDisposable(resource)) {
                resource.dispose();
            }
        }
        resources.clear();
    }
};
