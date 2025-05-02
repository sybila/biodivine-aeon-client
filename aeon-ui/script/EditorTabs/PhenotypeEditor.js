/** Implements functionality needed by the Phenotype editor tab. */
let PhenotypeEditor = {
    _table: undefined,

    /** Object containing counters {true: trueCounter, false: falseCounter, null: notInPhenotypeCounter} */
    _counters: undefined,

    _oscillationButton: undefined,
    _oscillation: undefined,

    init() {
        this._table = new TableWidget(document.getElementById("phenotype-editor-table").getElementsByTagName('tbody')[0],
                                        document.getElementById("phenotype-editor-filter"));

        this._counters = { true: new CountWidget(document.getElementById("phenotype-true-count"), 0),
                            false: new CountWidget(document.getElementById("phenotype-false-count"), 0),
                                null: new CountWidget(document.getElementById("phenotype-notin-count"), 0 )};

        this._oscillationButton = document.getElementById('oscillation-switch');
        this.oscillationSwitch();
        this._oscillation = "allowed";
    },

    /** Adds a variable to the PhenotypeEditor.
     *  Updates counters and CytoscapeEditor highlighting.*/
    addVariable(variable) {
        this._table.addVariable(variable.id, variable.name, "phenotype");
        this._counters[variable.phenotype].increment();
        this._updateCounts();

        const color = variable.phenotype == null ? "#B0BEC5" : variable.phenotype == true ? "green" : "red";
        this._table.changeIndicatorColor(variable.id, color);
        CytoscapeEditor.highlightPhenotype([variable]);
    },

    /** Delete variable from the Phenotype editor.
     * Updates counters and CytoscapeEditor highlighting. */
    removeVariable(variable) {
        this._table.removeFromTable(variable.id);
        this._counters[variable.phenotype].decrement();
        this._updateCounts();
        CytoscapeEditor.highlightPhenotype([variable]);
    },

    /** Renames variable in the Phenotype editor. */
    renameVariable(id, newName) {
        this._table.renameById(id, newName);
    },

    /** Delete all rows from the table, reset counters and set oscillation button to 'All'. */
    clear() {
        this._table.clear();

        this._counters[true].clear();
        this._counters[false].clear();
        this._counters[null].clear();

        this._oscillationButton.value = "allowed";
        this._oscillation = "allowed";
    },

    /** Filters data from the table in dependence to the input of "phenotype-editor-filter". */
    filterTable() {
        this._table.filterTable();
    },

    /** Changes phenotype status of variable by its id and value of the newPhenotype. */
    changeVarPhenotype(variable, newPhenotype) {
        this._counters[variable.phenotype].decrement();
        variable.phenotype = newPhenotype;
        this._counters[variable.phenotype].increment();

        const color = variable.phenotype == null ? "#B0BEC5" : variable.phenotype == true ? "green" : "red";
        this._table.changeIndicatorColor(variable.id, color);

        ModelEditor.updatePhenotype(variable);

        this._updateCounts();
        CytoscapeEditor.highlightPhenotype([variable]);
    },

    /** Updates counters in the stats table of the PhenotypeEditor. */
    _updateCounts() {
        this._counters[true].updateCount();
        this._counters[false].updateCount();
        this._counters[null].updateCount();
    },

    /** Sets all selected variables to the new phenotype value. */
    setSelected(phenValue) {
        for (row of this._table.table.rows) {
            if (row.classList.contains('selected')) {
               LiveModel.Control.changePhenotypeById(row.getAttribute('data-id'), phenValue);
            } 
        }
    },

    /** Change selected class of all the PhenotypeEditor table rows. 
     *  if deselect (nullable boolean) is true then selects all, if false deselects all,
     *  if null toggles selected status of all rows to the opposite value.
    */
    changeSelectedAll(deselect) {
        this._table.changeSelectedAll(deselect);
    },

    /** Returns true if the phenotype is empty. */
    isPhenotypeEmpty() {
        return this._counters.true.isZero() && this._counters.false.isZero();
    },

    /** Returns now set oscillation status. */
    getOscillation() {
        return this._oscillation;
    },

    /** Toggles set oscillation mode. (allowed, required, forbidden) */
    oscillationSwitch() {
        this._oscillationButton.addEventListener('click', () => {
            if (!LiveModel._modelModified()) {
                return;
            }

            if (this._oscillation == "allowed") {
                this._oscillationButton.value = "required";
                this._oscillation = "required";
            } else if (this._oscillation == "required") {
                this._oscillationButton.value = "forbidden";
                this._oscillation = "forbidden";
            } else {
                this._oscillationButton.value = "allowed";
                this._oscillation = "allowed";
            }    
        });
    },
};