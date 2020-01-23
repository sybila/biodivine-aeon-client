function init() {
	UI.init();
	ModelEditor.init();
	CytoscapeEditor.init();
	LiveModel.addVariable([10,10]);
	LiveModel.addVariable([0,0]);
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