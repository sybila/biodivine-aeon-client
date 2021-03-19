import Config from './Config';

export let Events = {
   
    _event_listeners: {},

	addListener(name: string, callback: (data: any) => void) {
		if (this._event_listeners[name] === undefined) {
			this._event_listeners[name] = [callback];			
		} else {
			this._event_listeners[name].push(callback);
		}
		return callback;
	},

	removeListener(name: string, callback: (data: any) => void) {
		if (this._event_listeners[name] === undefined) {
			throw `Events.removeEventListener: No callback registered for event ${name}.`;
		}
        let index = this._event_listeners[name].indexOf(callback);
        if (index > -1) {
            this._event_listeners[name].splice(index, 1);
        } else {
            throw `Events.removeEventListener: Removing a callback to event ${name} that was not registered.`;
        }		
		return callback;
	},

	emit(name: string, payload: any) {
		let listeners = this._event_listeners[name];
		if (listeners !== undefined) {
			for (let listener of listeners) {
				listener(payload);
			}
		} else if (Config.DEBUG_MODE) {
			console.log("Unhandled event:", name, payload);
		}
	},
    
}

export default Events;