import Events from './EditorEvents';

type ElementMap = { [key: string]: HTMLElement }

export let Panels: {
    _panels: HTMLElement,
    _panelElements: ElementMap,
    init: (panels: HTMLElement) => void,
	is_open: () => string | undefined,
} = {

	_panels: undefined,
	_panelElements: {},	

	init(panels) {
		this._panels = panels;

		for (let panel of panels.children) {
            if (panel instanceof HTMLElement && panel.tagName === "DIV") {
                if (panel.dataset["panel"] === undefined) {
                    throw "Panel without name detected.";
                }
    
                this._panelElements[panel.dataset["panel"]] = panel;                
            }			
		}

        for (let close of panels.getElementsByClassName("panel-close")) {
            if (close instanceof HTMLElement) {
                close.onclick = function() { Events.panel.close(":selected"); };
            }            
        }

        Events.panel.onOpen((panel_name: string) => {            
			let panel = this._panelElements[panel_name];            
			if (panel !== undefined) {
				// Close any panel that is currently opened.
				for (let child of this._panels.children) {
					if (child.classList.contains("selected")) {
                        Events.panel.close(child.dataset["panel"]);
					}
				}

				panel.classList.add("selected");
			}
		});

		Events.panel.onClose((panel_name: string) => {
			if (panel_name == ":selected") {
				for (let child of this._panels.children) {
					if (child.classList.contains("selected")) {
						Events.panel.close(child.dataset["panel"]);
					}
				}
			} else {
				let panel = this._panelElements[panel_name];
				if (panel !== undefined) {
					panel.classList.remove("selected");
				}
			}			
		});
	},	

	is_open: function() {
		let panels = this._panelElements as ElementMap;
		for (let panel_name of Object.keys(panels)) {
			if (panels[panel_name].classList.contains("selected")) {
				return panel_name;
			}
		}
		return undefined;
	},

}

export default Panels;