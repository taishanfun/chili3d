// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { collection, div, input, label, span, svg } from "chili-controls";
import {
    Act,
    Binding,
    CameraType,
    CursorType,
    DialogResult,
    IConverter,
    IView,
    Localize,
    PubSub,
    Result,
} from "chili-core";
import { Flyout } from "./flyout";
import style from "./viewport.module.css";

class CameraConverter implements IConverter<CameraType> {
    constructor(readonly type: CameraType) {}

    convert(value: CameraType): Result<string, string> {
        if (value === this.type) {
            return Result.ok(style.actived);
        }
        return Result.ok("");
    }
}

export class Viewport extends HTMLElement {
    private readonly _flyout: Flyout;
    private readonly _eventCaches: [keyof HTMLElementEventMap, (e: any) => void][] = [];
    private readonly _acts: HTMLElement;
    private readonly _crosshair: HTMLElement;
    private readonly _crosshairH: HTMLElement;
    private readonly _crosshairV: HTMLElement;
    private readonly _crosshairCenter: HTMLElement;
    private _cursorType: CursorType = "default";
    private _isPanning: boolean = false;

    constructor(
        readonly view: IView,
        readonly showViewControls: boolean,
    ) {
        super();
        this.className = style.root;
        this._flyout = new Flyout();
        this._crosshairH = div({ className: style.crosshairH });
        this._crosshairV = div({ className: style.crosshairV });
        this._crosshairCenter = div({ className: style.crosshairCenter });
        this._crosshair = div(
            {
                className: style.crosshair,
            },
            this._crosshairH,
            this._crosshairV,
            this._crosshairCenter,
        );
        this._acts = this.createActs();
        this.render();
        view.setDom(this);
    }

    setCursorType(type: CursorType) {
        this._cursorType = type;
        this.syncCursor();
    }

    private readonly onActCollectionChanged = () => {
        if (this.view.document.acts.length === 0) {
            this._acts.style.display = "none";
        } else {
            this._acts.style.display = "flex";
        }
    };

    private render() {
        this.append(
            this._crosshair,
            this._acts,
            this.showViewControls
                ? div(
                      {
                          className: style.viewControls,
                          onpointerdown: (ev) => ev.stopPropagation(),
                          onclick: (e) => e.stopPropagation(),
                      },
                      this.createCameraControls(),
                      this.createActionControls(),
                  )
                : "",
        );
    }

    private createCameraControls() {
        if (this.view.document.mode === "2d") {
            return div(
                { className: style.border },
                this.createCameraControl("orthographic", "icon-orthographic"),
            );
        }
        return div(
            { className: style.border },
            this.createCameraControl("orthographic", "icon-orthographic"),
            this.createCameraControl("perspective", "icon-perspective"),
        );
    }

    private createActionControls() {
        return div(
            { className: style.border },
            svg({
                icon: "icon-fitcontent",
                title: new Localize("viewport.fitContent"),
                onclick: async (e) => {
                    e.stopPropagation();
                    this.view.cameraController.fitContent();
                    this.view.update();
                },
            }),
            svg({
                icon: "icon-zoomin",
                title: new Localize("viewport.zoomIn"),
                onclick: () => {
                    this.view.cameraController.zoom(this.view.width / 2, this.view.height / 2, -5);
                    this.view.update();
                },
            }),
            svg({
                icon: "icon-zoomout",
                title: new Localize("viewport.zoomOut"),
                onclick: () => {
                    this.view.cameraController.zoom(this.view.width / 2, this.view.height / 2, 5);
                    this.view.update();
                },
            }),
        );
    }

    private createActs() {
        return div(
            { className: style.actsContainer },
            div(
                {
                    className: style.border,
                    onpointerdown: (ev) => ev.stopPropagation(),
                    onclick: (e) => e.stopPropagation(),
                },
                collection({
                    className: style.acts,
                    sources: this.view.document.acts,
                    template: (v) => {
                        return div(
                            {
                                onclick: () => {
                                    this.view.cameraController.lookAt(
                                        v.cameraPosition,
                                        v.cameraTarget,
                                        v.cameraUp,
                                    );
                                    this.view.update();
                                },
                            },
                            span({
                                textContent: new Binding(v, "name"),
                            }),
                            div(
                                {
                                    className: style.tools,
                                },
                                svg({
                                    icon: "icon-cog",
                                    onclick: () => this.setActName(v),
                                }),
                                svg({
                                    icon: "icon-times",
                                    onclick: () => {
                                        this.view.document.acts.remove(v);
                                    },
                                }),
                            ),
                        );
                    },
                    onwheel: (e) => {
                        e.preventDefault();
                        const container = e.currentTarget as HTMLElement;
                        container.scrollLeft += e.deltaY;
                    },
                }),
            ),
        );
    }

    private readonly setActName = (act: Act) => {
        const inputBox = input({
            value: act.name,
            onkeydown: (e) => {
                e.stopPropagation();
            },
        });
        PubSub.default.pub(
            "showDialog",
            "ribbon.group.act",
            div(label({ textContent: new Localize("common.name") }), ": ", inputBox),
            (result) => {
                if (result === DialogResult.ok) {
                    act.name = inputBox.value;
                }
            },
        );
    };

    private createCameraControl(cameraType: CameraType, icon: string) {
        return div(
            {
                className: new Binding(
                    this.view.cameraController,
                    "cameraType",
                    new CameraConverter(cameraType),
                ),
            },
            svg({
                icon: icon,
                title: new Localize(`viewport.${cameraType}`),
                onclick: (e) => {
                    e.stopPropagation();
                    this.view.cameraController.cameraType = cameraType;
                    this.view.update();
                },
            }),
        );
    }

    connectedCallback() {
        this.initEvent();
        this.appendChild(this._flyout);
        this.view.document.acts.onCollectionChanged(this.onActCollectionChanged);
        this.onActCollectionChanged();
    }

    disconnectedCallback() {
        this.removeEvents();
        this._flyout.remove();
        this.view.document.acts.removeCollectionChanged(this.onActCollectionChanged);
    }

    dispose() {
        this.removeEvents();
    }

    private initEvent() {
        let events: [keyof HTMLElementEventMap, (view: IView, e: any) => any][] = [
            ["pointerdown", this.pointerDown],
            ["pointermove", this.pointerMove],
            ["pointerout", this.pointerOut],
            ["pointerup", this.pointerUp],
            ["wheel", this.mouseWheel],
        ];
        events.forEach((v) => {
            this.addEventListenerHandler(v[0], v[1]);
        });
    }

    private addEventListenerHandler(type: keyof HTMLElementEventMap, handler: (view: IView, e: any) => any) {
        let listener = (e: any) => {
            e.preventDefault();
            handler(this.view, e);
        };
        this.addEventListener(type, listener);
        this._eventCaches.push([type, listener]);
    }

    private removeEvents() {
        this._eventCaches.forEach((x) => {
            this.removeEventListener(x[0], x[1]);
        });
        this._eventCaches.length = 0;
    }

    private readonly pointerMove = (view: IView, event: PointerEvent) => {
        if (this._flyout) {
            this._flyout.style.top = event.offsetY + "px";
            this._flyout.style.left = event.offsetX + "px";
        }
        this.updateCrosshairPosition(event.offsetX, event.offsetY);
        if (view.document.visual.eventHandler.isEnabled)
            view.document.visual.eventHandler.pointerMove(view, event);
        if (view.document.visual.viewHandler.isEnabled)
            view.document.visual.viewHandler.pointerMove(view, event);
    };

    private readonly pointerDown = (view: IView, event: PointerEvent) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        view.document.application.activeView = view;
        this._isPanning = event.button === 1 || (event.buttons & 4) === 4;
        this.syncCursor();
        if (view.document.visual.eventHandler.isEnabled)
            view.document.visual.eventHandler.pointerDown(view, event);
        if (view.document.visual.viewHandler.isEnabled)
            view.document.visual.viewHandler.pointerDown(view, event);
    };

    private readonly pointerUp = (view: IView, event: PointerEvent) => {
        this._isPanning = (event.buttons & 4) === 4;
        this.syncCursor();
        if (view.document.visual.eventHandler.isEnabled)
            view.document.visual.eventHandler.pointerUp(view, event);
        if (view.document.visual.viewHandler.isEnabled)
            view.document.visual.viewHandler.pointerUp(view, event);
    };

    private readonly pointerOut = (view: IView, event: PointerEvent) => {
        this.hideCrosshair();
        if (view.document.visual.eventHandler.isEnabled)
            view.document.visual.eventHandler.pointerOut?.(view, event);
        if (view.document.visual.viewHandler.isEnabled)
            view.document.visual.viewHandler.pointerOut?.(view, event);
    };

    private readonly mouseWheel = (view: IView, event: WheelEvent) => {
        if (view.document.visual.eventHandler.isEnabled)
            view.document.visual.eventHandler.mouseWheel?.(view, event);
        if (view.document.visual.viewHandler.isEnabled)
            view.document.visual.viewHandler.mouseWheel?.(view, event);
    };

    private syncCursor() {
        const shouldShowCrosshair = this._cursorType === "draw" || this._cursorType === "select.default";
        if (shouldShowCrosshair && !this._isPanning) {
            this._crosshair.classList.add(style.crosshairVisible);
            this.classList.remove(style.panCursor);
        } else {
            this._crosshair.classList.remove(style.crosshairVisible);
            if (this._isPanning) {
                this.classList.add(style.panCursor);
            } else {
                this.classList.remove(style.panCursor);
            }
        }
    }

    private updateCrosshairPosition(x: number, y: number) {
        if (!this._crosshair.classList.contains(style.crosshairVisible)) {
            return;
        }
        this._crosshairH.style.top = `${y}px`;
        this._crosshairV.style.left = `${x}px`;
        this._crosshairCenter.style.left = `${x}px`;
        this._crosshairCenter.style.top = `${y}px`;
    }

    private hideCrosshair() {
        this._crosshair.classList.remove(style.crosshairVisible);
        this.classList.remove(style.panCursor);
        this._isPanning = false;
    }
}

customElements.define("chili-uiview", Viewport);
