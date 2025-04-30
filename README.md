# `indx-pixl` — React Icon Components from Figma

`indx-pixl` is a strict 7x5 pixel grid icon set for React.

## 📦 Installation

```bash
npm install indx-pixl
# or
yarn add indx-pixl
```

## 🛠 Usage

```tsx
import { Typing } from 'indx-pixl';

const Example = () => (
  <Typing size={48} color="blue" />
);
```

Each icon accepts two optional props:
- `color` — Any CSS color (`string`)
- `size` — A `number` (width in pixels), ideally use a number scaling with 7x5 ratio (14x10, 21x15, 28x20, etc.). The height is auto calculated.

## 📜 License

MIT

---

Made by [Indx Search](https://indx.co)
