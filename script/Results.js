let Results = {	

	clear() {
		document.getElementById("results").innerHTML = "";
	},

	hasResults() {
		return document.getElementById("results").getElementsByClassName("table-head").length > 0;
	},

	download() {
		console.log("Download...")
		UI.isLoading(true);
		ComputeEngine.getResults((e, json) => {
			UI.isLoading(false);
			ComputeEngine.waitingForResult = false;
			if (e !== undefined) {
				alert(e);
			} else {
		        let result = json.data.sort((a, b) => b.sat_count - a.sat_count);
		        if (!result) {
		            return false;
		        }

		        const paramsNum = result.reduce((acc, curr) => acc + curr.sat_count, 0);
		        //DomElements.statusPanels.result.innerText = 'total parametrizations: ' + paramsNum;

		        var table = '';
		        result.forEach(({ sat_count, phenotype })=> {
		            var behavior = phenotype.map(x => x[0]).sort().join('');
		            table += `
		            	<tr>
		            		<td class="table-behavior">${behavior}</td>
		            		<td class="table-sat-count">${sat_count}</td>
		            		<td><span class="inline-button" onclick="UI.openWitness('${behavior}');">Witness</span></td>
		            	</tr>
		            `;
		        });

		        table = `
		        	<table>
		        		<tr class='table-head'>
		        			<td>Behavior<br>class</td>
		        			<td>Witness<br>count</td>
		        			<td></td>
		        		</tr>
		        		${table}
		        	</table>
		        `;
		        if (json.isPartial) {
		        	table = "<h4 class='orange' style='text-align:center;'>Warning: These are partial results from an unfinished computation.</h4>" + table;
		        }
		        document.getElementById("results").innerHTML = table;
		        UI.ensureContentTabOpen(ContentTabs.results);
			}
		});
	},

}