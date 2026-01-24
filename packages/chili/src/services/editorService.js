// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Logger, PubSub } from "chili-core";
export class EditorService {
    factory;
    editHandler;
    constructor(factory) {
        this.factory = factory;
    }
    register(_app) {
        Logger.info(`${EditorService.name} registed`);
    }
    start() {
        PubSub.default.sub("selectionChanged", this.handleSelectionChanged);
        Logger.info(`${EditorService.name} started`);
    }
    stop() {
        PubSub.default.remove("selectionChanged", this.handleSelectionChanged);
        Logger.info(`${EditorService.name} stopped`);
    }
    handleSelectionChanged = (document, selected) => {
        this.editHandler?.dispose();
        this.editHandler = undefined;
        if (document.application.executingCommand) return;
        if (selected.length > 0) {
            this.editHandler = this.factory(document, selected);
            document.visual.eventHandler = this.editHandler;
        } else {
            document.visual.resetEventHandler();
        }
    };
}
