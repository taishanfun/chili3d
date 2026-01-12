// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { RibbonTab } from "chili-core";

export const DefaultRibbon: RibbonTab[] = [
    {
        tabName: "ribbon.tab.startup",
        groups: [
            {
                groupName: "ribbon.group.2d",
                modes: ["2d"],
                items: [
                    "create.line",
                    ["create.arc", "create.rect", "create.circle"],
                    ["create.ellipse", "create.bezier", "create.polygon"],
                    ["create.text", "create.mtext", "create.leader"],
                ],
            },
            {
                groupName: "ribbon.group.3d",
                modes: ["3d"],
                items: [
                    "create.line",
                    ["create.arc", "create.rect", "create.circle"],
                    ["create.ellipse", "create.bezier", "create.polygon"],
                    "create.extrude",
                    ["create.loft", "create.sweep", "create.revol"],
                    ["create.box", "create.pyramid", "create.cylinder"],
                    ["create.cone", "create.sphere", "create.thickSolid"],
                ],
            },
            {
                groupName: "ribbon.group.modify",
                modes: ["2d", "3d"],
                items: [
                    "modify.move",
                    ["modify.rotate", "modify.mirror", "modify.array"],
                    ["modify.split", "modify.break", "modify.trim"],
                    ["modify.fillet", "modify.chamfer", "modify.explode"],
                    ["modify.deleteNode", "modify.removeShapes", "modify.removeFeature"],
                    ["modify.brushAdd", "modify.brushRemove", "modify.brushClear"],
                ],
            },
            {
                groupName: "ribbon.group.converter",
                modes: ["3d"],
                items: ["convert.toWire", ["convert.toFace", "convert.toShell", "convert.toSolid"]],
            },
            {
                groupName: "ribbon.group.boolean",
                modes: ["3d"],
                items: [["boolean.common", "boolean.cut", "boolean.join"]],
            },
            {
                groupName: "ribbon.group.workingPlane",
                modes: ["2d", "3d"],
                items: [
                    "workingPlane.toggleDynamic",
                    ["workingPlane.set", "workingPlane.alignToPlane", "workingPlane.fromSection"],
                ],
            },
            {
                groupName: "ribbon.group.tools",
                modes: ["2d", "3d"],
                items: [
                    "convert.curveProjection",
                    ["create.group", "create.insert"],
                    ["create.section", "create.offset", "create.copyShape"],
                ],
            },
            {
                groupName: "ribbon.group.dimension",
                modes: ["2d"],
                items: [["dimension.horizontal", "dimension.vertical", "dimension.aligned"]],
            },
            {
                groupName: "ribbon.group.measure",
                modes: ["2d", "3d"],
                items: [["measure.length", "measure.angle", "measure.select"]],
            },
            {
                groupName: "ribbon.group.act",
                modes: ["2d", "3d"],
                items: ["act.alignCamera"],
            },
            {
                groupName: "ribbon.group.importExport",
                modes: ["2d", "3d"],
                items: ["file.import", "file.export"],
            },
            {
                groupName: "ribbon.group.other",
                modes: ["2d", "3d"],
                items: ["wechat.group"],
            },
        ],
    },
    {
        tabName: "ribbon.tab.draw",
        groups: [
            {
                groupName: "ribbon.group.2d",
                modes: ["2d"],
                items: [
                    "create.line",
                    "create.rect",
                    "create.circle",
                    "create.arc",
                    "create.ellipse",
                    "create.polygon",
                    "create.bezier",
                    "create.text",
                    "create.mtext",
                    "create.leader",
                ],
            },
            {
                groupName: "ribbon.group.3d",
                modes: ["3d"],
                items: [
                    "create.box",
                    "create.pyramid",
                    "create.cylinder",
                    "create.cone",
                    "create.sphere",
                    "create.thickSolid",
                ],
            },
        ],
    },
    {
        tabName: "ribbon.tab.tools",
        groups: [
            {
                groupName: "ribbon.group.modify",
                modes: ["2d", "3d"],
                items: [
                    "modify.break",
                    "modify.trim",
                    "modify.fillet",
                    "modify.chamfer",
                    "modify.removeFeature",
                ],
            },
            {
                groupName: "ribbon.group.tools",
                modes: ["2d", "3d"],
                items: ["create.section", "modify.split", "convert.toWire", "convert.toFace"],
            },
            {
                groupName: "ribbon.group.act",
                modes: ["2d", "3d"],
                items: ["act.alignCamera"],
            },
            {
                groupName: "ribbon.group.other",
                modes: ["2d", "3d"],
                items: ["test.performance"],
            },
        ],
    },
];
