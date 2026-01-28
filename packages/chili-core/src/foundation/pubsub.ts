// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

import { CommandKeys, ICommand } from "../command";
import { IDocument } from "../document";
import { I18nKeys } from "../i18n";
import { Material } from "../material";
import { INode } from "../model";
import { DialogResult } from "../ui";
import { CursorType, IView } from "../visual";
import { AsyncController } from "./asyncController";
import { IDisposable } from "./disposable";
import { MessageType } from "./messageType";
import { Result } from "./result";
import { getCurrentApplication, IApplication } from "../application";

export interface PubSubEventMap {
    activeViewChanged: (view: IView | undefined) => void;
    clearFloatTip: () => void;
    clearInput: () => void;
    clearSelectionControl: () => void;
    clearStatusBarTip: () => void;
    closeCommandContext: () => void;
    displayError: (message: string) => void;
    displayHome: (show: boolean) => void;
    documentClosed: (document: IDocument) => void;
    editMaterial: (document: IDocument, material: Material, callback: (material: Material) => void) => void;
    executeCommand: (commandName: CommandKeys) => void;
    modelUpdate: (model: INode) => void;
    openCommandContext: (command: ICommand) => void;
    parentVisibleChanged: (model: INode) => void;
    selectionChanged: (document: IDocument, selected: INode[], unselected: INode[]) => void;
    showDialog: (title: I18nKeys, content: HTMLElement, callback?: (result: DialogResult) => void) => void;
    showFloatTip: (dom: HTMLElement | { level: MessageType; msg: string }) => void;
    showInput: (text: string, handler: (text: string) => Result<string, I18nKeys>) => void;
    showPermanent: (action: () => Promise<void>, message: I18nKeys, ...args: any[]) => void;
    showProperties(document: IDocument, nodes: INode[]): void;
    showSelectionControl: (controller: AsyncController) => void;
    showToast: (message: I18nKeys, ...args: any[]) => void;
    statusBarTip: (tip: I18nKeys) => void;
    viewClosed: (view: IView) => void;
    viewCursor: (cursor: CursorType) => void;
    visibleChanged: (model: INode) => void;
}

type EventCallback = (...args: any[]) => void;
type EventMap = Map<keyof PubSubEventMap, Set<EventCallback>>;

export class PubSub implements IDisposable {
    static readonly default = new (class ScopedPubSub extends PubSub {
        private readonly scopes = new Map<unknown, PubSub>();
        private readonly globalScope = Symbol.for("chili3d.pubsub.global");

        private resolveScopeFromArgs(args: any[]): unknown | undefined {
            const first = args[0];
            if (!first || typeof first !== "object") return undefined;
            const firstAny = first as any;
            if (firstAny.application) return firstAny.application as IApplication;
            if (firstAny.document?.application) return firstAny.document.application as IApplication;
            if (firstAny.view?.document?.application)
                return firstAny.view.document.application as IApplication;
            return undefined;
        }

        private resolveScopeFromCurrent(): unknown {
            return getCurrentApplication() ?? this.globalScope;
        }

        private busFor(scope: unknown): PubSub {
            const key = scope ?? this.globalScope;
            const existing = this.scopes.get(key);
            if (existing) return existing;
            const bus = new PubSub();
            this.scopes.set(key, bus);
            return bus;
        }

        override dispose(): void {
            this.scopes.forEach((bus) => bus.dispose());
            this.scopes.clear();
        }

        override sub<K extends keyof PubSubEventMap>(event: K, callback: PubSubEventMap[K]): void {
            const scope = this.resolveScopeFromCurrent();
            this.busFor(scope).sub(event, callback);
        }

        override pub<K extends keyof PubSubEventMap>(
            event: K,
            ...args: Parameters<PubSubEventMap[K]>
        ): void {
            const scope = this.resolveScopeFromArgs(args) ?? this.resolveScopeFromCurrent();
            this.busFor(scope).pub(event, ...args);
        }

        override remove<K extends keyof PubSubEventMap>(event: K, callback: PubSubEventMap[K]): void {
            const scope = this.resolveScopeFromCurrent();
            this.busFor(scope).remove(event, callback);
        }

        override removeAll<K extends keyof PubSubEventMap>(event: K): void {
            const scope = this.resolveScopeFromCurrent();
            this.busFor(scope).removeAll(event);
        }
    })();
    private readonly events: EventMap = new Map();

    dispose(): void {
        this.events.forEach((callbacks) => callbacks.clear());
        this.events.clear();
    }

    sub<K extends keyof PubSubEventMap>(event: K, callback: PubSubEventMap[K]): void {
        const callbacks = this.events.get(event) ?? new Set<EventCallback>();
        callbacks.add(callback);
        this.events.set(event, callbacks);
    }

    pub<K extends keyof PubSubEventMap>(event: K, ...args: Parameters<PubSubEventMap[K]>): void {
        this.events.get(event)?.forEach((callback) => callback(...args));
    }

    remove<K extends keyof PubSubEventMap>(event: K, callback: PubSubEventMap[K]): void {
        this.events.get(event)?.delete(callback);
    }

    removeAll<K extends keyof PubSubEventMap>(event: K): void {
        this.events.get(event)?.clear();
    }
}
