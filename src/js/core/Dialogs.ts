import Config from './Config';
import Native from './Native';

/**
 * Dialogs provide a common abstraction over basic OS-specific interactions with the user,
 * like alert/confirm dialogs or file selection. It is not perfect, but it should be 
 * able to perform basic things well enough.
 * 
 * It can be implemented either using WebDialogs or NativeDialogs depending on whether
 * the application is running in online or native mode.
 */
export interface Dialogs {
    /**
     * Create a basic alert dialog with a simple message.
     * @param message Message to be displayed.
     * @returns A promise that is resolved when the user dismisses the dialog.
     */
    alert(message: string): Promise<void>

    /**
     * Create a basic yes/cancel dialog with a message.
     * @param message Message to be displayed.
     * @returns A promise that is resolved with true/false when the user selects a value.
     */
    confirm(message: string): Promise<boolean>

    /**
     * Create a file picker dialog that lets the user choose a file, and then load the contents 
     * of the file to a string. Note that this is not very suitable for large files (anything >1M is
     * not recommended), but it is the best we can do for truly multiplatform single 
     * API implementation.
     * 
     * For safety reasons, the online version uses a hard limit on 100MB files. Native version
     * has no such restriction, but if large files can appear as input, we recommend using 
     * a native file picker to load the contents directly in the native app without interfacing
     * with JavaScript instead.     
     * @param accept An extension string for files that should be accepted.
     * @returns A promise that is resolved with the contents of the user selected file.
     */
    openFile(accept: string | undefined): Promise<string>

    /**
     * Save the provided data string into a file. On web, the file is simply downloaded. On desktop,
     * a file picker should be presented to save the file. 
     * 
     * @param data Data that should be saved to a file.
     * @param suggestedName The name suggested for the file.
     * @returns A promise that is resolved to true when the file is successfully saved. If it is 
     * resolved to false, the user cancelled the save.
     */
    saveFile(data: string, suggestedName: string | undefined): Promise<boolean>
}

class WebDialogs {

    alert(message: string): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                alert(message);
                resolve();
            }, 0)
        });        
    }

    confirm(message: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            setTimeout(() => {
                if (confirm(message)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 0);
        });
    }

    openFile(accept: string | undefined): Promise<string> {
        if (!window.FileReader) {
            return Promise.reject("This platform does not support file loading.");            
        }

        return new Promise<string>((resolve, reject) => {
            setTimeout(() => {
                let input = document.createElement("input");
                input.type = "file";
                input.accept = accept === undefined ? "*" : accept;

                input.onchange = () => {
                    let file = input.files[0];
                    if (file.size > 110_000_000) { 
                        // File is larger than 110MB. Not a good idea to 
                        // load this into the memory of a web browser.
                        reject( `File is too large (${file.size / 1_000_000}MB). ` + 
                                "Maximal supported file size is 100MB. To process larger files, "+
                                "use the desktop application which has no limit on file size.");
                        return;
                    }

                    let reader = new FileReader();

                    reader.onload = (event) => {
                        // Result is a string because it was created using `readAsText`.
                        resolve(event.target.result as string);
                    };

                    reader.onerror = () => {
                        reject("Unexpected error. Cannot open file.");
                    };

                    reader.readAsText(file);
                };

                input.click();
            }, 0);
        });        
    }

    saveFile(data: string, suggestedName: string | undefined): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            setTimeout(() => {
                let link = document.createElement('a');
                link.setAttribute('href', 'data:text/plain;charset=utf-8,'+encodeURIComponent(data));
                link.setAttribute('download', suggestedName);
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                resolve(true);                
            }, 0);
        });
    }

}

class NativeDialogs {
    
    async alert(message: string): Promise<void> {
        let response = await Native.send<void>("/core/dialogs/alert", message);
        if (response.error) { throw response.error; }
    }

    async confirm(message: string): Promise<boolean> {
        let response = await Native.send<boolean>("/code/dialogs/confirm", message);
        if (response.error) { throw response.error; }
        return response.result === undefined ? false : response.result;
    }

    async openFile(accept: string | undefined): Promise<string> {
        let response = await Native.send<string>("/code/dialogs/open_file", accept === undefined ? "*" : accept);
        if (response.error) { throw response.error; }        
        return response.result === undefined ? "" : response.result;
    }

    async saveFile(data: string, suggestedName: string | undefined): Promise<boolean> {
        let response = await Native.send<boolean>("/code/dialogs/save_file", { data: data, name: suggestedName });
        if (response.error) { throw response.error; }
        return response.result === undefined ? false : response.result;
    }

}

function makeDialogs(): Dialogs {
    if (Config.is_native()) {
        return new NativeDialogs();
    } else {
        return new WebDialogs();
    }
}

let dialogs: Dialogs = makeDialogs();

export default dialogs;