// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
const registry = new FinalizationRegistry((binding) => {
    binding.removeBinding();
});
/**
 * Bind the property chain as a path, separated by dots
 *
 * @example
 * ```ts
 * const binding = new PathBinding(source, "a.b.c");
 * binding.setBinding(element, "property");
 * ```
 */
export class PathBinding {
    source;
    path;
    converter;
    _target;
    _oldPathObjects;
    _actualSource;
    constructor(source, path, converter) {
        this.source = source;
        this.path = path;
        this.converter = converter;
    }
    setBinding(element, property) {
        if (this._target) throw new Error("Binding already set");
        this._target = { element: new WeakRef(element), property };
        registry.register(element, this);
        this.addPropertyChangedHandler();
    }
    removeBinding() {
        const element = this._target?.element.deref();
        if (element) registry.unregister(element);
        this._target = undefined;
        this.removePropertyChangedHandler();
    }
    handleAllPathPropertyChanged = (property, source) => {
        if (this.shouldUpdateHandler(property, source)) {
            this.removePropertyChangedHandler();
            this.addPropertyChangedHandler();
        }
    };
    handlePropertyChanged = (property, source) => {
        if (this.path.endsWith(property) && this._target) {
            this.setValue(source, property);
        }
    };
    shouldUpdateHandler(property, source) {
        if (this._oldPathObjects === undefined) {
            return true;
        }
        if (
            this._oldPathObjects.some(
                (element) => element.property === property && element.source === source,
            )
        ) {
            return true;
        }
        if (!this._actualSource) {
            return this.path.includes(property);
        }
        return false;
    }
    addPropertyChangedHandler() {
        const props = this.path.split(".");
        let source = this.source;
        this._oldPathObjects = [];
        for (let i = 0; i < props.length; i++) {
            if (!source || !(props[i] in source)) break;
            const sourceProperty = { source, property: props[i] };
            if (i === props.length - 1) {
                this.setValue(source, props[i]);
                this._actualSource = sourceProperty;
                source.onPropertyChanged(this.handlePropertyChanged);
                break;
            }
            source.onPropertyChanged(this.handleAllPathPropertyChanged);
            this._oldPathObjects.push(sourceProperty);
            source = source[props[i]];
        }
    }
    removePropertyChangedHandler() {
        if (!this._oldPathObjects) return;
        this._oldPathObjects.forEach((element) =>
            element.source.removePropertyChanged(this.handleAllPathPropertyChanged),
        );
        this._actualSource?.source.removePropertyChanged(this.handlePropertyChanged);
        this._actualSource = undefined;
        this._oldPathObjects = undefined;
    }
    setValue(source, property) {
        if (!this._target) return;
        const element = this._target.element.deref();
        if (!element) return;
        const value = source[property];
        if (this.converter) {
            const converted = this.converter.convert(value);
            if (converted.isOk) element[this._target.property] = converted.value;
        } else {
            element[this._target.property] = value;
        }
    }
    getPropertyValue() {
        return this._actualSource ? this._actualSource.source[this._actualSource.property] : undefined;
    }
}
export class Binding extends PathBinding {
    constructor(source, path, converter) {
        super(source, path.toString(), converter);
    }
}
