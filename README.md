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
- `color` — Any CSS color (`string`)
- `size` — A `number` (width in pixels), ideally use a number scaling with 7x5 ratio (14x10, 21x15, 28x20, etc.). The height is auto calculated.

---

Made by [Indx](https://indx.co)
