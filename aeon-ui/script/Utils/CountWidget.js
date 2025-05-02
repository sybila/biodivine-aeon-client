/** Object for managing counters in the stats of the controllable and the phenotype editors. */
class CountWidget {
    constructor(widget, startCount = 0) {
        this.statWidget = widget;
        this.count = startCount;
    }

    /** Update data shown in the countWidget. */
    updateCount() {
        this.statWidget.textContent = this.count;
    }

    /** Increments this.count and updates it if update is set to true. */
    increment() {
        this.count += 1;
    }

    /** Decrements this.count and updates it if update is set to true. */
    decrement() {
        this.count -= 1;
    }

    /** Resets countWidget and count to 0. */
    clear() {
        this.count = 0;
        this.updateCount();
    }

    /** Returns current value of the counter. */
    getCount() {
        return this.count;
    }

    /** Returns true if counter value is equal to 0. */
    isZero() {
        return this.count == 0;
    }
}