// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class SelectStep {
    snapeType;
    prompt;
    options;
    constructor(snapeType, prompt, options) {
        this.snapeType = snapeType;
        this.prompt = prompt;
        this.options = options;
    }
    async execute(document, controller) {
        const { shapeType, shapeFilter, nodeFilter } = document.selection;
        document.selection.shapeType = this.snapeType;
        document.selection.shapeFilter = this.options?.shapeFilter;
        document.selection.nodeFilter = this.options?.nodeFilter;
        if (!this.options?.keepSelection) {
            document.selection.clearSelection();
            document.visual.highlighter.clear();
        }
        try {
            return await this.select(document, controller);
        } finally {
            document.selection.shapeType = shapeType;
            document.selection.shapeFilter = shapeFilter;
            document.selection.nodeFilter = nodeFilter;
        }
    }
}
export class SelectShapeStep extends SelectStep {
    async select(document, controller) {
        const shapes = await document.selection.pickShape(
            this.prompt,
            controller,
            this.options?.multiple === true,
            this.options?.selectedState,
            this.options?.highlightState,
        );
        if (shapes.length === 0) return undefined;
        return {
            view: document.application.activeView,
            shapes,
            nodes: shapes.map((x) => x.owner.node),
        };
    }
}
export class SelectNodeStep {
    prompt;
    options;
    constructor(prompt, options) {
        this.prompt = prompt;
        this.options = options;
    }
    async execute(document, controller) {
        const { nodeFilter } = document.selection;
        document.selection.nodeFilter = this.options?.filter;
        if (!this.options?.keepSelection) {
            document.selection.clearSelection();
            document.visual.highlighter.clear();
        }
        try {
            const nodes = await document.selection.pickNode(
                this.prompt,
                controller,
                this.options?.multiple === true,
            );
            if (nodes.length === 0) return undefined;
            return {
                view: document.application.activeView,
                shapes: [],
                nodes,
            };
        } finally {
            document.selection.nodeFilter = nodeFilter;
        }
    }
}
export class GetOrSelectNodeStep extends SelectNodeStep {
    execute(document, controller) {
        const selected = document.selection.getSelectedNodes().filter((x) => {
            if (this.options?.filter?.allow) {
                return this.options.filter.allow(x);
            }
            return true;
        });
        if (selected.length > 0) {
            controller.success();
            return Promise.resolve({
                view: document.application.activeView,
                shapes: [],
                nodes: selected,
            });
        }
        return super.execute(document, controller);
    }
}
