import Events, { ClickEvent, RegulationData } from './EditorEvents';

export let Menu: {
    _menu: HTMLElement,
    _hint: HTMLElement,
    _monotonicity: HTMLElement,
    _observability: HTMLElement,
    init(menu: HTMLElement): void,
    renderAt(position: { x: number, y: number }, zoom: number, edge: RegulationData): void,
    hide(): void,
    is_visible(): boolean,
} = {

    _menu: undefined,
    _monotonicity: undefined,
    _observability: undefined,
    _hint: undefined,

    init: function(menu: HTMLElement): void {
        this._menu = menu;
        this._monotonicity = document.getElementById("editor-floating-edge-menu-monotonicity");
        this._observability = document.getElementById("editor-floating-edge-menu-observability");
        let hint = menu.getElementsByClassName("hint")[0] as HTMLElement;
        this._hint = hint;
        let buttons = menu.getElementsByTagName("img");
        for (let i=0; i<buttons.length; i++) {
            let button = buttons[i];            
            button.onclick = () => { Events.click(button.dataset.event as ClickEvent); }
            button.onmouseleave = () => { hint.classList.add("invisible"); };
            button.onmouseenter = () => { 
                hint.textContent = button.alt;
                hint.classList.remove("invisible");
            }            
        }
    },

    renderAt(position: { x: number, y: number }, zoom: number, edge: RegulationData): void {
        let menu = this._menu as HTMLElement;        
        menu.classList.remove("invisible");
        menu.style.left = position.x + "px";
        menu.style.top = (position.y + (36 * zoom)) + "px";
        menu.style.transform = "scale(" + (zoom * 0.75) + ") translate(-50%, -50%)";

        // Update button state based on the edge data:
        let observability = this._observability as HTMLElement;
        
        let observable = String(edge.observable);
        if (observable !== observability.dataset["state"]) {
            let old_hint = observability.getAttribute("alt");
            observability.dataset["state"] = observable;
            observability.setAttribute("alt", observability.getAttribute("data-alt-"+observable));
            let img_src = document.getElementById(observability.getAttribute("data-src-"+observable));
            observability.setAttribute("src", img_src.getAttribute("src"));
            if (this._hint.textContent == old_hint) {
                this._hint.textContent = observability.getAttribute("alt");
            }
        }

        let monotonicity = this._monotonicity as HTMLElement;

        let monotonous = String(edge.monotonicity);
        if (monotonous !== monotonicity.dataset["state"]) {
            let old_hint = monotonicity.getAttribute("alt");
            monotonicity.dataset["state"] = monotonous;
            monotonicity.setAttribute("alt", monotonicity.getAttribute("data-alt-"+monotonous));
            let img_src = document.getElementById(monotonicity.getAttribute("data-src-"+monotonous));
            monotonicity.setAttribute("src", img_src.getAttribute("src"));
            if (this._hint.textContent == old_hint) {
                this._hint.textContent = monotonicity.getAttribute("alt");
            }
        }
    },

    hide() {
        let menu = this._menu as HTMLElement;
        menu.classList.add("invisible");
        menu.style.left = "-100pt";
        menu.style.top = "-100pt";
    },

    is_visible: function(): boolean {
        let menu = this._menu as HTMLElement;
        return !menu.classList.contains("invisible");
    },

}

export default Menu;