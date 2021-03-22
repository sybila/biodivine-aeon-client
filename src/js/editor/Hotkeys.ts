import hotkeys from 'hotkeys-js';
import Events from './EditorEvents';
import EdgeMenu from './FloatingEdgeMenu';
import Cytoscape from './Cytoscape';
import Import from './Import';

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

    hotkeys('n,+', function(event) {
        event.preventDefault();
        Import.try_create_variable();
    });
}

export default register;