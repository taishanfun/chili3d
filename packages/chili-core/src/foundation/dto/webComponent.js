// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export const WebComponentMapping = {
    attributes: {
        "view-mode": "viewMode",
    },
    properties: {
        data: "data",
        selectedIds: "selectedIds",
        viewMode: "viewMode",
    },
    events: {
        selectionChange: "selection-change",
        nodeChange: "node-change",
        commandExecute: "command-execute",
    },
};
