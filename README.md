# `indx-pixl` — React Icon Components from Figma

`indx-pixl` is a strict 7x5 pixel grid icon set for React. Work in progress package.

## 📦 Installation

```bash
npm i @indxsearch/pixl
```

## 🛠 Usage

```tsx
import { Typing } from '@indxsearch/pixl';

const Example = () => (
  <Typing size={48} color="blue" />
);
```

Each icon accepts two optional props:
- `color` — Any CSS color (`string`). Optional: omit it to keep the icon's own level fills (`var(--lv0)`…`var(--lv8)` from `@indxsearch/systm`), which flip automatically in dark mode. Multi-tone icons only render as designed without `color`.
- `size` — A `number` (width in pixels), ideally use a number scaling with 7x5 ratio (14x10, 21x15, 28x20, etc.). The height is auto calculated.

### Colors

Icons use the `@indxsearch/systm` level (`--lv0`…`--lv8`) and accent variables, plus pixl's own colors (`--pixl-*`) defined in the editor. Pixl colors carry their light value as a fallback, so icons render without extra CSS. Import the stylesheet to get their dark-mode values:

```tsx
import '@indxsearch/pixl/colors.css';
```

---

Made by [Indx](https://indx.co)
