let Panels = {

	_panels: undefined,
	_panelElements: {},	

	init(panels) {
		this._panels = panels;

		for (panel of panels.children) {
			if (panel.tagName !== "DIV") continue;
			if (panel.dataset.panel === undefined) {
				throw "Panel without name detected.";
			}

			this._panelElements[panel.dataset.panel] = panel;
		}

		Events.addListener("panel.open", (panel_name) => {
			let panel = this._panelElements[panel_name];
			if (panel !== undefined) {
				// Close any panel that is currently opened.
				for (child of this._panels.children) {
					if (child.classList.contains("selected")) {
						Events.emit("panel.close", child.dataset.panel);
					}
				}

				panel.classList.add("selected");
			}
		});

		Events.addListener("panel.close", (panel_name) => {
			if (panel_name == ":selected") {
				for (child of this._panels.children) {
					if (child.classList.contains("selected")) {
						Events.emit("panel.close", child.dataset.panel);
					}
				}
			} else {
				let panel = this._panelElements[panel_name];
				if (panel !== undefined) {
					panel.classList.remove("selected");
				}
			}			
		})
	},	

}