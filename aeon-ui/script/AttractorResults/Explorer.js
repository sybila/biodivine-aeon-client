let Explorer = {
    _loadedResult: undefined,
    _network: undefined,
    _container: undefined,
    _options: {
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
    },

    //Requests attractor explorer data from the compute engine and 
	openNewExplorer(behaviorData) {
		const splitBeh = behaviorData.split("&");

		let behavior = null;
		let treeWitness = null;
		let variable = null;
		let vector = null;

		let callback = function(e, r) {
            if (e !== undefined) {
                Warning.displayWarning(e);
            } else {
                Explorer._processData(r);
                TabBar.addTab("explorer", r);
            }
        }

		for (let i = 0; i < splitBeh.length; i++) {
			const dataSplit = splitBeh[i].split("=");

			if (dataSplit.length != 2) {
				if (i == 0 && dataSplit.length == 1 && dataSplit[0] != "") {
					behavior = dataSplit[0];
				}
				continue;
			}

			if (dataSplit[0] == "behavior") {
				behavior = dataSplit[1];
			} else if (dataSplit[0] == "tree_witness") {
				treeWitness = dataSplit[1];
			} else if (dataSplit[0] == "variable") {
				variable = dataSplit[1];
			} else if (dataSplit[0] == "vector") {
				vector = dataSplit[1];
			}
		}

		if (behavior != null) {
			ComputeEngine._backendRequest('/get_attractors/' + behavior, callback, 'GET', null);
		} else if (treeWitness != null) {
			if (variable === null || vector === null) {
				ComputeEngine._backendRequest('/get_tree_attractors/' + treeWitness, callback, 'GET', null);
			} else {
				ComputeEngine._backendRequest('/get_stability_attractors/' + treeWitness + '/' 
								+ encodeURI(behavior) + '/' + encodeURI(variable) + '/' 
									+ encodeURI("["+ vector +"]"), callback, 'GET', null);
			}
		}
	},

    //Processes results into form insertable into explorer-div
    _processData(results) {
        for (var i = 0; i < results.attractors.length; i++) {
            results.attractors[i].vis = this._edgesToVisFormat(results.attractors[i].graph);
        }

        this._addLabels(results);
        results.witness = this._generateWitness(results);
    },

    insertData(result) {
        this._loadedResult = result;

        if(this._loadedResult["has_large_attractors"]) {
            Warning.displayWarning("Some attractors were too large to draw. These will be shown only as two states with the constant and non-constant variables differentiated.");
        }

        this._displayAll();
        this._network.on('click', this._nodeClick); 
        document.getElementById('explorer-update-functions').innerHTML = this._loadedResult.witness;
    },

    _nodeClick(e) {
        // the 'l' comes from the attractor labels that have to be ignored
        var panel = document.getElementById("explorer-valuations");
        var text  = document.getElementById("explorer-valuations-text");
        if (e.nodes.length != 1 || e.nodes[0][0] == 'l') {
            panel.style.display = 'none'; 
            return;
        }

        panel.style.display = 'block'; 
        document.getElementById("explorer-valuations-text").innerHTML = Explorer._stateToHtml(e.nodes[0]);
    },

    _stateToHtml(state) {
        result = "";
        for (var i = 0; i < state.length; i++) {
            let is_false = (state[i] == "0" || state[i] == "⊥");
            let is_dynamic = (state[i] == "0" || state[i] == "1");
            result +=   '<span ' + 
                            'class="valuation-pair ' + (is_dynamic ? (is_false ? "red" : "green") : "grey") + '" ' +
                            'style="font-weight: ' + (is_dynamic ? "bold" : "normal") + '"' +
                        '>' + 
                        (is_false ? "!" : "") + this._loadedResult.variables[i] + '</span>';
        }

        return result;
    },

    _generateWitness(results) {
        return results.model.model.split('\n')
                    .filter(x => x[0] == '$')
                    .map(x => x.slice(1))
                    .map(x => x.split(':'))
                    .map(x => '<span class="explorer-fnName">'
                        + x[0].trim() + '</span><span class="explorer-fnValue">'
                        + x[1].trim() + '</span>')
                    .reverse()
                    .reduce((a, x) => '<li>' +x+ '</li>' + a, '');
    },

    witnessPanelVisible(show = true) {
        document.getElementById('explorer-witness-panel').style.display =
            show? 'block': 'none';
    },

    _edgesToVisFormat(array) {
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
    },

    showState(string) {
        for (var i = 0; i < string.length; i++) {
            console.log(this._loadedResult.variables[i], (string[i] == '0' || string[i] == '⊥') ? 'false': 'true');
        }
    },

     //Adds symbol labels
    _addLabels(results) {
        for (var i = 0; i < results.attractors.length; i++) {
            const label = results.attractors[i].class[0]; 
            results.attractors[i].vis.nodes.push(
                { label, id: 'labelnode' + i, font:{face:'symbols', size: 40}, opacity:0, labelHighlightBold: false}
            );
            results.attractors[i].vis.edges.push(
                { length: 20, from: 'labelnode' + i, to: results.attractors[i].vis.nodes[0].id, color:{color:'#000000', opacity: 0.1}, arrows:{to:{enabled:false}} }
            );
        }
    },

    //If this._container is undefined, then sets it.
    _setContainer() {
        if (this._container == undefined) {
            this._container = document.getElementById('visjs-container');
        }  
    },

    //Displays all attractors
    _displayAll() {
        var nodes = [];
        var edges = [];

        for (var i = 0; i < this._loadedResult.attractors.length; i++) {
            nodes = nodes.concat(this._loadedResult.attractors[i].vis.nodes);
            edges = edges.concat(this._loadedResult.attractors[i].vis.edges);
        }

        this._setContainer();
        this._network = new vis.Network(this._container, { nodes, edges }, this._options);
    },

    //Displays just one attractor, not all of them
    displayGraph(index) { 
        this._setContainer();
        this._network = new vis.Network(this._container, this._loadedResult.attractors[index].vis, this._options);
    },
}