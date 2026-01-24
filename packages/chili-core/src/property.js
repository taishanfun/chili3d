// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
const PropertyKeyMap = new Map();
export var Property;
(function (Property) {
    function define(display, parameters) {
        return (target, name) => {
            if (!PropertyKeyMap.has(target)) {
                PropertyKeyMap.set(target, new Map());
            }
            PropertyKeyMap.get(target)?.set(name, { display, name, ...parameters });
        };
    }
    Property.define = define;
    function getProperties(target, until) {
        const result = [];
        getAllKeysOfPrototypeChain(target, result, until);
        return result;
    }
    Property.getProperties = getProperties;
    function getOwnProperties(target) {
        const properties = PropertyKeyMap.get(target);
        if (!properties) return [];
        return [...properties.values()];
    }
    Property.getOwnProperties = getOwnProperties;
    function getAllKeysOfPrototypeChain(target, properties, until) {
        if (!target || target === until) return;
        if (PropertyKeyMap.has(target)) {
            properties.splice(0, 0, ...PropertyKeyMap.get(target).values());
        }
        getAllKeysOfPrototypeChain(Object.getPrototypeOf(target), properties, until);
    }
    function getProperty(target, property) {
        if (!target) return undefined;
        let map = PropertyKeyMap.get(target);
        if (map?.has(property)) return map.get(property);
        return getProperty(Object.getPrototypeOf(target), property);
    }
    Property.getProperty = getProperty;
})(Property || (Property = {}));
