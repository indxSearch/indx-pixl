# indx-pixl console

Terminal.Gui workbench for browsing and editing the pixl icon set from the terminal.

Run it from the repository root or from this folder:

```sh
dotnet run --project console/IndxPixl.Console.csproj
```

or, inside `console`:

```sh
dotnet run
```

The app loads `pixl.json` when it exists, so the gallery follows the same artboards and categories as the canvas editor. If `pixl.json` is missing it falls back to `raw-icons/*.svg` for a read-only preview.

Layout:

- Menu bar at the top with File, Edit, and View actions, including File > New Icon.
- Layers/search panel on the left.
- Central canvas with a doubled-scale block-grid pixel editor and real-size preview. The drawing surface uses lv-style greys: light grey in light mode, darker grey in dark mode.
- Inspector on the right with selected icon metadata.
- Status bar with the main shortcuts.

Keys and mouse:

- `Ctrl+N` opens the New Icon dialog.
- `/` or `F3` focuses search.
- `F4` focuses the pixel canvas.
- `F9` opens the icon gallery popup.
- Arrow keys move the pixel cursor in the selected icon.
- `Space` or `Enter` toggles the current pixel.
- Click or drag on the canvas toggles each pixel you touch once per gesture.
- `S` or `Ctrl+S` saves the selected icon back to `pixl.json`.
- `Esc` or `Ctrl+Q` quits.

Search uses `IndxSearchLib` v5 RC in memory over icon name, artboard, and combined text fields, with a local fallback if the in-memory index cannot initialize. The gallery is a modal sheet like IndxWorkbench rather than a permanent canvas panel.


## New icons and drafts

Use `File > New Icon` or `Ctrl+N` to create a blank 7 x 5 icon. The dialog asks for:

- Name
- Artboard, including `Drafts`
- Whether the icon is exportable

The icon is added to the selected artboard in `pixl.json` and selected for editing. Auto-layout artboards use their grid settings (`cols`, `gap`, `pad`) to place the new icon in the next slot. Non-grid artboards use a simple stacked draft placement.


## Move existing icons

Use the Edit menu to move the selected icon:

- `Edit > Move to Drafts` moves it to the `Drafts` artboard and turns export off.
- `Edit > Move to Artboard...` opens an artboard picker and lets you set exportability.

When an icon moves, the JSON object is moved between artboard `icons` arrays, placed in the next destination slot, saved to `pixl.json`, and selected again for editing.
