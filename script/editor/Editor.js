

function main() {
	Dock.init(document.getElementById("editor-dock"));
	Panels.init(document.getElementById("editor-panels"));

	// Wait for font initialization, because if they are not loaded
	// before cytoscape is started, it will not rended them properly.
	document.fonts.load('1rem "Anonymous Pro"').then(() => {
		Cytoscape.init(document.getElementById("editor-cytoscape"));
	});	
}