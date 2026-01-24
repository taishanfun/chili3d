// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Precision } from "../foundation/precision";
export class PlaneAngle {
    plane;
    lastX = 1;
    lastY = 0;
    isNegativeRotation = false;
    currentAngle = 0;
    get angle() {
        return this.currentAngle;
    }
    constructor(plane) {
        this.plane = plane;
    }
    movePoint(point) {
        const vectorToPoint = point.sub(this.plane.origin);
        const projectionX = vectorToPoint.dot(this.plane.xvec);
        const projectionY = vectorToPoint.dot(this.plane.yvec);
        if (this.isCrossingPositiveXAxis(projectionX, projectionY)) {
            this.isNegativeRotation = !this.isNegativeRotation;
        }
        this.currentAngle = this.calculateAngle(vectorToPoint);
        this.updateLastProjections(projectionX, projectionY);
    }
    calculateAngle(vector) {
        const angleInRadians = this.plane.xvec.angleOnPlaneTo(vector, this.plane.normal);
        const angleInDegrees = (angleInRadians * 180) / Math.PI;
        return this.isNegativeRotation ? angleInDegrees - 360 : angleInDegrees;
    }
    isCrossingPositiveXAxis(x, y) {
        const isMovingUpward = this.lastY < -Precision.Distance && y > Precision.Distance;
        const isMovingDownward = this.lastY > -Precision.Distance && y < -Precision.Distance;
        const isCrossingX =
            (isMovingUpward && this.currentAngle < Precision.Angle) ||
            (isMovingDownward && this.currentAngle > -Precision.Angle);
        return isCrossingX && this.lastX > 0 && x > 0;
    }
    updateLastProjections(x, y) {
        if (Math.abs(x) > Precision.Distance) this.lastX = x;
        if (Math.abs(y) > Precision.Distance) this.lastY = y;
    }
}
