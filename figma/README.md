# Indx Pixl for Figma

A Figma plugin that brings the Pixl icons and pictograms into Figma, drawn by the editor's own export code
from `../pixl.json`.

- **Sync library to this file** builds or updates a page called "Pixl" with one component per icon,
  named `icons/<board>/<name>` or `pictograms/<board>/<name>`. Icons with colour variants become a
  component set with a `Colour` property. Every fill is bound to a variable in the "Pixl" collection,
  which has a Light and a Dark mode, so an icon follows the mode of the frame it sits in. Run it in
  the library file, then publish that file as a team library.
- **Insert icon** opens a searchable panel. A click inserts an instance of the library component: the
  one on this file's Pixl page, or else the published one, if the library was synced on this
  computer. Without a library it inserts plain vectors.

Sync updates components in place, so instances in other files keep their link through renames and
redraws. An icon that leaves `pixl.json` is not deleted: it is renamed `_removed/...`, which keeps it
out of the published library, and moved to a "removed" section to delete once nothing uses it.

## What it includes

Everything Export all writes, plus the finished pictograms (`Include in export` on): the pictogram
artboards stay switched off for npm until `@indxsearch/pixl/pictograms` ships, but designers can use
them now. Drafts and rejects stay out.

## Build and install

```bash
cd figma
npm install
npm run build    # writes dist/; also lists icons changed since the last Export all
npm run check    # type-check
```

In Figma desktop: **Plugins › Development › Import plugin from manifest…** and pick
`figma/manifest.json`. Run `npm run build` again after changing icons, then sync the library file again.

The `id` in `manifest.json` is a placeholder that is fine for development. Publishing the plugin
privately to an organisation, or to the Community, replaces it with the id Figma assigns.

A plan with one variable mode per collection (Figma's free plan) gets Light values only. The sync
message says so.
