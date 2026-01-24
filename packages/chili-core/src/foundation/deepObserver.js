// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { isPropertyChanged } from "./observer";
import { Result } from "./result";
export class DeepObserver {
    static handlers = new Map();
    static getPathValue(instance, path) {
        const parts = path.split(".");
        let value = instance;
        for (let i = 0; i < parts.length; i++) {
            value = value[parts[i]];
            if (i < parts.length - 1 && !isPropertyChanged(value)) {
                return Result.err(`Path ${path} is not valid`);
            }
        }
        return Result.ok(value);
    }
    static addDeepPropertyChangedHandler(instance, handler) {
        const sourceHandler = DeepObserver.getOrInitHandler(instance, handler);
        this.deepHandlePropertyChanged(sourceHandler, instance);
    }
    static deepHandlePropertyChanged(sourceHandler, source, prefix) {
        source.onPropertyChanged(sourceHandler.handler);
        sourceHandler.sources.push({ source, prefix });
        let keys = Object.keys(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(source)));
        for (const key of keys) {
            if (key === "constructor" || key.startsWith("_")) {
                continue;
            }
            let subSource = source[key];
            if (isPropertyChanged(subSource)) {
                this.deepHandlePropertyChanged(sourceHandler, subSource, prefix ? `${prefix}.${key}` : key);
            }
        }
    }
    static removeDeepPropertyChangedHandler(instance, handler) {
        let handlerMap = this.handlers.get(instance);
        if (!handlerMap) {
            return;
        }
        let sourceHandler = handlerMap.get(handler);
        if (!sourceHandler) {
            this.handlers.delete(instance);
            return;
        }
        sourceHandler.sources.forEach((item) => {
            item.source.removePropertyChanged(sourceHandler.handler);
        });
        handlerMap.delete(handler);
        if (handlerMap.size === 0) {
            this.handlers.delete(instance);
        }
    }
    static getOrInitHandler(instance, deepHandler) {
        let handlerMap = DeepObserver.handlers.get(instance);
        if (!handlerMap) {
            handlerMap = new Map();
            DeepObserver.handlers.set(instance, handlerMap);
        }
        let sourceHandler = handlerMap.get(deepHandler);
        if (sourceHandler) {
            sourceHandler.sources.forEach((item) => {
                item.source.removePropertyChanged(sourceHandler.handler);
            });
        }
        sourceHandler = this.initSourceHandler(instance, deepHandler);
        handlerMap.set(deepHandler, sourceHandler);
        return sourceHandler;
    }
    static initSourceHandler(instance, deepHandler) {
        const handler = (property, target, oldValue) => {
            let sourceHandler = this.handlers.get(instance)?.get(deepHandler);
            if (!sourceHandler) {
                return;
            }
            let source = sourceHandler.sources.find((x) => x.source === target);
            if (!source) {
                return;
            }
            let prefix = source.prefix ? `${source.prefix}.${property}` : property;
            this.updateHandlers(sourceHandler, target, property, prefix);
            deepHandler(prefix, instance, oldValue);
        };
        return {
            handler,
            sources: [],
        };
    }
    static updateHandlers(sourceHandler, target, property, prefix) {
        const value = target[property];
        if (value === undefined && prefix != undefined) {
            const sources = [];
            for (const source of sourceHandler.sources) {
                if (source.prefix?.startsWith(prefix)) {
                    source.source.removePropertyChanged(sourceHandler.handler);
                } else {
                    sources.push(source);
                }
            }
            sourceHandler.sources = sources;
            return;
        }
        if (isPropertyChanged(value)) {
            this.deepHandlePropertyChanged(sourceHandler, value, prefix);
        }
    }
}
