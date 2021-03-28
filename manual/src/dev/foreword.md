# Developer Foreword

In this section of the Aeon manual, we try to cover internal workings of Aeon. However, we mainly focus on the technical aspects of implementing Aeon. We briefly glance over topics like core algorithms and data structures, but for a detailed explanation of these, we mainly refer to some more thorough sources. 

**Note about internal libraries:** Aeon is composed of many components which are not strictly part of Aeon, but are integral to its functionality and were developed together. Each component provides its own independent up-to-date documentation, since this book is only updated with major releases of Aeon. However, to put the whole ecosystem into context, this book also contains chapters describing the functionality of these internal components in detail. For each such chapter, we include links to the full documentation.

The structure of this "developer manual":

- **Project Landscape** describes the core technologies used to create Aeon, and both internal (managed by Aeon developers) and external dependencies of the project.
- **Building Aeon** lists the tools and steps necessary to produce a working Aeon application, either as a deployable website, or as a native desktop program.
- **Developer Guidelines** is a (hopefully) brief list of recommendations for the developers of Aeon on how to keep the codebase clean and what to avoid or prioritize. It covers both the *Rust* and *Web* part, with *Rust* being mainly focused on general purpose libraries, and *Web* mostly referencing our application architecture (i.e. frontend with a hybrid native/web assembly backend).
- **Aeon Architecture** describes the actual modules in the Aeon repository.
  - **To be continued...**
- **Native components** contain tutorials and documentation for the independent Biodivine libraries maintained as part of the Aeon ecosystem:
  - **Biodivine Lib BDD** 
  - **Biodivine Param BN**
  - **To be continued...**
- **To be continued...**