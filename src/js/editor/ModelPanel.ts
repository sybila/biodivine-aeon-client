
export let ModelPanel: {
    init: (panel: HTMLElement) => void,
} = {

    init: function(panel: HTMLElement) {
        let indicator = panel.querySelector('.inline-input-indicator') as HTMLElement;
        let description_input = panel.querySelector('[data-event="model-description"]') as HTMLElement;

        description_input.onmouseenter = () => {            
            if (description_input != document.activeElement) {
                // Only show if not focused.
                indicator.classList.remove("invisible");
                indicator.style.left = String(description_input.offsetLeft + description_input.offsetWidth) + "px";
                indicator.style.top = String(description_input.offsetTop) + "px";
            }            
        }

        description_input.onmouseleave = () => {
            indicator.classList.add("invisible");
        }

        description_input.onfocus = () => {
            indicator.classList.add("invisible");
        }
    }

}

export default ModelPanel;