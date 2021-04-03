import { EventBus, EventCallback } from '../core/Events'; 

export type Position = {
    x: number, y: number
}

export type Variable = {
    id: string,
    name: string,
    position?: Position,    
    /* Later, we will have update function data here. */
}

export type Regulation = {
    source: string,
    target: string,
    isObservable: boolean,
    monotonicity: "activation" | "inhibition" | "unknown",
}

/**
 * A "source of truth" for the information about the currently loaded model.
 */
export class LiveModel extends EventBus {

    /**
     * A collection of model variables. Indices are the variable ids.
     */
    variables: { [key: string]: Variable }
    
    /**
     * A collection of model regulations. First index level are the sources, second the targets.
     */
    regulations: { [key: string]: { [key: string]: Regulation } }

    constructor() {
        super()    
    }

    /**
     * Safely remove everything.
     */
    async clear(): Promise<void> {
        let deleted = Object.keys(this.variables).map((id) => this.deleteVariable(id));
        await Promise.all(deleted);
        return;
    }

    /**
     * Find the id of a variable based on the given name.
     */
    findVariable(name: string): string | undefined {
        for (let id of Object.keys(this.variables)) {
            if (this.variables[id].name == name) {
                return id;
            }
        }
        return undefined;
    }

    /**
     * Mark the values as selected. Note that this is not saved in the live model.
     */
    selection(variables: string[], regulations: [string, string][]): Promise<void> {
        return this.emit("selection", {
            variables: variables.filter((id) => { this.variables[id] !== undefined }),
            regulations: regulations.filter((id) => {
                this.regulations[id[0]] !== undefined && this.regulations[id[0]][id[1]] !== undefined
            }),
        });
    }

    /**
     * Mark the variable as hovered. Note that the value is not saved anywhere.
     */
    hoverVariable(id: string, value: boolean): Promise<void> {
        if (this.variables[id] === undefined) { return Promise.resolve(); }
        return this.emit("variable.hover", { id: id, hover: value });
    }

    /**
     * Mark a regulation as hovered. Note that the value is not save anywhere.
     */
    hoverRegulation(source: string, target: string, value: boolean): Promise<void> {
        if (this.regulations[source][target] === undefined) { return Promise.resolve(); }
        return this.emit("regulation.hover", { source: source, target: target, hover: value });
    }

    /** 
     * If a variable with the given id exists, update it based on the given data.
     * Otherwise create a new variable. 
     * 
     * Returns a promise with id of the variable that is fulfilled when all event
     * listeners have acknowledged the variable.
     */
    async ensureVariable(data: {
        id?: string,
        name?: string,
        position?: Position
    }): Promise<string> {
        let variable = data.id !== undefined ? this.variables[data.id] : undefined;
        if (variable !== undefined) { // Update existing.
            if (data.name !== undefined) {
                variable.name = data.name;
            }
            if (data.position !== undefined) {
                variable.position = data.position;
            }
            await this.emit("variable", variable);
            return variable.id;
        }
        // Create new variable
        if (data.id === undefined) {
            let i = 0;
            while (this.variables[String(i)] !== undefined) { i += 1; }
            data.id = String(i);
        }
        if (data.name === undefined) {
            data.name = "v_" + data.id;
        }
        variable = {
            id: data.id, name: data.name, position: data.position
        };
        this.regulations[variable.id] = {}; // Add regulation container.
        this.variables[variable.id] = variable;
        await this.emit("variable", variable);
        return variable.id;
    }

    /**
     * Safely remove a variable, including all connected regulations.
     */
    async deleteVariable(id: string): Promise<void> {
        let variable = this.variables[id];
        if (variable === undefined) { return Promise.resolve(); }
        // First, delete connected regulations:
        let toDelete: { source: string, target: string }[] = [];
        for (let target of Object.keys(this.regulations[id])) {
            toDelete.push({ source: id, target: target });
        }
        for (let source of Object.keys(this.variables)) {
            if (id != source && this.regulations[source][id] !== undefined) {
                toDelete.push({ source: source, target: id });
            }
        }                
        await Promise.all(toDelete.map((data) => this.deleteRegulation(data.source, data.target)));
        // Then delete the object
        delete this.variables[id];
        delete this.regulations[id];
        return this.emit("variable-delete", id);
    }

    /**
     * If a regulation between the two variables exists, update it. Otherwise create
     * a new regulation.
     * 
     * Returns a promise that is fullfilled when the regulation event has been 
     * handled by everyone.
     */
    async ensureRegulation(data: {
        source: string, target: string,
        isObservable?: boolean,
        monotonicity?: "activation" | "inhibition" | "unknown"
    }): Promise<void> {
        let regulation = this.regulations[data.source][data.target];
        if (regulation !== undefined) { // Update existing
            if (data.isObservable !== undefined) {
                regulation.isObservable = data.isObservable;
            }
            regulation.monotonicity = data.monotonicity;
            return this.emit("regulation", regulation);
        }
        regulation = {
            source: data.source, target: data.target,
            isObservable: data.isObservable !== undefined ? data.isObservable : false,
            monotonicity: data.monotonicity !== undefined ? data.monotonicity : "unknown",
        }
        return this.emit("regulation", regulation);
    }

    /**
     * Safely remove a regulation.
     */
    async deleteRegulation(source: string, target: string): Promise<void> {
        let regulation = this.regulations[source][target];
        if (regulation === undefined) { return Promise.resolve(); }
        delete this.regulations[source][target];
        return this.emit("regulation-delete", { source: source, target: target });
    }

    onVariable(listener: (variable: Variable) => void): EventCallback {
        return this.addListener("variable", (data) => {
            listener(data as Variable);
        });
    }

    onDeleteVariable(listener: (id: string) => void): EventCallback {
        return this.addListener("variable-delete", (data) => {
            listener(data as string);
        });
    }

    onRegulation(listener: (regulation: Regulation) => void): EventCallback {
        return this.addListener("regulation", (data) => {
            listener(data as Regulation);
        });
    }

    onDeleteRegulation(listener: (source: string, target: string) => void): EventCallback {
        return this.addListener("regulation-delete", (data) => {
            listener(data.source, data.target);
        });
    }

}

export let model = new LiveModel();
export default model;