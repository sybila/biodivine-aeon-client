
var RESULT = undefined;
var network = undefined;
var container = undefined;
var options = {
    edges: {
        arrows: {
            to: {enabled: true, type:'triangle'}
        },
        width: 0.7
    },
    nodes: {
        color: {
            border: '#3a568c',
            background: '#ffffff',
            highlight: {
                background: '#e5eeff',
                border: '#3a568c',
            }
        },
        font: {
            face: 'Fira Mono',
        },
        shape: 'box',
        labelHighlightBold: false,
        borderWidth: 1,
    },
    layout: {
        improvedLayout: false,
    },
};

function init() {
    container = document.getElementById('visjs-container');

	// Set engine address according to query parameter
	const urlParams = new URLSearchParams(window.location.search);
	const engineAddress = urlParams.get('engine');
	const reqBeh = urlParams.get('behavior');

	if (engineAddress !== undefined && engineAddress !== null && engineAddress.length > 0) {
		document.getElementById("engine-address").value = engineAddress;
        ComputeEngine._address = engineAddress;
	}	
    let callback = function(e, r) {
        if (e !== undefined) {
            alert(e);
        } else {
            RESULT = r;

            if(RESULT["has_large_attractors"]) {
                alert("Some attractors were too large to draw. These will be shown only as two states with the constant and non-constant variables differentiated.");
            }
            
            for (var i = 0; i < RESULT.attractors.length; i++) {
                RESULT.attractors[i].vis = edgesToVisFormat(RESULT.attractors[i].graph);
            }
            addLabels();
            displayAll();
            network.on('click', nodeClick); 
            document.getElementById('explorer-update-functions').innerHTML = generateWitness()
        }
    }
    // get the attractors    
    if (reqBeh !== undefined && reqBeh !== null) {
        var request = ComputeEngine._backendRequest('/get_attractors/' + reqBeh, callback, 'GET', null);
    } else {        
        const requestedTreeWitness = urlParams.get('tree_witness'); // Should be a node id.        
        if (requestedTreeWitness !== undefined && requestedTreeWitness !== null) {
            const requestedVariable = urlParams.get('variable');
            const requestedBehaviour = urlParams.get('behaviour');        
            const requestedVector = urlParams.get('vector');
            if(requestedVariable === undefined || requestedVariable === null || requestedVector === null) {
                // Just get node attractors
                var request = ComputeEngine._backendRequest('/get_tree_attractors/' + requestedTreeWitness, callback, 'GET', null);
            } else {
                // This is attractor stability query
                var request = ComputeEngine._backendRequest('/get_stability_attractors/' + requestedTreeWitness + '/' + encodeURI(requestedBehaviour) + '/' + encodeURI(requestedVariable) + '/' + encodeURI("["+requestedVector+"]"), callback, 'GET', null);
            }            
        }
    }

}

function nodeClick(e) {
    // the 'l' comes from the attractor labels that have to be ignored
    var panel = document.getElementById("explorer-valuations");
    var text  = document.getElementById("explorer-valuations-text");
    if (e.nodes.length != 1 || e.nodes[0][0] == 'l') {
        panel.style.display = 'none'; 
        return;
    }
    panel.style.display = 'block'; 
    console.log(e.nodes[0])
 
    document.getElementById("explorer-valuations-text").innerHTML = stateToHtml(e.nodes[0]);
    console.log(e.nodes)
}

function stateToHtml(state) {
    result = "";
    for (var i = 0; i < state.length; i++) {
        let is_false = (state[i] == "0" || state[i] == "⊥");
        let is_dynamic = (state[i] == "0" || state[i] == "1");
        result +=   '<span ' + 
                        'class="valuation-pair ' + (is_dynamic ? (is_false ? "red" : "green") : "grey") + '" ' +
                        'style="font-weight: ' + (is_dynamic ? "bold" : "normal") + '"' +
                    '>' + 
                    (is_false ? "!" : "") + RESULT.variables[i] + '</span>';
    }

    return result;
}

function generateWitness() {
    return RESULT.model.model.split('\n')
                 .filter(x => x[0] == '$')
                 .map(x => x.slice(1))
                 .map(x => x.split(':'))
                 .map(x => '<span class="explorer-fnName">'
                    + x[0].trim() + '</span><span class="explorer-fnValue">'
                    + x[1].trim() + '</span>')
                 .reverse()
                 .reduce((a, x) => '<li>' +x+ '</li>' + a, '');
}

function witnessPanelVisible(show = true) {
    document.getElementById('explorer-witness-panel').style.display =
        show? 'block': 'none';
}

function edgesToVisFormat(array) {
    var nodes = new Set();
    var edges = [];

    for (var i = 0; i < array.length; i++) {
        nodes.add(array[i][0]);
        nodes.add(array[i][1]);
        if (array[i][0] != array[i][1]) {
            edges.push({from: array[i][0], to: array[i][1]});
        }
    }

    return { edges, nodes: Array.from(nodes).map(x => ({id:x, label:x.replace(/[⊥⊤]/gi, "-")})) };
}

function showState(string) {
    for (var i = 0; i < string.length; i++) {
        console.log(RESULT.variables[i], (string[i] == '0' || string[i] == '⊥') ? 'false': 'true');
    }
}

function addLabels() { // adds symbol labels
    for (var i = 0; i < RESULT.attractors.length; i++) {
        const label = RESULT.attractors[i].class[0]; 
        RESULT.attractors[i].vis.nodes.push(
            { label, id: 'labelnode' + i, font:{face:'symbols', size: 40}, opacity:0, labelHighlightBold: false}
        );
        RESULT.attractors[i].vis.edges.push(
            { length: 20, from: 'labelnode' + i, to: RESULT.attractors[i].vis.nodes[0].id, color:{color:'#000000', opacity: 0.1}, arrows:{to:{enabled:false}} }
        );
    }
}

function displayAll() {
    var nodes = [];
    var edges = [];

    for (var i = 0; i < RESULT.attractors.length; i++) {
        nodes = nodes.concat(RESULT.attractors[i].vis.nodes);
        edges = edges.concat(RESULT.attractors[i].vis.edges);
    }

    network = new vis.Network(container, { nodes, edges }, options);
}

function displayGraph(index) { // displays just one attractor, not all of them
    network = new vis.Network(container, RESULT.attractors[index].vis, options);
}
