export class Mutex {
    constructor() {
        this.queue = [];
        this.locked = false;
    }

    lock() {
        return new Promise((resolve, reject) => {
            if (this.locked) {
                this.queue.push(resolve);
            } else {
                this.locked = true;
                resolve();
            }
        });
    }

    unlock() {
        if (this.queue.length > 0) {
            const nextResolve = this.queue.shift();
            nextResolve();
        } else {
            this.locked = false;
        }
    }
}