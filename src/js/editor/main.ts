import Dock from './Dock';
import Panels from './Panels';
import Cytoscape from './Cytoscape';
import Import from './Import';
import Examples from './ExampleModels';
import NodeMenu from './FloatingNodeMenu';
import EdgeMenu from './FloatingEdgeMenu';
import register_keys from './Hotkeys';
import Events, { ClickEvent } from './EditorEvents';

function init() {
    Dock.init(document.getElementById("editor-dock"));
    Panels.init(document.getElementById("editor-panels"));
    NodeMenu.init(document.getElementById("editor-floating-node-menu"));
    EdgeMenu.init(document.getElementById("editor-floating-edge-menu"));
    Cytoscape.init(document.getElementById("editor-cytoscape"));
    Examples.init(document.getElementById("editor-examples"));
    register_keys();    // Keyboard shortcuts

    /* Make every button with `data-clickable` emit event according to its value. */
    let buttons = document.getElementsByTagName("button");
    for (let i=0; i<buttons.length; i++) {
        let button = buttons[i];
        if (button.dataset.clickable !== undefined) {
            button.onclick = function() {                                             
                button.blur();  // clear focus
                Events.click((this as HTMLElement).dataset["event"] as ClickEvent);
            };
        }
    }

    Import.importAeonModel(Examples.g2a);
}

// fonts api is currently experimental, though widely supported.
if ((document as any).fonts === undefined) {
    init()
} else {
    (document as any).fonts.load('1rem "Anonymous Pro"').then(() => {
        init()
    });
}