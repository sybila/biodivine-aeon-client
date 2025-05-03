/** Object responsible for displaying and resolving warning.*/
let Warning = {
    warningDiv: undefined,
    textDiv: undefined,
    buttonDiv: undefined,

    init() {
        this.warningDiv = document.getElementById("warning");
        this.textDiv = document.getElementById("warning-text");
        this.buttonDiv = document.getElementById("warning-buttons");
    },

    /** Returns content of the warning. Warning content is returned as object {"text":, "buttons": htmlCode}.
     *  Parameter warningType is string determining what type of warning content should be returned.
     *  If warning type is not one of the registered warning types, then uses the warningType as text of the warning.
     */
    _getWarningContent(warningType) {
        switch (warningType) {
            case "resultsAvailable":
                return {text: "There are existing results in the Results module. To proceed, you must either delete the results or open a copy of this model without results in a new browser tab.",
                        buttons:    `<button class='centered-button' onclick='Warning.closeWarning()' style='height: 25px;'>Cancel</button>
                                    <button class='centered-button' onclick='Warning.resultsAvailableResolve(false)' style='height: 25px;'>Delete results</button>
                                    <button class='centered-button' onclick='Warning.resultsAvailableResolve(true)' style='height: 25px;'>Open new browser tab</button>`};
            case "tooManyControlRes":
                return {text: "You calculated more than 1000 results. Opening results in one tab may cause performance issues.",
                            buttons: `<button class='centered-button' onclick='Warning.closeWarning()' style='height: 25px;'>Cancel</button>
                            <button class='centered-button' onclick='Warning.tooManyControlResolve(true)' style='height: 25px;'>Open in one tab</button>
                            <button class='centered-button' onclick='Warning.tooManyControlResolve(false)' style='height: 25px;'>Export results in .csv</button>`};
            
            default:
                return {text: warningType, buttons: "<button class='centered-button' onclick='Warning.closeWarning()' style='height: 25px; margin: auto;'>Close</button>"};
        }
    },

    /** Displays resultsAvailable warning if there are results available.
     *  Returns false if warning was displayed, else returns false.*/
    resultsAvailableWarning() {
        if (Results.hasResults()) {
            this.displayWarning("resultsAvailable");
            return false;
        }

        return true;
    },

    /** Resolves resultsAvailable warning. If resolveMode is true opens model in new browser tab, 
     *  else if is false deletes available results, else closes warning wihout performing any action. */
	resultsAvailableResolve(resolveMode) {
		if (resolveMode == true) {
			UI.Open.openBrowserTab(false);
		} else if (resolveMode == false) {
			Results.clear();
			TabBar.closeResults();
		}

        this.closeWarning();
	},

    /** Resolves resultsAvailable warning. If resolveMode is true puts all results into one tab, 
     *  else if is false exports control results into .csv file,
     *  else closes warning wihout performing any action. */
    tooManyControlResolve(resolveMode) {
        if (resolveMode == true) {
            TabBar.addTab('control results', Results.loadedResults.data);
        } else if (resolveMode == false) {
            UI.DownloadFile.downloadControlResCSV();
        }
        
        this.closeWarning();
    },

    closeWarning() {
        this.warningDiv.style.display = "none";
    },

    /** Displays warning and fills it with content returned by this._getWarningContent function.
     *  Parameter warningType is string determining what type of warning content should be returned.
     */
    displayWarning(warningType) {
        const warningContent = this._getWarningContent(warningType);

        this.textDiv.innerHTML = warningContent.text;
        this.buttonDiv.innerHTML = warningContent.buttons;

        this.warningDiv.style.display = "block";
    }
}