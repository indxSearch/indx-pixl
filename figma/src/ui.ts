// The Insert icon panel: every icon and variant as a tile, searchable by name, alias and board.
import type { IconSpec, Layer } from './data';

interface Tile { spec: IconSpec; variant: string; layers: Layer[]; label: string; text: string }

const list = document.getElementById('list')!;
const q = document.getElementById('q') as HTMLInputElement;
const size = document.getElementById('size') as HTMLSelectElement;
let tiles: Tile[] = [];
let colours: Record<string, { light: string; dark: string }> = {};

const dark = () => document.documentElement.classList.contains('figma-dark');

function svgOf(t: Tile): string {
  const mode = dark() ? 'dark' : 'light';
  const paths = t.layers.map((l) => `<path d="${l.d}" fill="${colours[l.fill]?.[mode] ?? l.fill}"/>`).join('');
  return `<svg viewBox="0 0 ${t.spec.w} ${t.spec.h}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

function render() {
  const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = tiles.filter((t) => words.every((w) => t.text.includes(w)));
  list.replaceChildren();
  if (!shown.length) {
    list.innerHTML = '<p class="empty">No icon matches.</p>';
    return;
  }
  let board = '', grid: HTMLElement | null = null;
  for (const t of shown) {
    const title = `${t.spec.kind} / ${t.spec.board}`;
    if (title !== board) {
      board = title;
      const h = document.createElement('h2');
      h.textContent = title;
      grid = document.createElement('div');
      grid.className = 'grid';
      list.append(h, grid);
    }
    const b = document.createElement('button');
    b.title = t.label;
    b.innerHTML = svgOf(t);
    b.onclick = () => parent.postMessage({ pluginMessage: { type: 'insert', id: t.spec.id, variant: t.variant, scale: Number(size.value) } }, '*');
    grid!.append(b);
  }
}

window.onmessage = (e: MessageEvent) => {
  const msg = e.data.pluginMessage;
  if (msg?.type !== 'icons') return;
  colours = msg.colours;
  tiles = (msg.icons as IconSpec[]).flatMap((spec) => {
    const text = [spec.name, ...spec.aliases, spec.board, spec.kind].join(' ').toLowerCase();
    return [
      { spec, variant: 'default', layers: spec.layers, label: spec.aliases.length ? `${spec.name} (${spec.aliases.join(', ')})` : spec.name, text },
      ...spec.variants.map((v) => ({ spec, variant: v.name, layers: v.layers, label: `${spec.name} ${v.name}`, text: `${text} ${v.name}` })),
    ];
  });
  render();
};

q.oninput = render;
// Figma switches the theme class while the panel is open.
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
