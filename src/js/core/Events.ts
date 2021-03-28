export type EventCallback = (data: any) => void;

/**
 * A small global event bus responsible for passing and routing messages
 * throughout the application. 
 * 
 * Each event can be sent and saved, in which case, the value is preserved.
 * Make sure this does not cause memory leaks and use `clear` to remove any
 * saved value when it is no longer needed.
 * 
 * Here, we don't assume any type safety. It is up to the application to 
 * implement a type safe wrapper on top of the global event bus, or create 
 * their own local safe instances. 
 */
export class EventBus {
	saved: { [key: string]: any | undefined } = {}
	eventListeners: { [key: string]: EventCallback[] | undefined } = {}

	/**
	 * Add listener for a particular event. Keep in mind that listeners are stored
	 * as references in the `EventBus` and any data they reference cannot be
	 * garbage collected (for example UI elements). Make sure to remove listeners
	 * when they are no longer needed.
	 * 
	 * @param name The name of the event that `callback` will be invoked on.
	 * @param callback A callback to be executed when the event fires.
	 * @returns The registered callback that can be later used to unregister it.
	 */
	addListener(name: string, callback: EventCallback) {
		if (Array.isArray(this.eventListeners[name])) {
			this.eventListeners[name].push(callback);
		} else {
			this.eventListeners[name] = [callback];
		}
		return callback;
	}

	/**
	 * Remove a previously registered listener for the given event.
	 * @param name The name of the event where listener should be removed.
	 * @param callback A previously registered listener.
	 * @returns The callback that was removed, or undefined if no such callback existed.
	 */
	removeListener(name: string, callback: EventCallback): EventCallback | undefined {		
		if (this.eventListeners[name]) {
			let index = this.eventListeners[name].indexOf(callback);
			if (index > -1) {
				this.eventListeners[name].splice(index, 1);
				return callback;
			}
		}				
		return undefined;		
	}

	/**
	 * Emit an event with the given name and payload. The listeners will be executed
	 * asynchronously. If you need to perform something after the event has been 
	 * delivered to all the listeners, you can await the returned `Promise`. 
	 * @param name Name of the event to fire.
	 * @param payload Payload data for the fired event.
	 */
	async emit(name: string, payload: any): Promise<void> {
		if (this.eventListeners[name]) {
			await Promise.all(this.eventListeners[name].map((listener) => {
				new Promise<void>((resolve) => { 
					setTimeout(() => {
						listener(payload); resolve(); 
					}, 0);					
				});
			}));
		}		
	}

	/**
	 * Emit an event, just like `emit` would, but first save it into 
	 * an internal cache.
	 */
	async emitAndSave(name: string, payload: any): Promise<void> {
		this.saved[name] = payload;
		return this.emit(name, payload);
	}

	/**
	 * Delete any saved values associated with the provided event. 
	 * Note that this will not notify any listeners!
	 */
	clear(name: string) {
		if (this.saved[name]) {
			delete this.saved[name];
		}
	}

	/**
	 * Get value saved for the given event.
	 */
	get(name: string): any | undefined {
		return this.saved[name];
	}

	/**
	 * Remove any listeners and saved values associated with this event bus.
	 * 
	 * Afterwards, any calls on this bus are invalid and should fail.
	 */
	destroy() {
		this.saved = undefined;
		this.eventListeners = undefined;
	}

}

let global_events = new EventBus();
// Make events available globally.
(window as any).global_events = global_events;

export default global_events;