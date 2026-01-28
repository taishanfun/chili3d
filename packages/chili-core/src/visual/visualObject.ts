// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { IDisposable } from "../foundation";
import { BoundingBox, Matrix4 } from "../math";
import { GeometryNode, VisualNode } from "../model";

export interface IVisualObject extends IDisposable {
    visible: boolean;
    transform: Matrix4;
    worldTransform(): Matrix4;
    boundingBox(): BoundingBox | undefined;
}

export interface INodeVisual extends IVisualObject {
    get node(): VisualNode;
}

export interface IVisualGeometry extends IVisualObject {
    get geometryNode(): GeometryNode;
}

export namespace IVisualObject {
    export function isGeometry(obj: IVisualObject): obj is IVisualGeometry {
        return (obj as IVisualGeometry).geometryNode !== undefined;
    }
}
