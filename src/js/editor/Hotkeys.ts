import hotkeys from 'hotkeys-js';
import Events from './EditorEvents';
import EdgeMenu from './FloatingEdgeMenu';
import Cytoscape from './Cytoscape';
import Import from './Import';
import Panels from './Panels';

export function register() {
    hotkeys('o', function(event) {
        if (EdgeMenu.is_visible()) { 
            event.preventDefault();
            Events.click('selected-toggle-observability'); 
        }
    });

    hotkeys('m', function(event) {
        if (EdgeMenu.is_visible()) { 
            event.preventDefault();
            Events.click('selected-toggle-monotonicity'); 
        }
    });

    hotkeys('backspace', function(event) {
        if (Cytoscape.has_selection()) {
            event.preventDefault();
            Events.click('selected-remove');
        }
    });

    hotkeys('n', function(event) {
        event.preventDefault();
        Import.try_create_variable();
    });

    hotkeys('esc', function(event) {        
        if (Panels.is_open() !== undefined) {
            event.preventDefault();
            Events.panel.close(":selected");
        } else if (Cytoscape.has_selection()) {
            event.preventDefault();
            Cytoscape.clear_selection();
        }
    });

    hotkeys('ctrl+-', function(event) {
        console.log(event);
        event.preventDefault()
        Events.click('cytoscape-zoom-minus');
    });

    hotkeys('ctrl+=', function(event) {
        console.log(event);
        event.preventDefault()
        Events.click('cytoscape-zoom-plus');
    });


    hotkeys('ctrl+0', function(event) {
        event.preventDefault()
        Events.click('cytoscape-zoom-to-fit');
    });
}

export default register;