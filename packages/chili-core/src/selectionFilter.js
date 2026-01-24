// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { ShapeNode } from "./model";
export class ShapeNodeFilter {
    shapeFilter;
    constructor(shapeFilter) {
        this.shapeFilter = shapeFilter;
    }
    allow(node) {
        if (node instanceof ShapeNode) {
            if (this.shapeFilter && node.shape.isOk) {
                return this.shapeFilter.allow(node.shape.value);
            }
            return true;
        }
        return false;
    }
}
