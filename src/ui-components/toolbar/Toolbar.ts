import bus from '../UiEvents';

export class UiToolbar extends HTMLElement {
    constructor() {
        super();

        let template = document.getElementById('ui-toolbar-template') as HTMLTemplateElement;
        
        this.attachShadow({ mode: "open" })
            .appendChild(template.content.cloneNode(true));
    }
}

export class UiToolbarButton extends HTMLElement {
    constructor() {
        super();

        let template = document.getElementById('ui-toolbar-button-template') as HTMLTemplateElement;  

        this.attachShadow({ mode: "open" })
            .appendChild(template.content.cloneNode(true));

        this.addEventListener("click", (e) => {
            this.performClick("mouse");
        });

        this.addEventListener("keydown", (e) => {
            if (e.code == "Enter") {
                this.classList.add("active");
            }
        });
    
        this.addEventListener("keyup", (e) => {            
            if (e.code == "Enter") {
                this.classList.remove("active");                
                this.performClick("keyboard");
            }            
        });
    }

    connectedCallback() {
        this.setAttribute("tabindex", "0");
    }
    
    performClick(device: 'mouse' | 'keyboard' | undefined) {        
        if (device == 'mouse') {
            // If the button was clicked with a mouse, we have to clear
            // focus because in some browsers it will still keep showing
            // the focus outline...
            this.blur();
        }        
        let group = this.getAttribute("group");
        let event = this.getAttribute("event");
        if (group !== null) {
            // This element is selectable.            
            if (this.getAttribute("toggle") == "true" && this.classList.contains("selected")) {
                // For toggleable elements, switch to unselect in this case.
                bus.emitSelection(undefined, group, this);
            } else {
                let reselect = this.getAttribute("reselect") != "false";
                if (!this.classList.contains("selected") || reselect) {
                    bus.emitSelection(event, group, this);
                }                
            }            
        } else if (event !== null) {
            // This element is clickable.
            bus.emitClick(event, this);            
        }        
    }
}