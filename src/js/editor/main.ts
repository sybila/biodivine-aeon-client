/*import Dock from './Dock';
import Panels from './Panels';
import Cytoscape from './Cytoscape';
import Import from './Import';
import Examples from './ExampleModels';
import NodeMenu from './FloatingNodeMenu';
import EdgeMenu from './FloatingEdgeMenu';
import register_keys from './Hotkeys';
import Events, { ClickEvent, EditorEvents, ValueEvent } from './EditorEvents';
import ModelPanel from './ModelPanel';*/
import UiBus from '../core/UiEvents';
import Model from './LiveModel';
import initPanels from './gui/panels';
import initImport from './gui/import';
import graph, { GraphEditor } from './cytoscape/GraphEditor';

function init() {
    UiBus.registerEvents(document);
    initImport();
    initPanels(document.getElementById('editor-panels'));
    console.log(graph);    
    
    /*Dock.init(document.getElementById("editor-dock"));
    Panels.init(document.getElementById("editor-panels"));
    NodeMenu.init(document.getElementById("editor-floating-node-menu"));
    EdgeMenu.init(document.getElementById("editor-floating-edge-menu"));
    Cytoscape.init(document.getElementById("editor-cytoscape"));
    Examples.init(document.getElementById("editor-examples"));
    ModelPanel.init(document.getElementById("editor-model-panel"));
    register_keys();    // Keyboard shortcuts

    // Make every button with `data-clickable` emit event according to its value.
    document.querySelectorAll('[data-clickable]').forEach(function (node) {
        (node as HTMLElement).onclick = function() {
            let button = this as HTMLElement;
            button.blur();
            Events.click(button.dataset["event"] as ClickEvent);
        };        
    });

    document.querySelectorAll('[data-editable]').forEach(function (node) {
        let input = node as HTMLElement;
        // When value changes, publish event.
        input.onblur = function() {
            let editable = this as HTMLElement;
            let text = editable.innerText.trim();
            if (text.length == 0) {
                text = editable.dataset["default"];
                editable.innerHTML = editable.dataset["default"];
            }
            EditorEvents.value(editable.dataset["event"] as ValueEvent, editable.innerHTML);            
        };

        EditorEvents.onValue(input.dataset["event"] as ValueEvent, (value) => {
            input.innerHTML = value;
        });
    });


    Import.importAeonModel(Examples.g2a);*/
}

// Fonts api is currently experimental, though widely supported.
if ((document as any).fonts === undefined) {
    init()
} else {
    // If possible, wait for fonts to load, because otherwise cytoscape
    // may render them weirdly.
    (document as any).fonts.load('1rem "Anonymous Pro"').then(() => {
        init()
    });
}