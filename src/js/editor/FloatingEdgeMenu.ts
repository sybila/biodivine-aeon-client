import Events, { RegulationData } from './EditorEvents';

export let Menu: {
    _menu: HTMLElement,
    _monotonicity: HTMLElement,
    _observability: HTMLElement,
    init(menu: HTMLElement): void,
    renderAt(position: { x: number, y: number }, zoom: number, edge: RegulationData): void,
    hide(): void,
} = {

    _menu: undefined,
    _monotonicity: undefined,
    _observability: undefined,

    init: function(menu: HTMLElement): void {
        this._menu = menu;
        this._monotonicity = document.getElementById("editor-floating-edge-menu-monotonicity");
        this._observability = document.getElementById("editor-floating-edge-menu-observability");
        let hint = menu.getElementsByClassName("hint")[0] as HTMLElement;
        let buttons = menu.getElementsByTagName("img");
        for (let i=0; i<buttons.length; i++) {
            let button = buttons[i];            
            button.onclick = () => { Events.click(button.dataset.event); }
            button.onmouseleave = () => { hint.classList.add("invisible"); };
            button.onmouseenter = () => { 
                hint.textContent = button.alt;
                hint.classList.remove("invisible");
            }            
        }
    },

    renderAt(position: { x: number, y: number }, zoom: number, edge: RegulationData): void {
        let menu = this._menu as HTMLElement;        
        menu.style.left = position.x + "px";
        menu.style.top = (position.y + (36 * zoom)) + "px";
        menu.style.transform = "scale(" + (zoom * 0.75) + ") translate(-50%, -50%)";

        // Update button state based on the edge data:
        let observability = this._observability as HTMLElement;
        
        let observable = String(edge.observable);
        if (observable !== observability.dataset["state"]) {
            observability.dataset["state"] = observable;
            observability.setAttribute("alt", observability.getAttribute("data-alt-"+observable));
            let img_src = document.getElementById(observability.getAttribute("data-src-"+observable));
            observability.setAttribute("src", img_src.getAttribute("src"));
        }

        let monotonicity = this._monotonicity as HTMLElement;

        let monotonous = String(edge.monotonicity);
        if (monotonous !== monotonicity.dataset["state"]) {
            monotonicity.dataset["state"] = monotonous;
            monotonicity.setAttribute("alt", monotonicity.getAttribute("data-alt-"+monotonous));
            let img_src = document.getElementById(monotonicity.getAttribute("data-src-"+monotonous));
            monotonicity.setAttribute("src", img_src.getAttribute("src"));
        }
    },

    hide() {
        let menu = this._menu as HTMLElement;
        menu.style.left = "-100pt";
        menu.style.top = "-100pt";
    }

}

export default Menu;