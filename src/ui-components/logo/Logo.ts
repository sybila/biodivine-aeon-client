export class UiLogo extends HTMLElement {
    constructor() {
        super();


        let template = document.getElementById('ui-logo-template') as HTMLTemplateElement;
        
        this.attachShadow({ mode: "open" })
            .appendChild(template.content.cloneNode(true));

    }
}

export default UiLogo;