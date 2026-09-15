import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Nodes: React.FC<IconProps> = ({
  color,
  size = 21,
}) => {
  const aspectRatio = 0.7142857142857143;
  const width = size;
  const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 7 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
    <path d="M1 0H2V1H1ZM3 0H4V1H3ZM5 0H6V1H5ZM0 2H1V3H0ZM2 2H3V3H2ZM4 2H5V3H4ZM6 2H7V3H6ZM1 4H2V5H1ZM3 4H4V5H3ZM5 4H6V5H5Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Nodes;
