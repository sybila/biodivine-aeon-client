function init() {
	UI.init();
	ModelEditor.init();
	CytoscapeEditor.init();
	/*
	LiveModel.addVariable([10,100]);
	LiveModel.addVariable([0,0]);
	LiveModel.addRegulation(0, 1, false, EdgeMonotonicity.unspecified);
	*/
}

let Strings = {
	removeNodeCheck(name) {
		return "Dou you really want to remove '"+name+"'?";
	},
	invalidVariableName(name) {
		return "Cannot use '"+name+"' as variable name.";
	}
}

/*
	"Data types":
	id: Number
	regulation: {
		regulator: Id,
		target: Id,
		observable: bool,
		monotonicity: string from EdgeMonotonicity
	}
*/

hotkeys('e', function(event, handler) {	
	if (UI.isNodeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("node-menu-edit-name"), "click");
	}	
});

hotkeys('f', function(event, handler) {	
	if (UI.isNodeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("node-menu-edit-function"), "click");
	}	
});

hotkeys('r', function(event, handler) {	
	if (UI.isNodeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("node-menu-remove"), "click");
	}	
	if (UI.isEdgeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("edge-menu-remove"), "click");
	}
});

hotkeys('o', function(event, handler) {	
	if (UI.isEdgeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("edge-menu-observability"), "click");
	}	
});

hotkeys('m', function(event, handler) {	
	if (UI.isEdgeMenuVisible()) {
		event.preventDefault();
		fireEvent(document.getElementById("edge-menu-monotonicity"), "click");
	}	
});

hotkeys('ctrl+n', function(event, handler) {	
	event.preventDefault();
	LiveModel.addVariable();
});

// utility function to fire events on UI elements - we mainly need it to simulate clicks
function fireEvent(el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}