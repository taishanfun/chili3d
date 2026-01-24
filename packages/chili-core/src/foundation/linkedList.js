// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.
export class LinkedList {
    _head;
    get head() {
        return this._head?.data;
    }
    _tail;
    get tail() {
        return this._tail?.data;
    }
    _size = 0;
    get size() {
        return this._size;
    }
    push(...items) {
        for (const item of items) {
            const node = { data: item };
            if (!this._head) {
                this._head = this._tail = node;
            } else {
                node.prev = this._tail;
                this._tail.next = node;
                this._tail = node;
            }
            this._size++;
        }
    }
    insert(index, item) {
        if (index < 0 || index >= this._size) return;
        if (index === 0) {
            const node = { data: item, next: this._head };
            if (this._head) this._head.prev = node;
            this._head = node;
            if (!this._tail) this._tail = node;
            this._size++;
            return;
        }
        const targetNode = this.nodeAt(index);
        if (!targetNode) return;
        const newNode = {
            data: item,
            next: targetNode,
            prev: targetNode.prev,
        };
        if (targetNode.prev) targetNode.prev.next = newNode;
        targetNode.prev = newNode;
        this._size++;
    }
    remove(item) {
        let current = this._head;
        while (current) {
            if (current.data === item) {
                this.removeNode(current);
                return;
            }
            current = current.next;
        }
    }
    removeAt(index) {
        let node = this.nodeAt(index);
        if (node) this.removeNode(node);
    }
    removeNode(node) {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this._head = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this._tail = node.prev;
        }
        this._size--;
    }
    nodeAt(index) {
        if (index < 0 || index >= this._size) return undefined;
        if (index === 0) return this._head;
        if (index === this._size - 1) return this._tail;
        let current;
        if (index <= this._size / 2) {
            current = this._head;
            for (let i = 0; i < index; i++) {
                current = current.next;
            }
        } else {
            current = this._tail;
            for (let i = this._size - 1; i > index; i--) {
                current = current.prev;
            }
        }
        return current;
    }
    clear() {
        this._head = undefined;
        this._tail = undefined;
        this._size = 0;
    }
    reverse() {
        let currentNode = this._head;
        while (currentNode) {
            const next = currentNode.next;
            currentNode.next = currentNode.prev;
            currentNode.prev = next;
            currentNode = currentNode.prev;
        }
        const tail = this._tail;
        this._tail = this._head;
        this._head = tail;
    }
    *[Symbol.iterator]() {
        let current = this._head;
        while (current) {
            yield current.data;
            current = current.next;
        }
    }
}
