import Dock from './Dock';
import Panels from './Panels';
import Cytoscape from './Cytoscape';
import Events from './EditorEvents';
import Import from './Import';
import NodeMenu from './FloatingNodeMenu';
import EdgeMenu from './FloatingEdgeMenu';
import register_keys from './Hotkeys';

import * as aeon from 'aeon-wasm';

let g2a = `
#position:CtrA:419,94
$CtrA:((((!CtrA & GcrA) & !CcrM) & !SciP) | ((CtrA & !CcrM) & !SciP))
CtrA -?? CtrA
GcrA -> CtrA
CcrM -| CtrA
SciP -| CtrA
#position:GcrA:325,135
$GcrA:(!CtrA & DnaA)
CtrA -| GcrA
DnaA -> GcrA
#position:CcrM:462,222
$CcrM:((CtrA & !CcrM) & !SciP)
CtrA -> CcrM
CcrM -| CcrM
SciP -| CcrM
#position:SciP:506,133
$SciP:(CtrA & !DnaA)
CtrA -> SciP
DnaA -| SciP
#position:DnaA:374,224
$DnaA:(((CtrA & !GcrA) & !DnaA) & CcrM)
CtrA -> DnaA
GcrA -| DnaA
DnaA -| DnaA
CcrM -> DnaA
`

Dock.init(document.getElementById("editor-dock"));
Panels.init(document.getElementById("editor-panels"));
NodeMenu.init(document.getElementById("editor-floating-node-menu"));
EdgeMenu.init(document.getElementById("editor-floating-edge-menu"));
register_keys();

// fonts api is currently experimental, though widely supported.
if ((document as any).fonts === undefined) {
    Cytoscape.init(document.getElementById("editor-cytoscape"));
} else {
    (document as any).fonts.load('1rem "Anonymous Pro"').then(() => {
        Cytoscape.init(document.getElementById("editor-cytoscape"));

        Import.importAeonModel(g2a);
    });
}