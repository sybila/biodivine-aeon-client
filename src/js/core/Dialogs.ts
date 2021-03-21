
export type ConfirmDialog = {
    message: string,
    onPositive?: () => void,
    onNegative?: () => void,
}

export let Dialogs: {
    confirm: (dialog: ConfirmDialog) => void,
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

}

export default Dialogs;