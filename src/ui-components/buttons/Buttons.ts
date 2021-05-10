import bus from '../UiEvents';

/**
 * A private class that provides the click functionality.
 */
class ClickableElement extends HTMLElement {
    constructor() {
        super();

        this.addEventListener("click", () => {
            this.performClick('mouse');
        });

        this.addEventListener("keydown", (e) => {
            if (e.code == "Enter") {
                this.classList.add("active");
            }
        });
    
        this.addEventListener("keyup", (e) => {            
            if (e.code == "Enter") {
                this.classList.remove("active");
                this.performClick('keyboard');
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
        if (this.getAttribute("event") !== null) {
            bus.emitClick(this.getAttribute("event"), this);            
        }
    }

}

export class UiButton extends ClickableElement {
    constructor() {
        super();
        
        let template = document.getElementById('ui-button-template') as HTMLTemplateElement;
        
        this.attachShadow({ mode: "open" })
            .appendChild(template.content.cloneNode(true));
    }    

}

export class UiLink extends ClickableElement {
    constructor() {
        super();

        let template = document.getElementById("ui-link-template") as HTMLTemplateElement;

        this.attachShadow({ mode: "open" })
            .appendChild(template.content.cloneNode(true));    
    }
}