const fs = require('fs');
const path = require('path');

const inputFolder = path.join(__dirname, 'raw-icons');
const outputFolder = path.join(__dirname, 'src/icons');

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

const files = fs.readdirSync(inputFolder).filter(file => file.endsWith('.svg'));

files.forEach(file => {
  const componentName = path.basename(file, '.svg')
    .replace(/(^\w|-\w)/g, clear => clear.replace('-', '').toUpperCase());

  const svgContent = fs.readFileSync(path.join(inputFolder, file), 'utf8');

  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  const pathMatch = svgContent.match(/<path[^>]*>/g);

  if (!viewBoxMatch || !pathMatch) {
    console.error(`Skipping ${file}: missing viewBox or path`);
    return;
  }

  const [viewBox] = viewBoxMatch;
  const paths = pathMatch.join('\n');

  const widthMatch = svgContent.match(/width="([^"]+)"/);
  const heightMatch = svgContent.match(/height="([^"]+)"/);

  const width = widthMatch ? parseFloat(widthMatch[1]) : 7;
  const height = heightMatch ? parseFloat(heightMatch[1]) : 5;
  const aspectRatio = height / width;

  const component = `import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const ${componentName}: React.FC<IconProps> = ({
  color = "black",
  size = ${width * 3},
}) => {
  const aspectRatio = ${aspectRatio};
  const width = size;
  const height = typeof size === "number" ? size * aspectRatio : \`calc(\${size} * ${aspectRatio})\`;

  return (
    <svg
      width={width}
      height={height}
      ${viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${paths.replace(/fill="[^"]*"/g, 'fill={color}')}
    </svg>
  );
};

export default ${componentName};
`;

  fs.writeFileSync(path.join(outputFolder, `${componentName}.tsx`), component);
  console.log(`Generated ${componentName}.tsx`);
});

console.log('✅ All icons converted!');

// --- After generating all icons ---
const exportLines = files.map(file => {
    const componentName = path.basename(file, '.svg')
      .replace(/(^\w|-\w)/g, clear => clear.replace('-', '').toUpperCase());
    return `export { default as ${componentName} } from './${componentName}';`;
  });
  
  const indexFile = path.join(outputFolder, 'index.ts');
  fs.writeFileSync(indexFile, exportLines.join('\n') + '\n');
  console.log('✅ index.ts generated!');
  