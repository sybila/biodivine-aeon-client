
export type ConfirmDialog = {
    message: string,
    onPositive?: () => void,
    onNegative?: () => void,
}

export let Dialogs: {
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