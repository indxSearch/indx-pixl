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

- Menu bar at the top with File, Edit, and View actions.
- Tool strip on the left.
- Layers/search panel beside the tools.
- Central canvas with a tight block-grid pixel editor and real-size preview.
- Inspector on the right with selected icon metadata.
- Status bar with the main shortcuts.

Keys and mouse:

- `/` or `F3` focuses search.
- `F4` focuses the pixel canvas.
- `F9` opens the icon gallery popup.
- Arrow keys move the pixel cursor in the selected icon.
- `Space` or `Enter` toggles the current pixel.
- Left-click or drag on the canvas paints pixels on.
- Right-click or drag erases pixels.
- `S` or `Ctrl+S` saves the selected icon back to `pixl.json`.
- `Esc` or `Ctrl+Q` quits.

Search uses `IndxSearchLib` v5 RC in memory over icon name, artboard, and combined text fields, with a local fallback if the in-memory index cannot initialize. The gallery is a modal sheet like IndxWorkbench rather than a permanent canvas panel.
