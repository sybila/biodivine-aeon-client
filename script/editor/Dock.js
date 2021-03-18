
let Dock = {

	_dock: undefined,
	_panelButtons: {},

	init(dock) {
		this._dock = dock;

		// Emit events when buttons are clicked.
		for (button of dock.children) {
			if (button.tagName !== "BUTTON") continue;
		
			if (button.dataset.clickable !== undefined) {								
				button.onclick = function() {
					Events.emit(this.dataset.event, "click"); 
				};
			}

			if (button.dataset.selectable !== undefined) {
				this._panelButtons[button.dataset.panel] = button;
				button.onclick = function() {
					if (this.classList.contains("selected")) {
						Events.emit("panel.close", this.dataset.panel); 
					} else {
						Events.emit("panel.open", this.dataset.panel); 
					}
				};
			}
		}

		// When panel is opened, select the associated button.
		Events.addListener("panel.open", (panel) => {
			let button = this._panelButtons[panel];
			if (button !== undefined) {
				button.classList.add("selected");
			}
		});

		// When panel is closed, select the associated button.
		Events.addListener("panel.close", (panel) => {
			let button = this._panelButtons[panel];
			if (button !== undefined) {
				button.classList.remove("selected");
			}			
		});		
	},	

}