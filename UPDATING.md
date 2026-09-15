# Updating Icons

This guide explains how to add new icons to the `indx-pixl` icon set.

## The editor (recommended)

Icons are drawn in the in-repo editor, a Figma-like canvas built on `@indxsearch/systm`:

```bash
npm run editor:install   # once
npm run editor           # opens http://localhost:5175
```

- **Artboards** group icons ("Core icons", "Car illustrations"). They are organization only.
- **Arrange icons** (artboard inspector or right-click) lays icons out in a grid. Columns, gap and padding are stored per artboard.
- **Icons** are components: 7×5 frames with a name. Draw loose rects on an artboard, select them and press **⌘⌥K** (or *Make component*) to turn them into an icon. Only components are exported.
- **Fills** are levels `lv0`–`lv8` (exported as `var(--lvN)`, so they flip in dark mode) or free hex colors. Keys `0`–`8` set the level of the selection.
- **Saving is automatic.** Edits are written to `pixl.json`, the editable source of truth, about a second after you stop. ⌘S saves right away. If the file changes on disk (another tab, `git pull`, checkout), an idle editor reloads it. With unsaved edits you get a banner to reload from disk or keep your version. Commit `pixl.json`.
- **Export all** writes one `raw-icons/<name>.svg` per component and can run `convert-icons.js` in the same step.
- **Paste from Figma**: in Figma select a frame, right-click › Copy/Paste as › **Copy as SVG**, then ⌘V in the editor. Each clipped child frame becomes an icon, and layer names come through if Figma's export setting "Include id attribute" is on. Grays close to a level become that level, other colors stay hex. The icons land on the selected artboard (below its content) or a new one. With an icon open, a single pasted icon is added into it.
- **Import** pulls `raw-icons/` into a new artboard, rasterizing Figma paths to rects (one-time migration, or to pick up hand-made SVGs).

Shortcuts: V select · A artboard · I icon · R rect · double-click an icon to edit its rects · Esc to leave · ⌘D duplicate · ⌘[ ⌘] order · ⌘Z undo · Space+drag pan · ⌘+scroll zoom.

## Adding New Icons by hand

### 1. Prepare Your SVG File

Create an SVG icon following these requirements:
- **Grid**: Must be on a strict 7x5 pixel grid
- **ViewBox**: Should have `viewBox="0 0 7 5"`
- **Shapes**: `<rect>` and/or `<path>` elements (the editor exports rects)
- **Fill**: `var(--lvN)` fills are kept and flip with the systm level system; any other fill becomes the fallback when no `color` prop is passed

### 2. Add to Raw Icons Folder

Place your SVG file in the `raw-icons/` directory:
```bash
raw-icons/my-icon-name.svg
```

The filename will be converted to a React component name:
- Spaces become underscores
- Converted to PascalCase
- Example: `my icon name.svg` → `My_icon_name.tsx`

### 3. Run the Conversion Script

Execute the conversion script to generate React components:
```bash
node convert-icons.js
```

This will automatically:
- Generate a React component in `src/icons/`
- Add the component props (`color`, `size`)
- Calculate aspect ratio automatically
- Update `src/icons/index.ts` with the new export

### 4. Build and Test

Build the package and test your new icon:
```bash
npm run build
```

## Generated Component Structure

Each generated component includes:
- **color prop**: Optional. When set, overrides every fill (single-tone icon). When omitted, the icon keeps its level fills (`var(--lvN)`), so multi-tone icons render with the design system's grayscale and flip in dark mode.
- **size prop**: Width in pixels as a number (default: `21`)
- **Auto-calculated height**: Maintains the 7:5 aspect ratio

Example usage:
```tsx
import { MyIconName } from '@indxsearch/pixl';

<MyIconName size={28} color="blue" />
```

## Recommended Size Values

Use multiples that maintain the 7:5 ratio:
- 14x10
- 21x15 (default)
- 28x20
- 35x25
- 42x30
