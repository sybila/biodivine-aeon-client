let Results = {
	//Divs for different possible results, 
	emptyResults: undefined,
	attractorResults: undefined,
	controlResults: undefined,

	//Divs where the computed data are inserted
	attractorInput: undefined,
	controlInput: undefined,

	/** Currently loaded results in the form {"type": ResultsType, "data": resultsData} */
	loadedResults: undefined,

	init() {
		this.emptyResults = document.getElementById("empty-results");
		this.attractorResults = document.getElementById("attractor-results");
		this.controlResults = document.getElementById("control-results");

		this.attractorInput = document.getElementById("attractor-results-input");
		this.controlInput = document.getElementById("control-results-input");
		this.loadedResults = null;
	},

	/** Inserts result information for attractor analysis. */
	_insertAttractorRes(res) {
		let result = res.data.sort((a, b) => b.sat_count - a.sat_count);
		if (!result) {
			return false;
		}

		const paramsNum = result.reduce((acc, curr) => acc + curr.sat_count, 0);
		//DomElements.statusPanels.result.innerText = 'total parametrizations: ' + paramsNum;

		var table = '';

		result.forEach(({ sat_count, phenotype })=> {
			var behavior = phenotype.map(x => x[0]).sort().join('');
			let behaviorString = behavior;
			if (behaviorString == 0) {
				behaviorString = "<span style=\"font-family: 'FiraMono'; letter-spacing: normal;\">unclassified</span>";
			}
			table += `
				<tr>
					<td class="table-behavior">${behaviorString}</td>
					<td class="table-sat-count">${sat_count}</td>
					<td><span class="inline-button" onclick="UI.Open.openWitness('${behavior}');">Witness</span></td>
					<td><span class="inline-button" onclick="UI.Open.openExplorer('${behavior}');">Attractor</span></td>
				</tr>
			`;
		});

		table = `
			<div class="center">Total number of classes: ${result.length}</div>
			<table>
				<tr class='table-head'>
					<td>Behavior<br>class</td>
					<td>Witness<br>count</td>
					<td></td>
				</tr>
				${table}
			</table>
		`;
		if (res.isPartial) {	// if the computation is not finished, add 
			table = "<h4 class='orange' style='text-align:center;'>Warning: These are partial results from an unfinished computation.</h4>" + table;
		} else {
			table = "<div class='center'>Elapsed: " + (res.elapsed/1000) + "s</div>" + table;
		}

		this.attractorInput.innerHTML = table;
		this.emptyResults.style.display = "none";
		this.controlResults.style.display = "none";
		this.attractorResults.style.display = "";
		document.getElementById("open-tree-explorer").classList.remove("gone");
		UI.Visible.ensureContentTabOpen(ContentTabs.results);
	},

	/** Inserts result information for control.*/
	_insertControlRes(res) {
		this.controlInput.innerHTML = `<table>
											<tr class="row"> <td style="text-align: left;">Elapsed: </td> <td class="value">${UI.UpdateStatus._getTime(res.stats.elapsed, true)}</td>
											<tr class="row"> <td style="text-align: left;">Number of Interpretations: </td> <td class="value">${res.stats.allColorsCount}</td>
											<tr class="row"> <td style="text-align: left;">Number of Perturbations: </td>  <td class="value">${res.stats.perturbationCount}</td>
											<tr class="row"> <td style="text-align: left;">Minimal Size: </td>  <td class="value">${res.stats.minimalPerturbationSize}</td>
											<tr class="row"> <td style="text-align: left;">Maximal Robustness: </td>  <td class="value">${res.stats.maximalPerturbationRobustness < 0.0001 ? '<0.00' :
																																			 (res.stats.maximalPerturbationRobustness * 100).toFixed(2)}%</td>
											<tr class="row"> <td style="text-align: left;">Oscillation: </td> <td class="value">${res.stats.oscillation}</td>
										</table>
									   `;
								   
		this.emptyResults.style.display = "none"
		this.attractorResults.style.display = "none";
		this.controlResults.style.display = "";
		UI.Visible.ensureContentTabOpen(ContentTabs.results);
	},

	/** Imports results from results object {"type": resultType, "data":resultData}. */
	importResults(results) {
		if (results.type != undefined && results.data != undefined) {
			if (results.type == "attractor") {
				this._insertAttractorRes(results.data);
			} else if (results.type == "control") {
				this._insertControlRes(results.data);
			}

			this.loadedResults = results;
			LiveModel.Export.saveModel();
		}
	},

	/** Adds new data to the stats object of the control results. (oscillation, phenotype, controllable variables) */
	_completeControlStats(stats) {
		stats.oscillation = PhenotypeEditor.getOscillation();

		stats.phenotype = {};
		stats.controllable = [];
		LiveModel.Variables.getAllVariables().forEach((variable) => {
			if (variable.phenotype == true || variable.phenotype == false) {
				stats.phenotype[variable.name] = variable.phenotype;
			};

			if (variable.controllable == true) {
				stats.controllable.push(variable.name);
			}
		})
	},

	openControlTab() {
		if (this.loadedResults.data.stats.perturbationCount > 1000) {
			Warning.displayWarning("tooManyControlRes");
		} else {
			TabBar.addTab('control results', Results.loadedResults.data);
		}
	},

	/** Gets results from the ComputeEngine and inserts them into results module. */
	download() {
		console.log("Download...")
		UI.isLoading(true);
		ComputeEngine.Results.getResults((e, type, resultData) => {
			UI.isLoading(false);
			ComputeEngine.Computation.waitingForResult = false;
			if (e !== undefined) {
				Warning.displayWarning(e);
			} else {
				if (type == "control") {
					this._completeControlStats(resultData.stats);
				}
				this.importResults({"type":type, "data":resultData});
			}
		});
	},

	/** Exports results into string '#results:ResultType:ResultJson\n'.
	Returns empty string if there are no results. */
	exportResults() {
		if (this.loadedResults == undefined) {
			return "";
		}

		return "#!results:" + this.loadedResults.type + ":" + JSON.stringify(this.loadedResults.data) + "\n";
	},

	/** Exports results into .csv.
	 *  'id, perturbation, size, parametrizations, rob(%)'
	*/
	exportControlResCsv() {
		if (this.loadedResults.type != "control") {
			return null;
		}

		let id = 1;
		let csvContent = "id, perturbation, size, parametrizations, rob(%)\n";

		for (pert of this.loadedResults.data.results) {
			csvContent += `${id},`;
			const variables = Object.keys(pert.perturbation);

			for (variable of variables) {
				csvContent += `${variable}:${pert.perturbation[variable]} `
			}

			csvContent.trimEnd();
			csvContent += `,${variables.length},${pert.color_count},${pert.robustness * 100}\n`;

			id += 1;
		}

		return csvContent;
	},

	/** Resets results module to its initial state. */
	clear() {
		document.getElementById("open-tree-explorer").classList.add("gone");
		this.emptyResults.style.display = "";
		this.attractorResults.style.display = "none";
		this.controlResults.style.display = "none";
		this.controlInput.innerHTML = "";
		this.attractorInput.innerHTML = "";
	},

	/** Returns true if results module displays non empty results page. */
	hasResults() {
		return this.emptyResults.style.display == "none";
	},
}
