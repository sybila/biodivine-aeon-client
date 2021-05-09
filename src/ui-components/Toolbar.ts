
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

        this.addEventListener("keydown", (e) => {
            if (e.code == "Enter") {
                this.classList.add("active");
            }
        });
    
        this.addEventListener("keyup", (e) => {            
            if (e.code == "Enter") {
                this.classList.remove("active");                
            }            
        });
    }

    connectedCallback() {
        this.setAttribute("tabindex", "0");
    }
}