// The plugin's main thread. Two commands:
//  sync   - builds or updates the "Pixl" page: one component per icon (a component set where it has colour
//           variants), filled from the "Pixl" variable collection so it follows Light and Dark. Run it in the
//           library file and publish that file; every other file takes the icons from the Assets panel.
//  insert - a panel to drop an icon anywhere: an instance of the local or published library component when
//           there is one, otherwise plain vectors.
// Components, sets, variants, sections and variables are found again by plugin data, never by name, so a
// renamed icon updates in place and the instances in other files keep their link.
import type { IconSpec, Layer, PaintSpec, PaintValue, PixlData } from './data';
import type { Fill } from '../../editor/src/model/types';

declare const PIXL_DATA: PixlData;
const { icons, paints } = PIXL_DATA;
const byId = new Map(icons.map((i) => [i.id, i]));

/** Pixels per cell in the library: 7×5 becomes 21×15, the npm package's default size. */
const SCALE = 3;
const GRID_WIDTH = 640, GAP = 24, PAD = 32, SECTION_GAP = 80;
const BASE_VARIANT = 'default', VARIANT_PROP = 'Colour';
const RETIRED = '_removed/'; // a leading underscore keeps a component out of the published library

// ---------- colours ----------

function rgba(hex: string): RGBA {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
}

/** A fill's colour in one mode, following linked library colours; a fill with no paint is a hex itself. */
function hexOf(fill: Fill, mode: 'light' | 'dark', seen = new Set<Fill>()): string {
  const p: PaintSpec | undefined = paints[fill];
  if (!p) return fill;
  const v: PaintValue = p[mode];
  if ('hex' in v) return v.hex;
  if (seen.has(fill)) return '#000000';
  seen.add(fill);
  return hexOf(v.alias, mode, seen);
}

function paintOf(fill: Fill, vars?: Map<Fill, Variable>): SolidPaint {
  const { r, g, b, a } = rgba(hexOf(fill, 'light'));
  const solid: SolidPaint = { type: 'SOLID', color: { r, g, b }, opacity: a };
  const v = vars?.get(fill);
  return v ? figma.variables.setBoundVariableForPaint(solid, 'color', v) : solid;
}

interface Palette { vars: Map<Fill, Variable>; hasDark: boolean }

async function findCollection(): Promise<VariableCollection | undefined> {
  return (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.getPluginData('pixl') === 'palette');
}

async function variablesOf(collection: VariableCollection): Promise<Map<Fill, Variable>> {
  const vars = new Map<Fill, Variable>();
  for (const id of collection.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v?.getPluginData('fill')) vars.set(v.getPluginData('fill'), v);
  }
  return vars;
}

/** The "Pixl" collection with a Light and a Dark mode and one variable per paint, created or brought up to date. */
async function ensurePalette(): Promise<Palette> {
  let collection = await findCollection();
  if (!collection) {
    collection = figma.variables.createVariableCollection('Pixl');
    collection.setPluginData('pixl', 'palette');
    collection.renameMode(collection.modes[0].modeId, 'Light');
  }
  const light = collection.modes[0].modeId;
  let dark = collection.modes.find((m) => m.name === 'Dark')?.modeId ?? null;
  if (!dark) {
    try { dark = collection.addMode('Dark'); } catch { dark = null; } // a plan with one mode per collection
  }
  const vars = await variablesOf(collection);
  for (const [fill, p] of Object.entries(paints)) {
    let v = vars.get(fill);
    if (!v) {
      v = figma.variables.createVariable(p.name, collection, 'COLOR');
      v.setPluginData('fill', fill);
      vars.set(fill, v);
    } else if (v.name !== p.name) v.name = p.name;
  }
  // Values after every variable exists, since a linked colour is an alias to another one.
  const valueOf = (pv: PaintValue): VariableValue =>
    'alias' in pv ? figma.variables.createVariableAlias(vars.get(pv.alias)!) : rgba(pv.hex);
  for (const [fill, p] of Object.entries(paints)) {
    const v = vars.get(fill)!;
    v.setValueForMode(light, valueOf(p.light));
    if (dark) v.setValueForMode(dark, valueOf(p.dark));
  }
  return { vars, hasDark: !!dark };
}

// ---------- drawing ----------

/** Replace what `target` draws with the layers at `scale` pixels per cell: one vector per fill, scaling with it. */
function draw(target: ComponentNode | FrameNode, spec: IconSpec, layers: Layer[], scale: number, vars?: Map<Fill, Variable>) {
  for (const child of [...target.children]) child.remove();
  target.fills = [];
  target.clipsContent = false;
  target.resizeWithoutConstraints(spec.w * scale, spec.h * scale);
  const paths = layers.map((l) => `<path d="${l.d}" fill="#000000"/>`).join('');
  const svg = figma.createNodeFromSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.w * scale}" height="${spec.h * scale}" viewBox="0 0 ${spec.w} ${spec.h}">${paths}</svg>`);
  const vectors = svg.findAll((n) => n.type === 'VECTOR') as VectorNode[];
  if (vectors.length !== layers.length) { svg.remove(); throw new Error(`${spec.name}: ${layers.length} paths came back as ${vectors.length} vectors`); }
  vectors.forEach((vector, i) => {
    const fill = layers[i].fill;
    const x = vector.absoluteTransform[0][2] - svg.absoluteTransform[0][2];
    const y = vector.absoluteTransform[1][2] - svg.absoluteTransform[1][2];
    target.appendChild(vector);
    vector.x = x; vector.y = y;
    vector.name = paints[fill]?.name.split('/').pop() ?? fill;
    vector.fills = [paintOf(fill, vars)];
    vector.strokes = [];
    vector.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  });
  svg.remove();
}

const componentName = (s: IconSpec) => `${s.kind}/${s.board}/${s.name}`;
const descriptionOf = (s: IconSpec) => [
  s.aliases.length ? `Also: ${s.aliases.join(', ')}` : '',
  s.react ? `React: <${s.react} /> from @indxsearch/pixl` : '',
].filter(Boolean).join('\n');

// ---------- sync ----------

type Library = ComponentNode | ComponentSetNode;

async function libraryPage(): Promise<PageNode> {
  let page = figma.root.children.find((p) => p.getPluginData('pixl') === 'page');
  if (!page) {
    page = figma.createPage();
    page.name = 'Pixl';
    page.setPluginData('pixl', 'page');
  }
  await figma.setCurrentPageAsync(page); // new components land on the current page
  return page;
}

/** A section per board holding a wrapping auto-layout frame, its ground the ladder's lv0 so it follows the mode. */
function boardGrid(page: PageNode, key: string, title: string, vars: Map<Fill, Variable>): FrameNode {
  let section = page.findChild((n) => n.type === 'SECTION' && n.getPluginData('board') === key) as SectionNode | null;
  if (!section) {
    section = figma.createSection();
    section.setPluginData('board', key);
    page.appendChild(section);
  }
  section.name = title;
  let grid = section.findChild((n) => n.type === 'FRAME' && n.getPluginData('grid') === '1') as FrameNode | null;
  if (!grid) {
    grid = figma.createFrame();
    grid.setPluginData('grid', '1');
    section.appendChild(grid);
    grid.layoutMode = 'HORIZONTAL';
    grid.layoutWrap = 'WRAP';
    grid.primaryAxisSizingMode = 'FIXED';
    grid.counterAxisSizingMode = 'AUTO';
    grid.resize(GRID_WIDTH, 100);
  }
  grid.name = title;
  grid.itemSpacing = GAP;
  grid.counterAxisSpacing = GAP;
  grid.paddingTop = grid.paddingBottom = grid.paddingLeft = grid.paddingRight = PAD;
  grid.fills = [paintOf('lv0', vars)];
  return grid;
}

function makeComponent(spec: IconSpec, layers: Layer[], vars: Map<Fill, Variable>, existing?: ComponentNode): ComponentNode {
  const c = existing ?? figma.createComponent();
  draw(c, spec, layers, SCALE, vars);
  return c;
}

/** The icon's library node in `grid`, created or redrawn. Returns it and whether it was new. */
function upsert(spec: IconSpec, node: Library | undefined, grid: FrameNode, vars: Map<Fill, Variable>): { node: Library; created: boolean } {
  const created = !node;
  let result: Library;
  if (!spec.variants.length) {
    result = makeComponent(spec, spec.layers, vars, node as ComponentNode | undefined);
    grid.appendChild(result);
  } else {
    const set = node as ComponentSetNode | undefined;
    const have = new Map((set?.children ?? []).map((c) => [c.getPluginData('variant'), c as ComponentNode]));
    const wanted = [{ id: 'base', name: BASE_VARIANT, layers: spec.layers }, ...spec.variants];
    const comps = wanted.map((v) => {
      const c = makeComponent(spec, v.layers, vars, have.get(v.id));
      c.name = `${VARIANT_PROP}=${v.name}`;
      c.setPluginData('variant', v.id);
      have.delete(v.id);
      return c;
    });
    if (!set) result = figma.combineAsVariants(comps, grid);
    else {
      comps.forEach((c, i) => set.insertChild(i, c));
      for (const gone of have.values()) gone.remove();
      result = set;
      grid.appendChild(result);
    }
    const s = result as ComponentSetNode;
    s.layoutMode = 'HORIZONTAL';
    s.primaryAxisSizingMode = 'AUTO';
    s.counterAxisSizingMode = 'AUTO';
    s.itemSpacing = 6;
    s.paddingTop = s.paddingBottom = s.paddingLeft = s.paddingRight = 6;
  }
  result.name = componentName(spec);
  result.description = descriptionOf(spec);
  result.setPluginData('id', spec.id);
  return { node: result, created };
}

async function sync(): Promise<string> {
  await figma.loadAllPagesAsync();
  const { vars, hasDark } = await ensurePalette();
  const page = await libraryPage();

  const found = new Map<string, Library>();
  for (const n of page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })) {
    if (n.type === 'COMPONENT' && n.parent?.type === 'COMPONENT_SET') continue;
    const id = n.getPluginData('id');
    if (id && !n.name.startsWith(RETIRED)) found.set(id, n);
  }

  const boards: { key: string; title: string; specs: IconSpec[] }[] = [];
  for (const spec of icons) {
    const key = `${spec.kind}/${spec.board}`;
    let b = boards.find((x) => x.key === key);
    if (!b) boards.push(b = { key, title: `${spec.kind} / ${spec.board}`, specs: [] });
    b.specs.push(spec);
  }

  let created = 0, updated = 0, retired = 0;
  const keys: Record<string, { key: string; set: boolean }> = {};
  const grids: FrameNode[] = [];
  for (const board of boards) {
    const grid = boardGrid(page, board.key, board.title, vars);
    grids.push(grid);
    for (const spec of board.specs) {
      let node = found.get(spec.id);
      found.delete(spec.id);
      if (node && (node.type === 'COMPONENT_SET') !== spec.variants.length > 0) { retire(node); retired++; node = undefined; }
      const r = upsert(spec, node, grid, vars);
      if (r.created) created++; else updated++;
      keys[spec.id] = { key: r.node.key, set: r.node.type === 'COMPONENT_SET' };
    }
  }
  // Icons no longer in pixl.json keep their node, so the instances made from them do not break,
  // but leave the published library and wait in a section of their own.
  if (found.size) {
    const grid = boardGrid(page, 'removed', 'removed: delete once nothing uses them', vars);
    grids.push(grid);
    for (const node of found.values()) { retire(node); grid.appendChild(node); retired++; }
  }

  // Stack the sections down the page.
  let y = 0;
  for (const grid of grids) {
    const section = grid.parent as SectionNode;
    grid.x = SECTION_GAP / 2; grid.y = SECTION_GAP / 2;
    section.x = 0; section.y = y;
    section.resizeWithoutConstraints(grid.width + SECTION_GAP, grid.height + SECTION_GAP);
    y += section.height + SECTION_GAP;
  }

  await figma.clientStorage.setAsync('library', keys);
  figma.viewport.scrollAndZoomIntoView(page.children);
  const counts = `${icons.length} icons: ${created} new, ${updated} updated${retired ? `, ${retired} retired` : ''}.`;
  return hasDark ? `Pixl synced. ${counts}` : `Pixl synced. ${counts} This plan allows one mode per collection, so the colours are Light only.`;
}

function retire(node: Library) {
  if (!node.name.startsWith(RETIRED)) node.name = RETIRED + node.name;
}

// ---------- insert ----------

/** The icon's component in this file's library page, or from the published library synced on this computer. */
async function libraryComponent(spec: IconSpec, variant: string): Promise<ComponentNode | null> {
  const pick = (n: BaseNode | null): ComponentNode | null => {
    if (!n) return null;
    if (n.type === 'COMPONENT') return n;
    if (n.type !== 'COMPONENT_SET') return null;
    return (n.children.find((c) => c.name === `${VARIANT_PROP}=${variant}`) as ComponentNode | undefined) ?? n.defaultVariant;
  };
  const page = figma.root.children.find((p) => p.getPluginData('pixl') === 'page');
  if (page) {
    await page.loadAsync();
    const local = page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })
      .find((n) => n.getPluginData('id') === spec.id && !n.name.startsWith(RETIRED));
    if (local) return pick(local);
  }
  const keys = (await figma.clientStorage.getAsync('library')) as Record<string, { key: string; set: boolean }> | undefined;
  const entry = keys?.[spec.id];
  if (!entry) return null;
  try {
    return pick(entry.set ? await figma.importComponentSetByKeyAsync(entry.key) : await figma.importComponentByKeyAsync(entry.key));
  } catch {
    return null; // the library file has not been published, or this file cannot reach it
  }
}

async function insert(id: string, variant: string, scale: number) {
  const spec = byId.get(id);
  if (!spec) return;
  let node: SceneNode;
  const component = await libraryComponent(spec, variant);
  if (component) {
    const instance = component.createInstance();
    instance.rescale(scale / SCALE);
    node = instance;
  } else {
    // No library to point at: plain vectors, bound to this file's Pixl variables if it has them.
    const collection = await findCollection();
    const vars = collection ? await variablesOf(collection) : undefined;
    const frame = figma.createFrame();
    const layers = variant === BASE_VARIANT ? spec.layers : spec.variants.find((v) => v.name === variant)?.layers ?? spec.layers;
    draw(frame, spec, layers, scale, vars);
    frame.name = variant === BASE_VARIANT ? spec.name : `${spec.name} ${variant}`;
    node = frame;
  }
  const target = figma.currentPage.selection[0];
  const parent = target && (target.type === 'FRAME' || target.type === 'SECTION' || target.type === 'COMPONENT') ? target : null;
  if (parent) {
    parent.appendChild(node);
    if (!(parent.type === 'FRAME' && parent.layoutMode !== 'NONE')) {
      node.x = Math.round((parent.width - node.width) / 2);
      node.y = Math.round((parent.height - node.height) / 2);
    }
  } else {
    figma.currentPage.appendChild(node);
    node.x = Math.round(figma.viewport.center.x - node.width / 2);
    node.y = Math.round(figma.viewport.center.y - node.height / 2);
  }
  figma.currentPage.selection = [node];
  figma.notify(component ? `${spec.name}: library instance` : `${spec.name}: plain vectors (no Pixl library found)`);
}

function openInsert() {
  figma.showUI(__html__, { width: 380, height: 560, themeColors: true, title: 'Pixl' });
  const colours: Record<Fill, { light: string; dark: string }> = {};
  for (const spec of icons)
    for (const l of [...spec.layers, ...spec.variants.flatMap((v) => v.layers)])
      colours[l.fill] ??= { light: hexOf(l.fill, 'light'), dark: hexOf(l.fill, 'dark') };
  figma.ui.postMessage({ type: 'icons', icons, colours });
  figma.ui.onmessage = (msg: { type: 'insert'; id: string; variant: string; scale: number }) => {
    if (msg.type === 'insert') insert(msg.id, msg.variant, msg.scale).catch((e) => figma.notify(`Insert failed: ${e.message}`, { error: true }));
  };
}

if (figma.command === 'sync') {
  sync().then(
    (message) => figma.closePlugin(message),
    (e) => { console.error(e); figma.closePlugin(`Sync failed: ${e.message}`); });
} else openInsert();
