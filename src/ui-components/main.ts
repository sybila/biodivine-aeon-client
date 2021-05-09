import "@webcomponents/webcomponentsjs/webcomponents-bundle";
import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import { UiButton, UiLink } from './Buttons';
import ui from './UiEvents';

import templates from './templates';

document.getElementById('templates').innerHTML = templates;

customElements.define('ui-button', UiButton);
customElements.define('ui-link', UiLink);

//document.getElementById('root').innerHTML = "<ui-button><span slot='label'>Click Me</span></ui-button>";

ui.addListener("click", (e) => {
    console.log("Clicked: ", e.event);
});