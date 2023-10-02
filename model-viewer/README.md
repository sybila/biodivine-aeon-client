## AEON model viewer component

This folder describes a standalone JavaScript component that can be used to render `.aeon` models.
The component is based on the main AEON GUI, but most of the non-essential stuff has been removed
such that there is only the Cytoscape editor component.

To see how to work with the component, open `demo.html`. Everything is pure HTML/JS and uses
singletons. So at the moment, you cannot load multiple models viewers onto one page.

Open issues:
 - Allow multiple model viewers, not just a singleton as we have now.
 - So far, it is still possible to "select" nodes and regulations, since I thought it would be 
   nice to have the option to, e.g. see the update function of a node after clicking on it.
   But if we don't implement this, the ability to select nodes is useless.
 - The viewer still allows you to reposition model nodes arbitrarily. Maybe we can have a "freeze"
   argument that would prevent you from manipulating the model further?
 - There is no "reset camera" button. So if you lose the model (e.g. zoom in/out too much), there
   is no easy way of going back (except for a full refresh).
 - There is no "reset layout" button or "generate layout" button. If you move the nodes, you can't
   return to the original layout you had, nor can you generate a new automatic layout.
 - If you move the nodes, there's no way to save the layout. Maybe a simple "download .aeon" button
   can be added for people who want to jsut experiment with the layout but don't care about the
   rest of the network?
 - Maybe add +/- zoom buttons? Some computers have a very high scroll speed and this results in 
   very high zoom level changes. Buttons with fixed zoom level would allow such users to zoom 
   more easily without "losing" the model.
