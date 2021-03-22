import Cytoscape from './Cytoscape';
import Events from './EditorEvents';

type ElementMap = { [key: string]: HTMLElement }

export let Dock: { 
    _dock: HTMLElement, 
    _panelButtons: ElementMap,
    init: (dock: HTMLElement) => void,
} = {

	_dock: undefined,
	_panelButtons: {},

	init(dock: HTMLElement) {
		this._dock = dock;

		// Emit events when buttons are clicked.        
		for (let button of dock.children) {
            if (button instanceof HTMLElement && button.tagName === "BUTTON") {            
                if (button.dataset.selectable !== undefined) {
                    this._panelButtons[button.dataset.panel] = button;
                    button.onclick = function() {
                        let button = this as HTMLElement;
                        if (button.classList.contains("selected")) {
                            Events.panel.close(button.dataset["panel"]);
                        } else {
                            Events.panel.open(button.dataset["panel"]);
                        }
                    };
                }
            }				
		}

		// When panel is opened, select the associated button.
		Events.panel.onOpen((panel: string) => {
			let button = this._panelButtons[panel];
			if (button !== undefined) {
				button.classList.add("selected");
			}
		});

		// When panel is closed, select the associated button.
		Events.panel.onClose((panel: string) => {
			let button = this._panelButtons[panel];
			if (button !== undefined) {
				button.classList.remove("selected");
			}			
		});	
		
		// Enable SCC button
		let button = document.getElementById("editor-model-toggle-scc")
		button.onclick = () => {
			if (button.classList.contains("selected")) {
				button.classList.remove("selected");
				Cytoscape.remove_scc_nodes();
			} else {
				button.classList.add("selected");
				Cytoscape.create_scc_nodes();
			}
		};
	},	

}

export default Dock;