// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { CollectionAction, PubSub } from "chili-core";
import { Cursor } from "../cursor";
import style from "./layoutViewport.module.css";
import { Viewport } from "./viewport";
export class LayoutViewport extends HTMLElement {
    app;
    showViewControls;
    _viewports = new Map();
    _activeView;
    constructor(app, showViewControls = true) {
        super();
        this.app = app;
        this.showViewControls = showViewControls;
        this.className = style.root;
        app.views.onCollectionChanged(this._handleViewCollectionChanged);
    }
    _handleViewCollectionChanged = (args) => {
        if (args.action === CollectionAction.add) {
            args.items.forEach((view) => {
                this.createViewport(view);
            });
        } else if (args.action === CollectionAction.remove) {
            args.items.forEach((view) => {
                let viewport = this._viewports.get(view);
                viewport?.remove();
                viewport?.dispose();
                this._viewports.delete(view);
            });
        }
    };
    connectedCallback() {
        PubSub.default.sub("activeViewChanged", this._handleActiveViewChanged);
        PubSub.default.sub("viewCursor", this._handleCursor);
    }
    disconnectedCallback() {
        PubSub.default.remove("activeViewChanged", this._handleActiveViewChanged);
        PubSub.default.remove("viewCursor", this._handleCursor);
    }
    _handleCursor = (type) => {
        const viewport = this._activeView ? this._viewports.get(this._activeView) : undefined;
        if (viewport) {
            viewport.style.cursor = Cursor.get(type);
            viewport.setCursorType(type);
            return;
        }
        this.style.cursor = Cursor.get(type);
    };
    createViewport(view) {
        let viewport = new Viewport(view, this.showViewControls);
        viewport.classList.add(style.viewport, style.hidden);
        this.appendChild(viewport);
        this._viewports.set(view, viewport);
        return viewport;
    }
    _handleActiveViewChanged = (view) => {
        this._activeView = view;
        this._viewports.forEach((v) => {
            if (v.view === view) {
                v.classList.remove(style.hidden);
            } else {
                v.classList.add(style.hidden);
            }
        });
    };
}
customElements.define("chili-viewport", LayoutViewport);
