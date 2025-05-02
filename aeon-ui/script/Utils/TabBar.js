/** Object responsible for the */
let TabBar = {
    /**Contains elements for tab-bar-menu in the form { button:...., tabMenu: ...., tabTable:.... }*/
	_tabBarElements: undefined,
    /**Dict containing all tabs {TABID: tab}*/
	_tabs: undefined,
    /**ID of now active tab*/
	_nowActiveTab: undefined,
    _draggedRow: undefined,

    /** Saves ids of the tabs limited to one occurence in the tab menu. */
    _tabIds: {
        "model": 0,
        "control results": 1,
        "tree-explorer": 2,
    },

    /** Saves id of the current tab, whichs type is not limited to one occurence in the tab menu.
     *  From the start set to high number (now 200) to ensure easier future implementation of the new limited tabs.
     */
    _unlimitedTabId: 200,

    init() {
        this._tabBarElements = {"button": null,
            "tabMenu": document.getElementById("tab-bar"),
            "tabTable": document.getElementById("tab-table").getElementsByTagName("tbody")[0]};

        this._draggedRow = null;
        this._tabs = {};
        this._nowActiveTab = this._tabIds[window.initialTabInfo.type];

        if (window.initialTabInfo.type == "tree-explorer") {
            UI.Open.openTreeExplorer();
        } else {
            this.addTab(window.initialTabInfo.type, JSON.parse(window.initialTabInfo.data));
        }
        
    },

    /** Inserts data into corresponding module. */
    _insertData(type, data) {
        if (type == "model") {
            LiveModel.Import.importAeon(data, true);
        } else if (type == "control results") {
            ControlResults.insertData(data);
        } else if (type == "explorer") {
            Explorer.insertData(data)
        }
    },

    /** Returns id by the type of the tab. Used only for initialization of a new tab.
     *  If tab can be present multiple times in the tab menu, then uses value saved in this._unlimitedTabId and increments it by 1.
    */
    _getTabId(type) {
        let tabID = this._tabIds[type];

        if (tabID == undefined || tabID == null) {
            tabID = this._unlimitedTabId;
            this._unlimitedTabId += 1;
        }

        return tabID;
    },

    /** Creates new tab and appends it into the tab menu. */
    _createTab(type, data, tabId) {
        const tabRow = document.createElement("tr");
        const tabDiv = document.createElement("div");

        tabRow.setAttribute("tabId", tabId);
        tabRow.setAttribute('draggable', 'true');

        tabDiv.classList.add("centered-button");
        tabDiv.style.width = "90%";
        tabDiv.style.height = "25px";
        tabDiv.style.textAlign = "center";
        tabDiv.style.paddingTop = "4px";
        tabDiv.style.marginTop = "5px";
        tabDiv.style.pointerEvents = "none";
        tabDiv.innerText = type;

        if (type == "model") {
            tabDiv.innerText += " " + window.modelId;
        }

        this._tabs[tabId] = new Tab(type, data, tabDiv);
        
        tabRow.addEventListener("click", (e) => {
            this.toggleActive(e.target.getAttribute("tabId"), true);
        })

        tabRow.addEventListener('dragstart', () => {
            this._draggedRow = tabRow;
            tabRow.classList.add('dragging');
        });

        tabRow.addEventListener('dragover', (e) => {
            e.preventDefault();

            if (this._draggedRow == null) {
                return;
            }

            const rows = Array.from(this._tabBarElements.tabTable.rows);
            if (rows.indexOf(e.target) > rows.indexOf(this._draggedRow)) {
                e.target.after(this._draggedRow);
            } else {
                e.target.before(this._draggedRow);
            }
        })

        tabRow.addEventListener('dragend', () => {
            this._draggedRow = null;
            tabRow.classList.remove('dragging');
        });
        
        this._insertData(type, data);
        tabRow.appendChild(tabDiv);
        this._tabBarElements.tabTable.appendChild(tabRow);
    },

    /**Adds new tab into TabBar.*/
    addTab(type, data) {
        const tabId = this._getTabId(type);

        if (this._tabs[this._tabIds[type]] == undefined || this._tabs[this._tabIds[type]] == null) {
            this._createTab(type, data, tabId);
        }
        
        this.toggleActive(tabId, false);
    },

    /** Changes inner text of inner tab to newName. */
    changeTabText(id, newName) {
        const tab = this.getTab(id);

        tab.tabWidget.innerText = newName;
    },

    /** Makes now active tab not active. Changes only active status inside the tab menu and active hotkeys. */
    _dissableNowActiveTab() {
        const nowActiveTab = this._tabs[this._nowActiveTab];
        nowActiveTab.changeStatus();

        if (nowActiveTab.type == "model") {
            InitHotkeys.disableHotkeys();
            nowActiveTab.data = LiveModel.Export.exportAeon(true);
        } else if (nowActiveTab.type == "tree-explorer") {
            InitHotkeys.disableHotkeys();
        }
    },

    /**Changes active tab from this._tabs[this._nowActiveTab] to this._tabs[newActiveId]*/
    toggleActive(newActiveId, returnEqual) {
        if (newActiveId == null) {
            return;
        }

        if (this._nowActiveTab != newActiveId) {
            this._dissableNowActiveTab();
        } else if (returnEqual) {
            return;
        }
        
        const newTab = this._tabs[newActiveId];

        if (newTab.type == "model") {
            InitHotkeys.initCanvasHotkeys();
        } else if (newTab.type == "tree-explorer") {
            InitHotkeys.initTreeHotkeys();
        }

        if (this._tabIds[newTab.type] == undefined || this._tabIds[newTab.type] == null) {
            this._insertData(newTab.type, newTab.data);
        }

        newTab.changeStatus();
        UI.Visible.toggleDiv(newTab.type);
        this._nowActiveTab = newActiveId;
    },

    /**Close current tab.*/
    closeTab() {
        const tabs =  Array.from(this._tabBarElements.tabTable.rows);

        if (tabs.length < 2) {
            return;
        }

        let switchToIndex = null;
        let deleteIndex = null;

        for (let i = 0; i < tabs.length; i++) {
            if (deleteIndex != null && switchToIndex != null) {
                switchToIndex = i;
                break;
            }

            if (tabs[i].getAttribute("tabId") == this._nowActiveTab) {
                deleteIndex = i;
            } else {
                switchToIndex = i;
            }
        }

        this.toggleActive(tabs[switchToIndex].getAttribute("tabId"), true);
        delete this._tabs[tabs[deleteIndex].getAttribute("tabId")];
        this._tabBarElements.tabTable.deleteRow(deleteIndex);
    },

    /**Closes all tabs except the one with the model.*/
    closeResults() {
        const tabs =  Array.from(this._tabBarElements.tabTable.rows);

        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].getAttribute("tabId") != this._nowActiveTab) {
                delete this._tabs[tabs[i].getAttribute("tabId")];
                this._tabBarElements.tabTable.deleteRow(i);
            }
        }
    },

    /** Switches active tab to model tab. If model tab is not present in the tab menu opens new tab with the current model. */
    openModel() {
        const modelTab = TabBar.getTab(0);

        if (modelTab == undefined) {
            TabBar.addTab("model", LiveModel.modelSave);
        } else {
            TabBar.toggleActive(0, false);
        }
    },

    /** Returns tab by its ID. */
    getTab(tabId) {
        return this._tabs[tabId];
    },

    getNumberOfTabs() {
        return Object.keys(this._tabs).length;
    },

    getNowActiveId() {
        return this._nowActiveTab;
    }
}