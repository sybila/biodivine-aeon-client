import Config from './Config';

/**
 * Alert dialog will show a single message to the user with an "Ok" confirmation button.
 * 
 * Once the dialog is confirmed, the `onOk` callback is executed.
 */
export type AlertDialog = {
    message: string,
    onOk?: () => void,
}

/**
 * Confirm dialog displays a single message to the user and lets him decide between
 * "Ok" (positive) and "Cancel" (negative). Depending on the user's choice, one of
 * the methods is executed.
 */
export type ConfirmDialog = {
    message: string,
    onPositive?: () => void,
    onNegative?: () => void,
}

/**
 * File open dialog will try to load one file as selected by the user. You can specify
 * an optional `accept` string which specifies which file extensions are supported.
 * 
 * Depending on what happens, `onFileContents`, `onError` or `onCancel` is executed.
 * Note that this is not very good for large files, as the file is always completely 
 * loaded into a string. But should be all right for most use cases and we don't have
 * a particularly better multi-platform solution yet.
 */
export type FileOpenDialog = {
    accept?: string,
    onFileContents?: (data: string) => void,
    onError?: () => void,
    onCancel?: () => void,
}

/**
 * Save given `data` string to a file with the optional `suggestedName`. 
 * 
 * On browser, this will just download the file. On desktop, this should give
 * the user an option to pick the save path and then write the contents of the
 * data string to that path.
 * 
 * As with the `FileOpenDialog`, this is not suitable for large files as the 
 * entire file has to be saved to a string.
 */
export type FileSaveDialog = {
    data: string,
    suggestedName?: string,
    onFileSaved?: () => void,
    onError?: () => void,
    onCancel?: () => void,
}

class Dialogs {
    alert(dialog: AlertDialog) {
        if (Config.is_online()) {
            alert(dialog.message);
            if (dialog.onOk) { dialog.onOk(); }
        }
    }
}

export let Dialogs2: {
    confirm: (dialog: ConfirmDialog) => void,
    alert_error: (message: string) => void,
    /* Let the user select a file, and load that file into a string variable. */
    select_file: (accept: string | undefined, onSelected: (content: string | undefined) => void) => void,
} = {

    confirm: function(dialog: ConfirmDialog) {
        if (confirm(dialog.message)) {
            if (dialog.onPositive !== undefined) {
                dialog.onPositive();
            }            
        } else {
            if (dialog.onNegative !== undefined) {
                dialog.onNegative();
            }
        }
    },

    alert_error: function(message: string) {
        alert(message);
    },

    select_file: function(accept: string | undefined, onSelected: (content: string | undefined) => void): void {        
        if (!window.FileReader) {
            Dialogs.alert_error("This platform does not support file loading.");
            return;
        }

        let input = document.createElement("input");
        input.type = "file";
        input.accept = accept === undefined ? "*" : accept;

        input.onchange = () => {
            let reader = new FileReader();

            reader.onload = function(event) {
                // Result is string, because we called `readAsText`.
                onSelected(event.target.result as string);
            };

            reader.onerror = function() {                
                Dialogs.alert_error("File cannot be opened.");
            };

            reader.readAsText(input.files[0]);   
        }

        input.click();
    },

}

export default Dialogs;