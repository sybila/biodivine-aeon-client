import { EdgeCollection, NodeSingular } from 'cytoscape';
import LiveModel from './../LiveModel';

export let EdgehandlesOptions: cytoscape.EdgeHandlesOptions = {
    preview: true,
    hoverDelay: 150,
    handleNodes: 'node[type = "variable"]',
    snap: false,
    snapThreshold: 50,
    snapFrequency: 15,
    noEdgeEventsInDraw: false,
    disableBrowserGestures: true, 
    nodeLoopOffset: -50,
    // The `+` button should be drawn on top of each node
    handlePosition: function() { return 'middle top'; },
    handleInDrawMode: false,
    edgeType: function(sourceNode: NodeSingular, targetNode: NodeSingular) {             
        // Workaround for https://github.com/cytoscape/cytoscape.js-edgehandles/issues/157
        let edges = sourceNode.edgesTo(targetNode); 
        if (edges.length > 0) {
            let is_fresh = edges[0].data().fresh === true;
            if (is_fresh) {
                return 'flat';            
            } else {
                return null;
            }            
        } else {
            return 'flat';
        }
    },
    // Loops are always allowed.
    loopAllowed: function() { return true; },	        
    // Initialize edge with a fresh marker.
    edgeParams: function() {
        return { data: { fresh: true }};
    },    
    complete: function(sourceNode: NodeSingular, targetNode: NodeSingular, addedEles: EdgeCollection) {        
        addedEles.remove(); // Remove the edge created by edgehandles (with the fresh marker) and add a proper one.
        LiveModel.ensureRegulation({
            source: sourceNode.id(),
            target: targetNode.id(),
            isObservable: true,
            monotonicity: "unknown"
        });        
    },
};

export default EdgehandlesOptions;