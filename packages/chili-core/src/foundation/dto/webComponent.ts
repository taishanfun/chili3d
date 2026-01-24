// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { EntityDTO, PatchEnvelope } from "./node";

export type WebComponentViewMode = "view" | "edit";

export interface ChiliWebComponentProps {
    data: EntityDTO | EntityDTO[];

    viewMode: WebComponentViewMode;

    selectedIds: string[];
}

export interface ChiliWebComponentEvents {
    "selection-change": CustomEvent<string[]>;

    "node-change": CustomEvent<PatchEnvelope>;

    "command-execute": CustomEvent<{ command: string; args: any }>;
}

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
