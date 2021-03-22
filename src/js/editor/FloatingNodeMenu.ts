import Events, { ClickEvent } from './EditorEvents';

export let Menu: {
    _menu: HTMLElement,
    init(menu: HTMLElement): void,
    renderAt(position: { x: number, y: number}, zoom: number): void,
    hide(): void,
    is_visible(): boolean,
} = {

    _menu: undefined,

    init: function(menu: HTMLElement) {
        this._menu = menu;
        let hint = menu.getElementsByClassName("hint")[0] as HTMLElement;
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

    renderAt: function(position: { x: number, y: number }, zoom: number) {
        let menu = this._menu as HTMLElement;        
        menu.classList.remove("invisible");
        menu.style.left = position.x + "px";
        menu.style.top = (position.y + (36 * zoom)) + "px";
        // Scale applies current zoom, translate ensures the middle point of menu is 
        // actually at postion [left, top] (this makes it easier to align).
        // Note the magic constant next to zoom: It turns out we needed smaller font
        // size on the editor nodes (to make import more reasonable).
        // However, that made the menu much too big, so we are sticking with "zooming out"
        // the menu and keeping smaller sizes in the graph.
        menu.style.transform = "scale(" + (zoom * 0.75) + ") translate(-50%, -50%)";			
    },

    hide: function() {
        let menu = this._menu as HTMLElement;        
        menu.classList.add("invisible");
        menu.style.left = "-100pt";
        menu.style.top = "-100pt";
    },

    is_visible: function(): boolean {
        return (this._menu as HTMLElement).classList.contains("invisible");
    },

}

export default Menu;