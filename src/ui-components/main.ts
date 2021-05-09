import "@webcomponents/webcomponentsjs/webcomponents-bundle";
import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import { UiButton } from './button/Buttons';

import templates from './templates';

document.getElementById('templates').innerHTML = templates;

customElements.define('ui-button', UiButton);

//document.getElementById('root').innerHTML = "<ui-button><span slot='label'>Click Me</span></ui-button>";