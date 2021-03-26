import Dock from './Dock';
import Panels from './Panels';
import Cytoscape from './Cytoscape';
import Import from './Import';
import Examples from './ExampleModels';
import NodeMenu from './FloatingNodeMenu';
import EdgeMenu from './FloatingEdgeMenu';
import register_keys from './Hotkeys';
import Events, { ClickEvent } from './EditorEvents';
import EditorPanel from './ModelPanel';

function init() {
    Dock.init(document.getElementById("editor-dock"));
    Panels.init(document.getElementById("editor-panels"));
    NodeMenu.init(document.getElementById("editor-floating-node-menu"));
    EdgeMenu.init(document.getElementById("editor-floating-edge-menu"));
    Cytoscape.init(document.getElementById("editor-cytoscape"));
    Examples.init(document.getElementById("editor-examples"));
    register_keys();    // Keyboard shortcuts

    /* Make every button with `data-clickable` emit event according to its value. */
    document.querySelectorAll('[data-clickable]').forEach(function (node) {
        (node as HTMLElement).onclick = function() {
            let button = this as HTMLElement;
            button.blur();
            Events.click(button.dataset["event"] as ClickEvent);
        };        
    });

    document.querySelectorAll('[data-editable]').forEach(function (node) {    
        (node as HTMLElement).onblur = function() {
            let editable = this as HTMLElement;
            let text = editable.innerText.trim();
            if (text.length == 0) {
                text = editable.dataset["default"];
                editable.innerText = editable.dataset["default"];
            } else {
                editable.innerText = text;
            }
            console.log(text);         
            // TODO: Send event.
        };
    });


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