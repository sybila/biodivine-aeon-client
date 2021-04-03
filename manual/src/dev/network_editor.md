# Boolean Network Editor

Here, we describe the internal structure of the web-based network editor. This is essentially a thorough breakdown of the `editor.html` file which describes individual components, since documenting them directly in HTML is quite problematic.

Our general strategy is to have `aeon.less` and other CSS in `css/components` implement basic GUI elements that can be then reused. A component is then only responsible for styling itself. The positioning should be performed in a use-case specific file, like `editor.less`.

## Design language

Everything should be primarily aligned to a vertical `8px` grid. For height, typically just wrap content or use %. Try to keep small buttons at around `24px` and larger buttons around `48px`. Smallest spacing should be around `8px` as well, preferrably `16px` for more distinct components. In `colors.less`, we have a pre-defined color palette for Aeon. Use `lighten` and `darken` LESS functions to create derivatives of these colors.

In terms of typography, our primary font is Lato, and we use Heebo in the logo for emphasis (feel free to use it in similar situations). For "technical" text, we use Anonymous Pro, as it seems like a good balance between monospace and readability. Please use `em` units for text sizing if possible.

Finally, we use `box-sizing: border-box;` globally to make the world just a bit more sane. We also define some basic classes (`invisible` for `opacity: 0`, `gone` for `display: none`) to make quick style changes easier.

## GUI interaction

We have a `UiEventBus` that is able to quickly link common GUI interactions to events, so that it
is easier to keep the HTML and JavaScript decoupled from each other. Just make sure to run `UiEventBus.registerEvents()` on newly created GUI elements.

### `data-clickable`

Any element marked with `data-clickable` will respond to clicks and its `data-event` will be emitted inside a `click` event.

### `data-selectable`

When an element with `data-selectable` is clicked, a `select` event is emitted, bound to the `data-group` set on the element. The elements with the same `data-group` and the same `data-event` as the clicked element will be marked with a `selected` class. So you always have to mark a selectable element with a group and an event. Additionally, if you mark it with `data-toggle`, if a selected element is clicked, it will be unselected and an event with an `undefined` value will be emitted for that group.

### Top-level structure

```html
<div id='editor'>
    <!-- The container for the Cytoscape.js interactive editor. -->
    <div id='editor-cytoscape'></div>
    
    <!-- A floating Aeon/BIODIVINE logo displayed in the top-right corner. -->
    <h1 class='aeon-logo'>...</h1>
    
    <!-- 
		The floating menus which are shown over the graph editor when 
		a node or edge is selected. Initially, they are positioned off-screen.
	-->
    <div id='editor-floating-node-menu'>...</div>
    <div id='editor-floating-edge-menu'>...</div>    
    
    <!-- A small menu with zoom controls for reliable editor navigation. -->
    <div id='editor-zoom-menu'>...</div>
    
    <!-- Main navigation component for opening panels. -->
    <div id='editor-dock'>...</div>
    
    <!-- Panels with individual editor functionalities. -->
    <div id='editor-panels'>...</div>
    
    
</div>
```

## Aeon Components

Components typically have their specific positioning properties. To place them in a website, it may be necessary to wrap them in a `div` that you can then position however you choose.

### Logo

The logo component is simply a nicely styled name of the tool. With CSS, we ensure that the logo height aligns with a `24px` grid. After all, it is more of a visual element than text element, so we want it to be aligned as much as possible. As such, `24px` margin is highly recommended. The width is `266px`, which is not aligned with `24px` (we decided to prefer height alignment) and the logo should fit in that space exactly.

```html
<h1 class="aeon-logo">Aeon<em>/</em><span>BIODIVINE</span></h1>
```

### Dock

A collection of vertically positioned buttons. Each button is a `48px` square, when you hover over the button, a pop-up hint will slide out on the left. This is completely managed in CSS, you just have to supply the hint. The only problem is that for the width animation to work, the hint has to fit into the provided `144px` of width.

```html
<div class="aeon-dock">
    <button>
        <img alt="Button hint" src="/path/to/image.svg" draggable="false">
        <label>Button hint</label>
    </button>    
</div>
```

Each button should respond to focus, hover, and can be assigned a `selected` class. You can then use `data-clickable` or `data-selectable` (possibly with `data-toggle`) to implement the desired overall behaviour.

### Panel

A panel is simply a screen area with a background and shadow. By default, it is `480px` wide, clips any horizontal overflow and allows scrolling for vertical overflow (Add `max-height` to limit how much the panel can grow vertically). However, you can make a panel resizeable by adding `resizeable` class to it. That way, a panel can be horizontally resized by the user (you may want to specify a `max-width` for it though).

```html
<div class="aeon-panel resizeable">

</div>
```

Inside panel, we have redefined styles of common HTML tags (so far, there is support for `h2`, `h3`, and `h4`). Mainly, this concerns eliminated margins (instead, use inline `style` or other means to position the elements) and redefined typography. Note that you can use `.single-line` to mark headlines you don't expect to overflow to align exactly to the `8px` grid.

#### Two-column layout

In non-resizeable panels, we support a two column layout:

```html
<div class="aeon-panel">
    <div class="columns">
        <div class="column left">
            ...
        </div>
        <div class="column right">
            ...
        </div>

        <!-- Use margin on separator to define top/bottom spacing. -->
        <div class="column-separator" style="margin: 40pt 0 16pt 0"></div>
        <div style="clear: both;"></div>
    </div>
</div>
```

#### Panel Box

TODO

### Buttons

#### Inline image button

A button that matches well with other text elements because it has not background. Th background is shown only when the button is focused or hovered. Dimensions as `16x16`, but the background adds extra `8px`. However, the button should compensate for this using relative positioning. *At the moment, there is not support for `selected`.*

```html
<button class="inline-image-button">
    <img src="/asset/img/close-24px.svg" draggable="false">
</button>
```

#### Compound button

Compound button displays two labels at once in the `left` and `right` elements. It has fixed dimensions, but you can modify them.

```html
<button class="compound-button">
    <span class="left">ACTION</span>
    <span class="right"><small>Longer<br>description</small></span>
</button>
```