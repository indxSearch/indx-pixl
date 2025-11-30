# Updating Icons

This guide explains how to add new icons to the `indx-pixl` icon set.

## Adding New Icons

### 1. Prepare Your SVG File

Create an SVG icon following these requirements:
- **Grid**: Must be on a strict 7x5 pixel grid
- **ViewBox**: Should have `viewBox="0 0 7 5"`
- **Paths**: Must contain at least one `<path>` element
- **Fill**: Path fills will be replaced with the dynamic `color` prop

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
- **color prop**: Accepts any CSS color (default: `"black"`)
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
