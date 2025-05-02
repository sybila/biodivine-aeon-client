class Tab {
    constructor(type, data, tab) {
        this.type = type;
        this.data = data;
        this.tabWidget = tab;
        this.isActive = false;
    }

    changeStatus() {
        this.isActive = !this.isActive;

        if (this.isActive) {
            this.tabWidget.style.backgroundColor = "#B0BEC5";
        } else {
            this.tabWidget.style.backgroundColor = "#ECEFF1";
        }
    }
}