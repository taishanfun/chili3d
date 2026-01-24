// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class SnapStep {
    tip;
    handleStepData;
    keepSelected;
    cursor = "draw";
    constructor(tip, handleStepData, keepSelected = false) {
        this.tip = tip;
        this.handleStepData = handleStepData;
        this.keepSelected = keepSelected;
    }
    async execute(document, controller) {
        if (!this.keepSelected) {
            document.selection.clearSelection();
            document.visual.highlighter.clear();
        }
        const data = this.handleStepData();
        this.setValidator(data);
        const executorHandler = this.getEventHandler(document, controller, data);
        await document.selection.pickAsync(executorHandler, this.tip, controller, false, this.cursor);
        const snaped = executorHandler.snaped;
        executorHandler.dispose();
        return controller.result?.status === "success" ? snaped : undefined;
    }
    setValidator(data) {
        const oldValidator = data.validator;
        data.validator = (point) => {
            if (oldValidator) {
                return oldValidator(point) && this.validator(data, point);
            }
            return this.validator(data, point);
        };
    }
}
