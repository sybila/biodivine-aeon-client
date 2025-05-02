/** Implements functionality needed by the Controllable editor tab. */
let ControllableEditor = {
    _table: undefined,
    _counters: undefined,

    init() {
        this._table = new TableWidget(document.getElementById("controllable-editor-table").getElementsByTagName('tbody')[0],
                                        document.getElementById("controllable-editor-filter"));
        this._counters = { true: new CountWidget(document.getElementById("controllable-count"), 0),
                            false: new CountWidget(document.getElementById("uncontrollable-count"), 0) };

    },

    /** Adds a variable to the ControllableEditor.
     *  Updates counters and CytoscapeEditor highlighting.*/
    addVariable(variable) {
        this._table.addVariable(variable.id, variable.name, "controllable");
        this._counters[variable.controllable].increment();
        this._updateCounts();
        this._table.changeIndicatorColor(variable.id, variable.controllable == true ? "#FFFF66" : "#B0BEC5");
        CytoscapeEditor.highlightControllable([variable]);
    },

    /** Delete variable from the Phenotype editor.
    * Updates counters and CytoscapeEditor highlighting. */
    removeVariable(variable) {
        this._table.removeFromTable(variable.id);
        this._counters[variable.controllable].decrement();
        this._updateCounts();
        CytoscapeEditor.highlightControllable([variable]);
    },

    /** Renames variable in the Controllable editor. */
    renameVariable(id, newName) {
        this._table.renameById(id, newName);
    },

    /** Delete all rows from the table and reset counters. */
    clear() {
        this._table.clear();
        this._counters[true].clear();
        this._counters[false].clear();
    },

    /** Filters data from the table in dependence to the input of "controllable-editor-filter". */
    filterTable() {
        this._table.filterTable();
    },

    /** Changes control status of variable  by its id and value of the newContr (true, false). */
    changeVarControllable(variable, newContr) {

        this._counters[variable.controllable].decrement();
        variable.controllable = newContr;
        this._counters[variable.controllable].increment();
        this._updateCounts();

        this._table.changeIndicatorColor(variable.id, newContr == true ? "#FFFF66" : "#B0BEC5");

        ModelEditor.updateControllable(variable);

        CytoscapeEditor.highlightControllable([variable]);
    },

    /** Updates counters in the stats table of the ControllableEditor. */
    _updateCounts() {
        this._counters[true].updateCount();
        this._counters[false].updateCount();
    },

    /** Sets all selected variables to the new controllable value. */
    setSelected(contrValue) {
        for (row of this._table.table.rows) {
            if (row.classList.contains('selected')) {
                LiveModel.Control.changeControllableById(row.getAttribute('data-id'), contrValue);
            } 
        }
    },

    /** Change selected class of all the ControllableEditor table rows. 
    *  if deselect (nullable boolean) is true then selects all, if false deselects all,
    *  if null toggles selected status of all rows to the opposite value.
    */
    changeSelectedAll(deselect) {
        this._table.changeSelectedAll(deselect);
    },

    /** Returns current value of counter determined by the controllable (boolean) parameter. */
    getCountValue(controllable) {
        return this._counters[controllable].getCount();
    }
};