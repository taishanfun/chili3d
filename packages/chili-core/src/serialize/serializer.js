// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
import { Observable } from "../foundation";
export function registerReflect(data, name) {
    const actualName = name ?? data.ctor.name;
    if (reflectMap.has(actualName)) {
        console.warn(`Class ${actualName} already registered, skip.`);
        return;
    }
    reflectMap.set(actualName, data);
}
export function registerTypeArray(TypeArray) {
    return {
        ctor: TypeArray,
        ctorParamNames: ["buffer"],
        serialize: (target) => {
            return {
                buffer: Array.from(target),
            };
        },
        deserialize: (buffer) => {
            return new TypeArray(buffer);
        },
    };
}
const propertiesMap = new Map();
const reflectMap = new Map();
reflectMap.set("Float32Array", registerTypeArray(Float32Array));
reflectMap.set("Uint32Array", registerTypeArray(Uint32Array));
export var Serializer;
(function (Serializer) {
    function serialze() {
        return (target, property) => {
            let keys = propertiesMap.get(target);
            if (keys === undefined) {
                keys = new Set();
                propertiesMap.set(target, keys);
            }
            keys.add(property);
        };
    }
    Serializer.serialze = serialze;
    function register(ctorParamNames, deserialize, serialize) {
        return (target) => {
            registerReflect({
                ctor: target,
                ctorParamNames,
                serialize,
                deserialize,
            });
        };
    }
    Serializer.register = register;
})(Serializer || (Serializer = {}));
(function (Serializer) {
    /**
     * Deserialize an object
     *
     * @param document Document that contains the object.
     * @param data Serialize the data. If the serialized data does not contain
     * the parameters required by the deserialization function, these parameters
     * should be added to the serialized data, for example:
     * ```
     * data.properties[“parent”] = node.
     * ```
     * @returns Deserialized object
     */
    function deserializeObject(document, data) {
        let instance = deserializeInstance(document, data.classKey, data.properties);
        deserializeProperties(document, instance, data);
        return instance;
    }
    Serializer.deserializeObject = deserializeObject;
    function deserializeInstance(document, className, properties) {
        if (!reflectMap.has(className)) {
            throw new Error(
                `${className} cannot be deserialize. Did you forget to add the decorator @Serializer.register?`,
            );
        }
        const { ctor, ctorParamNames, deserialize } = reflectMap.get(className);
        const parameters = deserilizeParameters(document, ctorParamNames, properties, className);
        if (deserialize) {
            return deserialize(...ctorParamNames.map((x) => parameters[x]));
        }
        return new ctor(...ctorParamNames.map((x) => parameters[x]));
    }
    function deserilizeParameters(document, ctorParamNames, properties, className) {
        const parameters = {};
        parameters["document"] = document;
        for (const key of ctorParamNames) {
            if (key in properties) {
                parameters[key] = deserialValue(document, properties[key]);
            } else if (key !== "document") {
                parameters[key] = undefined;
                console.warn(`${className} constructor parameter ${key} is missing`);
            }
        }
        return parameters;
    }
    function deserialValue(document, value) {
        if (value === null || value === undefined) {
            return undefined;
        }
        if (Array.isArray(value)) {
            return value.map((v) => {
                if (v === null || v === undefined) {
                    return undefined;
                }
                return typeof v === "object" ? deserializeObject(document, v) : v;
            });
        }
        return value.classKey ? deserializeObject(document, value) : value;
    }
    function deserializeProperties(document, instance, data, ignores) {
        let { ctorParamNames } = reflectMap.get(data.classKey);
        const filter = (key) => {
            return !ctorParamNames.includes(key) && !ignores?.includes(key);
        };
        let keys = Object.keys(data.properties).filter(filter);
        for (const key of keys) {
            if (instance instanceof Observable) {
                instance.setPrivateValue(key, deserialValue(document, data.properties[key]));
            } else {
                instance[key] = deserialValue(document, data.properties[key]);
            }
        }
    }
})(Serializer || (Serializer = {}));
(function (Serializer) {
    function serializeObject(target) {
        let classKey = target.constructor.name;
        if (!reflectMap.has(classKey)) {
            console.log(target);
            throw new Error(
                `Type ${target.constructor.name} is not registered, please add the @Serializer.register decorator.`,
            );
        }
        let data = reflectMap.get(classKey);
        let properties = data.serialize?.(target) ?? serializeProperties(target);
        return {
            classKey,
            properties,
        };
    }
    Serializer.serializeObject = serializeObject;
    function serializeProperties(target) {
        let data = {};
        let keys = getAllKeysOfPrototypeChain(target, propertiesMap);
        for (const key of keys) {
            let value = target[key];
            if (Array.isArray(value)) {
                data[key] = value.map((v) => serializePropertyValue(v));
            } else {
                data[key] = serializePropertyValue(value);
            }
        }
        return data;
    }
    Serializer.serializeProperties = serializeProperties;
    function serializePropertyValue(value) {
        let type = typeof value;
        if (type === "object") {
            return serializeObject(value);
        }
        if (type !== "function" && type !== "symbol") {
            return value;
        }
        throw new Error(`Unsupported serialized object: ${value}`);
    }
    function getAllKeysOfPrototypeChain(target, map) {
        let keys = [];
        let prototype = Object.getPrototypeOf(target);
        while (prototype !== null) {
            let k = map.get(prototype);
            if (k) keys.push(...k.values());
            prototype = Object.getPrototypeOf(prototype); // prototype chain
        }
        return new Set(keys);
    }
})(Serializer || (Serializer = {}));
