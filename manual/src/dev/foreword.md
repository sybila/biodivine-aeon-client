# Developer Foreword

This part of the manual covers internal workings of Aeon, focusing on the technical aspects of the implementation and architecture. We briefly glance over topics like core algorithms and data structures, but for a detailed explanation of these, we mainly refer to some more thorough sources. 

> **On Biodivine libraries:** Aeon is part of the *Biodivine* ecosystem of tools and libraries, which are not strictly part of Aeon, but are integral to its functionality and were often developed together. Each component provides its own independent up-to-date documentation. However, to provide necessary context, this book also contains chapters describing the functionality of these internal components. For such chapters, we include links to the full documentation.

The structure of this "developer manual":

- **Project Landscape** describes the core technologies used to create Aeon, and both internal (using *Biodivine*) and external dependencies of the project.
- **Building Aeon** lists the tools and steps necessary to produce a working Aeon application, either as a website, or as a native desktop program.
- **Developer Guidelines** is a (hopefully) brief list of recommendations for the developers of *Biodivine* on how to keep the codebase clean, and what to avoid or prioritise. It covers both the *Rust* and *Web* parts, with *Rust* being mainly focused on general purpose libraries, and *Web* mostly referencing our application architecture (i.e. frontend with a hybrid native/web assembly backend).
- **Aeon Architecture** describes the actual modules in the Aeon repository.
  - **To be continued...**
- **Native components** contain tutorials and documentation for the independent Biodivine libraries maintained as part of the Aeon ecosystem:
  - **Biodivine Lib BDD** 
  - **Biodivine Param BN**
  - **To be continued...**
- **To be continued...**