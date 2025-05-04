/** Object for resposible for the functionality of the control-results-div.
 *  Contains mostly functions for insertion and filtering of the calculated perturbations. */
let ControlResults = {
    _perturbTable: undefined,
    _filterMenu: undefined,

    /** Functions used for insertion of data into the ControlResults._perturbTable. */
    initTable: {
        /** Converts perturbation in the form of {variableName:phenotypeValue,...} to string "variableName:phenotypeValue, ..." */
        _perturbationToString(pert) {
            let resultStr = "";
            const variables = Object.keys(pert);

            if (variables.length < 1) {
                return "{}";
            }

            for (let i = 0; i < variables.length; i++) {
                resultStr += variables[i];

                if (pert[variables[i]] == true) {
                    resultStr += ":true";
                } else if (pert[variables[i]] == false) {
                    resultStr += ":false";
                } else {
                    resultStr += ":null";
                }

                if (i != variables.length - 1) {
                    resultStr += ", ";
                }
            }

            return resultStr
        },

        /** Toggles oncklick between content displayed in the contentDiv div.
         *  Original content is saved  in the "cont" attribute, the new content is saved in the "clickCont" attribute.*/
        _changeContentMode(contentDiv) {
            if (contentDiv.getAttribute("clickShown") == "true") {
                contentDiv.innerHTML = contentDiv.getAttribute("cont");
                contentDiv.setAttribute("clickShown", false);
            } else {
                contentDiv.innerHTML = contentDiv.getAttribute("clickCont");
                contentDiv.setAttribute("clickShown", true);
            }
        },

        /** Creates and appends cell into the row of the table.
         If clickcontent is not null, then the content and click content is switched on the click on the cell. */
        _appendCell(row, content, clickContent, width) {
            const cell = row.insertCell(-1);

            cell.style.width = width;
            cell.style.maxWidth = width;
            cell.style.overflow = "hidden";
            cell.style.borderStyle = "solid";
            cell.style.borderWidth = "1px 1px 0px 1px";

            const contentDiv = document.createElement("div");
            contentDiv.classList.add("table-div");
            contentDiv.innerHTML = content;

            if (clickContent != null) {
                contentDiv.setAttribute("cont", content);
                contentDiv.setAttribute("clickCont", clickContent);
                contentDiv.setAttribute("clickShown", false);

                cell.addEventListener("click", () => {
                    this._changeContentMode(contentDiv);
                })
            }

            cell.appendChild(contentDiv);
        },

        /** Fills table with perturbations and data about them.
         *  Perts is array of perturbation objects {robustness: pertRobustness, color_count:numberOfParametrizations ,perturbation: {varName:pertValue,...}}. */
        _fillTable(perts) {
            let id = 1;

            for (const pert of perts) {
                const row = ControlResults._perturbTable.insertRow(-1);

                row.style.overflow = "auto";
                row.style.maxWidth = "100%";
                row.style.width = "100%";

                row.setAttribute('data-id', id);
                row.setAttribute('perturb', JSON.stringify(pert.perturbation));

                this._appendCell(row, id, null, "6%");
                this._appendCell(row, ControlResults._createColouredVars(pert.perturbation), this._perturbationToString(pert.perturbation), "70%");
                this._appendCell(row, Object.keys(pert.perturbation).length, null, "6%");
                this._appendCell(row, pert.color_count, null, "13%");
                this._appendCell(row, pert.robustness < 0.0001 ? "<0.00%" : (pert.robustness * 100).toFixed(2), null, "5%");

                id += 1;
            };
        },
    },

    /** Functions and properties used for sorting of the perturbations in the ControlResults._perturbTable. */
    sortTable: {
        _sortMode: undefined,
        _orderArrows: undefined,

        /** Comparator for the sorting function.
         a + b are compared rows.
        primaryIndex + secondaryIndex are indexes of cells by which the rows will be sorted.
        orderLevelIndex determines if we are sorting by primary ordering parameters or secondary.*/
        _comparator(a, b, primaryIndex, secondaryIndex, orderLevelIndex) {
            if (a.getAttribute("data-id") == null) {
                return -1;
            } 

            if (b.getAttribute("data-id") == null) {
                return 1;
            }

            const result = a.getElementsByTagName('td')[primaryIndex].textContent
                            - b.getElementsByTagName('td')[primaryIndex].textContent;
            
            if (orderLevelIndex != 1 && result == 0) {
                return this._comparator(a, b, secondaryIndex, undefined, 1);
            }

            const reverseOrder = this._orderArrows[orderLevelIndex].classList.contains("down") ? -1 : 1;
            return reverseOrder * result;
        },


        /** Returns index of cell in the table depending on the set sorting mode.
        Sort index (int 0-1) determines if we want primary or secondary sorting mode. */
        _getSortCellIndex(sortIndex) {
            switch (this._sortMode[sortIndex].value) {
                case "ID":
                    return 0;
                case "Size":
                    return 2;
                default:
                    return 3;
            }
        },

        /** Sorts rows of the table by set sort modes and order. */
        _sortRows() {
            const primaryIndex = this._getSortCellIndex(0);
            const secondaryIndex = this._getSortCellIndex(1);

            const sortedRows = Array.from(ControlResults._perturbTable.rows)
                                    .sort((a, b) => this._comparator(a, b, primaryIndex, secondaryIndex, 0));
            ControlResults._perturbTable.innerHTML = '';
            
            for (let row of sortedRows) {
                ControlResults._perturbTable.appendChild(row);
            }
        },

        /** Switches the by which cell is the table sorted and sorts it. */
        switchSortMode(buttonID) {
            switch (this._sortMode[buttonID].value) {
                case "ID":
                    this._sortMode[buttonID].value = "Size";
                    break;
                case "Size": 
                    this._sortMode[buttonID].value = "NoI";
                    break;
                default:
                    this._sortMode[buttonID].value = "ID";
                    break;
            }

            //Changes color of the secondary order arrow to signal if the secondary sorting is available.
            if (this._sortMode[0].value == "ID" || this._sortMode[0].value == this._sortMode[1].value) {
                this._orderArrows[1].style.borderColor = "#808080";
            } else {
                this._orderArrows[1].style.borderColor = "#FCA101";
            }

            this._sortRows();
        },

        /** Switches the sorting order between ascending/descending and sorts the table.*/
        switchOrder(buttonID) {
            if (this._orderArrows[buttonID].classList.contains("down")) {
                this._orderArrows[buttonID].classList.remove("down");
                this._orderArrows[buttonID].classList.add("up");
            } else {
                this._orderArrows[buttonID].classList.remove("up");
                this._orderArrows[buttonID].classList.add("down");
            }

            this._sortRows();
        },
    },

    /** Functions and properties used for filtering of the ControlResults._perturbTable. */
    filterTable: {
        /** Saves all filter inputs into one array. ([0] = perturbation, [1] = maximal size,
                                            [2] = minimal number of parametrizations, [3] = minimal robustness)*/
        _filters: undefined,
        _pertFilterTable:undefined,
        _pertFilterValues: undefined,


        /** Sets values of all selected rows in the this._pertFilterTable to the value of pertValue ("ignore", "present", "true", "false"). */
        setSelected(pertValue) {
            if (pertValue == "true") {
                pertValue = true;
            } else if (pertValue == "false") {
                pertValue = false;
            }

            for (row of this._pertFilterTable.table.rows) {
                if (row.classList.contains('selected')) {
                    const id = row.getAttribute('data-id');
                    this._pertFilterValues[id] = pertValue;
                    const color = pertValue == 'ignore' ? "#ECEFF1" : pertValue == 'present' ? "#B0BEC5" : pertValue == true ? "green" : "red";
                    this._pertFilterTable.changeIndicatorColor(id, color);
                }
            }

            this.filterTable();
        },

        /** Change selected class of all rhis._pertFilterTable table rows. 
        *  if deselect (boolean) is true then selects all, else deselects all.
        */
        changeSelectedAll(deselect) {
            this._pertFilterTable.changeSelectedAll(deselect);
        },

        /** Function for filtering variables in the this._pertFilterTable  */
        filterPertFilterTable() {
            this._pertFilterTable.filterTable();
        },

        /** Converts number in the form of string into integer. Returns undefined if stringNum is empty or not a number.*/
        _convertToNumber(stringNum) {
            const num = Number(stringNum);

            return stringNum == "" || isNaN(num) || !isFinite(num) ? undefined : num;
        },

        /** Tests if perturbation includes variables. */
        _includesPerts(perts, include) {
            for (const variable in include) {
                if (include[variable] != "ignore" && 
                    (perts[variable] == undefined ||
                        (include[variable] != "present" && perts[variable] != include[variable]))) {
                    return false;
                }
            }

            return true;
        },
        
        /** Filters data from the table depending on input of all filter inputs. */
        filterTable() {
            const filterValues = [  this._pertFilterValues,
                                    this._convertToNumber(this._filters[0].value), 
                                    this._convertToNumber(this._filters[1].value),
                                    this._convertToNumber(this._filters[2].value)];

            for (const row of ControlResults._perturbTable.rows) {
                const cells = row.getElementsByTagName('td');
                
                if (!this._includesPerts(JSON.parse(row.getAttribute('perturb')), filterValues[0]) ||
                        filterValues[1] < Number(cells[2].textContent) ||
                            filterValues[2] > Number(cells[3].textContent) ||
                                filterValues[3] > Number(cells[4].textContent)) {
                    row.style.display = "none";
                } else {
                    row.style.display = "";
                }
            };
        },
    },

    init() {
        this._perturbTable = document.getElementById("control-results-table").getElementsByTagName("tbody")[0];
 
        this.filterTable._filters = [document.getElementById("controlr-size-filter"),
                            document.getElementById("controlr-NoI-filter"),
                                document.getElementById("controlr-rob-filter")];

        this.sortTable._sortMode = [document.getElementById("primary-sort-switch"), document.getElementById("secondary-sort-switch")];
        this.sortTable._orderArrows = [document.getElementById("control-res-primary-arrow"), document.getElementById("control-res-secondary-arrow")];
        this._filterMenu = document.getElementById("control-res-filters");
        this.filterTable._pertFilterTable = new TableWidget(document.getElementById("control-pert-filter-table"),
                                                    document.getElementById("control-pert-filter-input"));
        this.filterTable._pertFilterValues = {};
    },

    /** Creates string of variables coloured by their phenotype/perturbation value. */
    _createColouredVars(variables) {
        let resultStr = "";

        for (const variable in variables) {
            if (variables[variable] == true) {
                resultStr += `<span style="color: green; line-height: 10px; white-space: nowrap;">${variable}</span>`
            } else {
                resultStr += `<span style="color: red; line-height: 10px; white-space: nowrap;">${variable}</span>`
            }

            resultStr += ", ";
        }

        return resultStr == "" ? "{}" : resultStr.substring(0, resultStr.length - 2);
    },

    /** Inserts control data into the stats widget and perturbations into the ControlResults._perturbTable.
     *  controlData is object {stats:{allColorsCount:int, perturbationCount:int, minimalPerturbationSize: int,
     *  maximalPerturbationRobustness:float, oscillation:string, phenotype:{varName:phenValue}, controllable:contrVarNamesArray} ,results:perturbationsArray}
     */
    insertData(controlData) {
        this._perturbTable.innerHTML = "";
        this.filterTable._pertFilterTable.clear();
        document.getElementById("InterNumberStat").textContent = controlData.stats.allColorsCount;
        document.getElementById("PertNumberStat").textContent = controlData.stats.perturbationCount;
        document.getElementById("MinSizeStat").textContent = controlData.stats.minimalPerturbationSize;
        document.getElementById("MaxRobStat").textContent = controlData.stats.maximalPerturbationRobustness < 0.0001 ? "<0.00%" : 
                                                                `${(controlData.stats.maximalPerturbationRobustness * 100).toFixed(2)}%`;
        document.getElementById("OscillationStat").textContent = controlData.stats.oscillation;
        document.getElementById("PhenotypeStat").innerHTML = this._createColouredVars(controlData.stats.phenotype);
        document.getElementById("ControllableStat").textContent = controlData.stats.controllable;

        for (variable of controlData.stats.controllable) {
            this.filterTable._pertFilterValues[variable] = "ignore";
            this.filterTable._pertFilterTable.addVariable(variable, variable, "phenotype");
        }
        const tableHead = document.getElementById("control-table-head");
        const tableDiv = document.getElementById("control-table-container");
        const table = document.getElementById("control-results-table");

        if (tableDiv.clientWidth != 0 && tableDiv.offsetWidth != 0) {
            const width = tableDiv.clientWidth / tableDiv.offsetWidth * 100;
            tableHead.style.maxWidth = `${width}px`;
            tableHead.style.width =`${width}px`;
            table.style.maxWidth = `${width}vw`;
            table.style.width =`${width}vw`;
        }
        
        this.initTable._fillTable(controlData.results);
    },

    /** Changes content mode of all the perturbations in the table.
     *  button is the element which caused the call of this function.
     *  (its "colorShown" attribute saves which content mode is now displayed
     *  (true if color form, else text form varName:phenValue, ...))
    */
    changeContentModeAllPerts(button) {
        const colorShown = button.getAttribute("colorShown");

        for (const row of this._perturbTable.rows) {
            const pertDiv = row.children[1].children[0];
            pertDiv.setAttribute("clickShown", colorShown);
            this.initTable._changeContentMode(pertDiv);
        }

        button.setAttribute("colorShown", !(button.getAttribute("colorShown") == "true"));
    },

    /** Toggles visibility of the ControlResults._filterMenu. */
    toggleFilters() {
        this._filterMenu.style.display = this._filterMenu.style.display == "none" ? "" : "none";
        UI.Visible.showHideManual("manual-control-results", null, null, "");
    },
}