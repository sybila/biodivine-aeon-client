
export class UiButton extends HTMLElement {
    constructor() {
        super();
        
        let template = document.getElementById('ui-button-template') as HTMLTemplateElement;
        
        this.attachShadow({ mode: "open" })
            .appendChild(template.content.cloneNode(true));

        this.addEventListener("click", () => {
            console.log("Clicked!");
        })
    }    
}