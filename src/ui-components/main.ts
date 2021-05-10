import "@webcomponents/webcomponentsjs/webcomponents-bundle";
import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import { UiButton, UiLink } from './buttons/Buttons';
import { UiToolbar, UiToolbarButton } from './toolbar/Toolbar';
import ui from './UiEvents';

customElements.define('ui-button', UiButton);
customElements.define('ui-link', UiLink);
customElements.define('ui-toolbar-button', UiToolbarButton);
customElements.define('ui-toolbar', UiToolbar);

ui.addClickListener(undefined, (e) => {
    console.log("Clicked:", e.event);
});

ui.addSelectionListener("dock", (e) => {
    console.log("Dock selected:", e.event);
})