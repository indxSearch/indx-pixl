# Updating icons

How to add or change icons and publish a new version of `@indxsearch/pixl`.

## With the editor (recommended)

1. **Start the editor** from the repo root. See [editor/README.md](editor/README.md) for details.

   ```bash
   npm run editor:install   # first time only
   npm run editor
   ```

2. **Draw or change icons.** Work on a draft artboard, or mark icons as drafts, until they're ready. Changes save to `pixl.json` automatically.
3. **Export.** Click **Export all** and keep "Run convert-icons.js afterwards" checked. This writes `raw-icons/*.svg` and `colors.css`, and regenerates `src/icons/`.
4. **Build.**

   ```bash
   npm run build
   ```

5. **Commit** `pixl.json`, `raw-icons/`, `colors.css`, `src/icons/` and `dist/` together.
6. **Publish.** Bump the version in `package.json`, then:

   ```bash
   npm publish
   ```

Renaming an icon changes its component name, and renaming a color changes its `--pixl-*` variable. Treat both as breaking changes for apps that use them.

## By hand

The editor is the source of truth. An SVG added by hand is overwritten by the next Export all unless you also bring it into `pixl.json`, using **Import** or by pasting it into the editor.

1. **Create an SVG** on a 7×5 grid with `viewBox="0 0 7 5"`, made of `<rect>` or `<path>` elements. Fill with `var(--lvN)`, a systm accent such as `var(--CSignal)`, a `var(--pixl-name, #hex)` color, or hex.
2. **Add it** to `raw-icons/` as `raw-icons/my icon.svg`.
3. **Convert and build.**

   ```bash
   node convert-icons.js
   npm run build
   ```

## What the converter generates

`convert-icons.js` turns every SVG in `raw-icons/` into a component in `src/icons/` and updates `src/icons/index.ts`.

- **Names:** the first letter is capitalized and spaces become underscores. `my icon.svg` becomes `My_icon`.
- **`size`:** the width, defaulting to 21. The height follows the aspect ratio of the viewBox.
- **`color`:** optional. Each fill becomes `fill={color ?? "<original fill>"}`, so `color` overrides everything and leaving it out keeps the design's own fills.
