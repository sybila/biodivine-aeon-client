/** Object which contains initializer methods for different pages.
 *  Also contains utility functions for these initializers. */
let InitHotkeys = {
    /** Function initializing hotkeys for the tree explorer. */
    initTreeHotkeys() {
        // Keyboard shortcuts for basic navigation:
        hotkeys('up', function(event, handler) {	
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                CytoscapeTreeEditor.selectNode("0");	
            } else {
                let parent = CytoscapeTreeEditor.getParentNode(selected);
                if (parent == undefined) { return; }
                CytoscapeTreeEditor.selectNode(parent);
                event.preventDefault();
            }	
        });

        hotkeys('left', function(event, handler) {
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                CytoscapeTreeEditor.selectNode("0");	
            } else {

                let sibling = CytoscapeTreeEditor.getSiblingNode(selected);
                if (sibling == undefined) { return; }
                CytoscapeTreeEditor.selectNode(sibling);
                event.preventDefault();
            }	
        });

        hotkeys('right', function(event, handler) {
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                CytoscapeTreeEditor.selectNode("0");	
            } else {
                let sibling = CytoscapeTreeEditor.getSiblingNode(selected);
                if (sibling == undefined) { return; }
                CytoscapeTreeEditor.selectNode(sibling);
                event.preventDefault();
            }	
        });

        hotkeys('down', function(event, handler) {
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                CytoscapeTreeEditor.selectNode("0");	
            } else {
                let child = CytoscapeTreeEditor.getChildNode(selected, true);
                if (child == undefined) { return; }
                CytoscapeTreeEditor.selectNode(child);
                event.preventDefault();
            }	
        });

        hotkeys('shift+down', function(event, handler) {
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                CytoscapeTreeEditor.selectNode("0");	
            } else {
                let child = CytoscapeTreeEditor.getChildNode(selected, false);
                if (child == undefined) { return; }
                CytoscapeTreeEditor.selectNode(child);
                event.preventDefault();
            }	
        });

        hotkeys('backspace', function(event, handler) {	
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected !== undefined && CytoscapeTreeEditor.getNodeType(selected) == "decision") {
                event.preventDefault();
                if (confirm("Delete this node?")) {
                    TreeExplorer.removeNode(selected);		
                }		
            }	
        });

        hotkeys('h', { keyup: true }, function(event, handler) {
            if (event.type === 'keydown') {
                document.getElementById("quick-help-tree-explorer").classList.remove("gone");
            }
            if (event.type === 'keyup') {
                document.getElementById("quick-help-tree-explorer").classList.add("gone");
            }	
        });

        hotkeys('s', function(event, handler) {
            let panel = document.getElementById("mixed-info");
            if (!panel.classList.contains("gone")) {
                InitHotkeys.fireEvent(document.getElementById("mixed-stability-analysis-button"), "click");
            }

            panel = document.getElementById("decision-info");
            if (!panel.classList.contains("gone")) {
                InitHotkeys.fireEvent(document.getElementById("decision-stability-analysis-button"), "click");
            }

            panel = document.getElementById("leaf-info");
            if (!panel.classList.contains("gone")) {
                InitHotkeys.fireEvent(document.getElementById("leaf-stability-analysis-button"), "click");
            }
        });

        hotkeys('d', function(event, handler) {
            let panel = document.getElementById("mixed-info");
            if (!panel.classList.contains("gone")) {
                InitHotkeys.fireEvent(document.getElementById("make-decision-button"), "click");
            }
        })

        // add extra spacing
        hotkeys("k", function(event, handler) {
            event.preventDefault();
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                return false;
            }
            TreeExplorer._moveNode(selected, 1)
            return false;
        });

        // subtract extra spacing
        hotkeys("i", function(event, handler) {
            event.preventDefault();
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                return false;
            }
            TreeExplorer._moveNode(selected, -1)
            return false;
        });

        // switch selected and sibling's order
        hotkeys("j, l", function(event, handler) {
            event.preventDefault();
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                return false;
            }
            let parent = CytoscapeTreeEditor.getParentNode(selected);
            if (parent == undefined) { 
                return false;
            }
            const switchedIds = CytoscapeTreeEditor.layoutSettings.switchChildren;
            if (!switchedIds.delete(parent)) {
                switchedIds.add(parent);
            }
            CytoscapeTreeEditor.applyTreeLayout();
            return false;
        });

        // switch children's order
        hotkeys("r", function(event, handler) {
            event.preventDefault();
            let selected = CytoscapeTreeEditor.getSelectedNodeId();
            if (selected == undefined) {
                return false;
            }
            const switchedIds = CytoscapeTreeEditor.layoutSettings.switchChildren;
            if (!switchedIds.delete(selected)) {
                switchedIds.add(selected);
            }
            CytoscapeTreeEditor.applyTreeLayout();
            return false;
        });

        hotkeys("f", function(event, handler) {
            event.preventDefault();
            CytoscapeTreeEditor.fit();
            return false
        });
    },

    /** Function initializing hotkeys for the model editor canvas. */
    initCanvasHotkeys() {
        hotkeys('e', function(event, handler) {	
            if (UI.Visible.isNodeMenuVisible()) {
                event.preventDefault();
                InitHotkeys.fireEvent(document.getElementById("node-menu-edit-name"), "click");
            }	
        });
        
        hotkeys('f', function(event, handler) {	
            if (UI.Visible.isNodeMenuVisible()) {
                event.preventDefault();
                InitHotkeys.fireEvent(document.getElementById("node-menu-edit-function"), "click");
            }	
        });

        hotkeys('c', function(event, handler) {	
            const variable = LiveModel.Variables.variableFromId(CytoscapeEditor.getSelectedNodeId());

            if (variable != undefined && variable != null) {
                event.preventDefault();
                LiveModel.Control.changeControllableById(variable.id, !variable.controllable);
            }
        });

        hotkeys('d', function(event, handler) {
            event.preventDefault();
            InitHotkeys._changePhenotype(true);
        });

        hotkeys('s', function(event, handler) {	
            event.preventDefault();
            InitHotkeys._changePhenotype(false);
        });
        
        hotkeys('a', function(event, handler) {	
            event.preventDefault();
            InitHotkeys._changePhenotype(null);
        });
        
        hotkeys('backspace', function(event, handler) {	
            if (UI.Visible.isNodeMenuVisible()) {
                event.preventDefault();
                InitHotkeys.fireEvent(document.getElementById("node-menu-remove"), "click");
            }	
            if (UI.Visible.isEdgeMenuVisible()) {
                event.preventDefault();
                InitHotkeys.fireEvent(document.getElementById("edge-menu-remove"), "click");
            }
        });
        
        hotkeys('o', function(event, handler) {	
            if (UI.Visible.isEdgeMenuVisible()) {
                event.preventDefault();
                InitHotkeys.fireEvent(document.getElementById("edge-menu-observability"), "click");
            }	
        });
        
        hotkeys('m', function(event, handler) {	
            if (UI.Visible.isEdgeMenuVisible()) {
                event.preventDefault();
                InitHotkeys.fireEvent(document.getElementById("edge-menu-monotonicity"), "click");
            }	
        });
        
        hotkeys('n,+', function(event, handler) {	
            event.preventDefault();
            let id = LiveModel.Variables.addVariable(false);
            CytoscapeEditor.showNode(id);
        });
        
        hotkeys('h', { keyup: true }, function(event, handler) {
            if (event.type === 'keydown') {
                UI.Visible.setQuickHelpVisible(true);
            }
            if (event.type === 'keyup') {
                UI.Visible.setQuickHelpVisible(false);
            }	
        });
    },

    /** Gets selected variable from CytoscapeEditor and changes its phenotype value to the one defined by phenValue. */
    _changePhenotype(phenValue) {
        const variable = LiveModel.Variables.variableFromId(CytoscapeEditor.getSelectedNodeId());

        if (variable != undefined && variable != null) {
            LiveModel.Control.changePhenotypeById(variable.id, phenValue);
        }
    },

    /** Utility function to fire events on UI elements - we mainly need it to simulate clicks */
    fireEvent(el, etype){
        if (el.fireEvent) {
            el.fireEvent('on' + etype);
        } else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
    }
    },

    /** New method to disable all hotkeys */
	disableHotkeys() {
		hotkeys.unbind();
	},
}

