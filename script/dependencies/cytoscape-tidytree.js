"use strict";
(() => {
  // src/alg/tree.ts
  var IYL = class _IYL {
    lowY;
    index;
    nxt;
    constructor(lowY, index, nxt) {
      this.lowY = lowY;
      this.index = index;
      this.nxt = nxt;
    }
    static updateIYL(minY, i, ih) {
      while (ih != void 0 && minY >= ih.lowY)
        ih = ih.nxt;
      return new _IYL(minY, i, ih);
    }
  };
  var Tree = class {
    isExtra;
    w;
    h;
    x;
    y;
    c;
    prelim = 0;
    mod = 0;
    shift = 0;
    change = 0;
    tl;
    tr;
    // Left and right thread.
    el;
    er;
    // Extreme left and right nodes.
    msel;
    mser;
    // Sum of modifiers at the extreme nodes.
    constructor(w, h, y, c, isExtra = false) {
      this.w = w;
      this.h = h;
      this.y = y;
      this.c = c;
      this.isExtra = isExtra;
    }
    layout() {
      this.firstWalk();
      this.secondWalk(0);
    }
    firstWalk() {
      if (this.c.length == 0) {
        this.setExtremes();
        return;
      }
      this.c[0].firstWalk();
      let ih = IYL.updateIYL(this.c[0].el.bottom(), 0, void 0);
      for (let i = 1; i < this.c.length; i++) {
        this.c[i].firstWalk();
        const minY = this.c[i].er.bottom();
        this.separate(i, ih);
        ih = IYL.updateIYL(minY, i, ih);
      }
      this.positionRoot();
      this.setExtremes();
    }
    setExtremes() {
      if (this.c.length == 0) {
        this.el = this;
        this.er = this;
        this.msel = this.mser = 0;
      } else {
        this.el = this.c[0].el;
        this.msel = this.c[0].msel;
        this.er = this.c[this.c.length - 1].er;
        this.mser = this.c[this.c.length - 1].mser;
      }
    }
    separate(i, ih) {
      let sr = this.c[i - 1];
      let mssr = sr.mod;
      let cl = this.c[i];
      let mscl = cl.mod;
      let first = true;
      while (sr !== void 0 && cl !== void 0) {
        if (sr.bottom() > ih.lowY)
          ih = ih.nxt;
        const dist = mssr + sr.prelim + sr.w - (mscl + cl.prelim);
        if (dist > 0 || first && dist <= 0) {
          mscl += dist;
          this.moveSubtree(i, ih.index, dist);
        }
        first = false;
        const sy = sr.bottom(), cy = cl.bottom();
        if (sy <= cy) {
          sr = sr.nextRightContour();
          if (sr !== void 0)
            mssr += sr.mod;
        }
        if (sy >= cy) {
          cl = cl.nextLeftContour();
          if (cl !== void 0)
            mscl += cl.mod;
        }
      }
      if (sr == void 0 && cl != void 0)
        this.setLeftThread(i, cl, mscl);
      else if (sr != void 0 && cl == void 0)
        this.setRightThread(i, sr, mssr);
    }
    moveSubtree(i, si, dist) {
      this.c[i].mod += dist;
      this.c[i].msel += dist;
      this.c[i].mser += dist;
      this.distributeExtra(i, si, dist);
    }
    nextLeftContour() {
      return this.c.length == 0 ? this.tl : this.c[0];
    }
    nextRightContour() {
      return this.c.length == 0 ? this.tr : this.c[this.c.length - 1];
    }
    bottom() {
      return this.y + this.h;
    }
    setLeftThread(i, cl, modsumcl) {
      const li = this.c[0].el;
      li.tl = cl;
      const diff = modsumcl - cl.mod - this.c[0].msel;
      li.mod += diff;
      li.prelim -= diff;
      this.c[0].el = this.c[i].el;
      this.c[0].msel = this.c[i].msel;
    }
    // Symmetrical to setLeftThread.
    setRightThread(i, sr, modsumsr) {
      const ri = this.c[i].er;
      ri.tr = sr;
      const diff = modsumsr - sr.mod - this.c[i].mser;
      ri.mod += diff;
      ri.prelim -= diff;
      this.c[i].er = this.c[i - 1].er;
      this.c[i].mser = this.c[i - 1].mser;
    }
    positionRoot() {
      this.prelim = (this.c[0].prelim + this.c[0].mod + this.c[this.c.length - 1].mod + this.c[this.c.length - 1].prelim + this.c[this.c.length - 1].w) / 2 - this.w / 2;
    }
    secondWalk(modsum) {
      modsum += this.mod;
      this.x = this.prelim + modsum;
      this.addChildSpacing();
      for (const child of this.c)
        child.secondWalk(modsum);
    }
    distributeExtra(i, si, dist) {
      if (si != i - 1) {
        const nr = i - si;
        this.c[si + 1].shift += dist / nr;
        this.c[i].shift -= dist / nr;
        this.c[i].change -= dist - dist / nr;
      }
    }
    // Process change and shift to add intermediate spacing to mod.
    addChildSpacing() {
      let d = 0, modsumdelta = 0;
      for (const child of this.c) {
        d += child.shift;
        modsumdelta += d + child.change;
        child.mod += modsumdelta;
      }
    }
  };

  // src/alg/layout.ts
  var Layout = class {
    options;
    constructor(options) {
      this.options = {
        horizontalSpacing: 10,
        verticalSpacing: 20,
        lineWidth: 3,
        layerHeight: void 0,
        ...options
      };
    }
    run(data) {
      const tree = this.makeTree(data, data.customY);
      tree.layout();
      this.setLayoutResult(data, tree);
      return tree;
    }
    makeTree(data, root_y = 0) {
      const outerWidth = data.w + this.options.horizontalSpacing;
      let outerHeight = data.h + this.options.verticalSpacing;
      let extraSpacing = data.extraVerticalSpacing ?? 0;
      const layerHeight = this.options.layerHeight;
      if (layerHeight !== void 0) {
        outerHeight = Math.ceil(outerHeight / layerHeight) * layerHeight;
        extraSpacing = Math.round(extraSpacing / layerHeight) * layerHeight;
      }
      if (data.customY !== void 0) {
        extraSpacing = data.customY - root_y;
        data.y = root_y + extraSpacing;
      }
      data.y = root_y + extraSpacing;
      const vertex = new Tree(
        outerWidth,
        outerHeight,
        data.y,
        data.children.map((child) => this.makeTree(child, data.y + outerHeight))
      );
      if (extraSpacing < 0) {
        console.warn("Node has negative extra space, ignoring", data);
      }
      if (extraSpacing > 0) {
        return new Tree(this.options.lineWidth, extraSpacing, root_y, [vertex], true);
      }
      return vertex;
    }
    setLayoutResult(data, tree) {
      if (tree.isExtra) {
        tree = tree.c[0];
      }
      data.x = tree.x + this.options.horizontalSpacing / 2;
      data.children.forEach((child, i) => this.setLayoutResult(child, tree.c[i]));
    }
  };

  // src/cy_layout.ts
  var DefaultOptions = class {
    //** Needed to for the layout to be called from cytoscape */
    name = "tidytree";
    /**
     * Specific layout options
     */
    dataOnly = false;
    // when enabled, nodes' positions aren't set
    horizontalSpacing = 20;
    // the width of the space between nodes in cytoscape units
    verticalSpacing = 40;
    // the height of the space between parent and child in cytoscape units
    // a map from node's id to how much space should be added between it and its parent
    extraVerticalSpacings = {};
    // a map from node's id to how much space should be added for the node to have this y position
    // overrides extraVerticalSpacings if both are set for a particular node
    // if the y position would result in the child not being below the parent, the setting is ignored and a warning is printed
    customYs = {};
    // the width of the space left after a node is moved down
    lineWidth = 5;
    // forces nodes to be positioned on multiples of this value if set
    layerHeight = void 0;
    // a sorting function for the children array of the tree representation
    // if undefined, the order is based on the order of the collection the layout was called on
    edgeComparator = void 0;
    // when not changed, the width and height of each node is read directly from the node
    // this parameter allows to supply your own sizes
    // if the h or w property is missing from the returned object, it is taken from the node
    sizeGetter = () => ({});
    /**
     * Layout options passed to nodes.layoutPositions()
     * https://js.cytoscape.org/#nodes.layoutPositions
     */
    fit = true;
    // if true, fits the viewport to the graph
    padding = 30;
    // the padding between the viewport and the graph on fit
    pan = void 0;
    // pan to a specified position, ignored if fit is enabled
    zoom = void 0;
    // how much to zoom the viewport, ignored if fit is enabled
    // a positive value which adjusts spacing between nodes (>1 means greater than usual spacing)
    spacingFactor = 1;
    // allows to transform a given node's position before it is applied
    transform = (n, p) => p;
    animate = false;
    // animate the layout`s changes
    animationDuration = 500;
    // duration of the animation in ms
    animationEasing = void 0;
    // easing of animation
    // returns true for nodes that should be animated, or false when the position should be set immediately
    animateFilter = () => true;
    ready = void 0;
    // callback for the start of the layout
    stop = void 0;
    // callback for the layout`s finish
    /**
     * Layout options passed to nodes.node.layoutDimensions()
     * https://js.cytoscape.org/#node.layoutDimensions
     */
    nodeDimensionsIncludeLabels = true;
    // if overflowing labels shoud count in the width or height of the node
  };
  function CyLayout(options) {
    this.options = {
      ...new DefaultOptions(),
      ...options
    };
  }
  CyLayout.prototype.createTreeData = function() {
    const includeLabels = this.options.nodeDimensionsIncludeLabels ?? true;
    const eles = this.options.eles;
    const ys = this.options.customYs;
    const vertSpaces = this.options.extraVerticalSpacings;
    const roots = /* @__PURE__ */ new Set();
    for (const node of eles.nodes()) {
      const dims = {
        ...node.layoutDimensions({ nodeDimensionsIncludeLabels: includeLabels }),
        ...this.options.sizeGetter(node)
      };
      const data = {
        id: node.id(),
        w: dims.w,
        h: dims.h,
        children: [],
        extraVerticalSpacing: vertSpaces[node.id()],
        customY: ys[node.id()] === void 0 ? void 0 : ys[node.id()] - dims.h / 2
      };
      node.scratch("tidytree", data);
      roots.add(data);
    }
    const comp = this.options.edgeComparator;
    const edges = comp === void 0 ? eles.edges() : eles.edges().sort(comp);
    for (const edge of edges) {
      const sourceData = edge.source().scratch("tidytree");
      const targetData = edge.target().scratch("tidytree");
      sourceData.children.push(targetData);
      roots.delete(targetData);
    }
    const newRoot = {
      w: 0,
      h: 0,
      children: Array.from(roots),
      customY: Math.min(-this.options.verticalSpacing, -(this.options.layerHeight ?? 0))
    };
    return newRoot;
  };
  CyLayout.prototype.run = function() {
    const treeData = this.createTreeData();
    const tree = new Layout(this.options).run(treeData);
    const nodes = this.options.eles.nodes();
    if (!this.options.dataOnly) {
      nodes.layoutPositions(this, this.options, (node) => {
        const data = node.scratch("tidytree");
        return { x: data.x + data.w / 2, y: data.y + data.h / 2 };
      });
    }
    return { treeData, tree };
  };

  // src/index.ts
  function register(cytoscape) {
    cytoscape("layout", "tidytree", CyLayout);
  }
  if (typeof window.cytoscape !== "undefined") {
    register(window.cytoscape);
  }
})();
//# sourceMappingURL=cytoscape-tidytree.js.map
