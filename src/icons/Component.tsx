import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Component: React.FC<IconProps> = ({
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
    <path d="M3 0H4V1H5V2H6V3H5V4H4V5H3V4H2V3H1V2H2V1H3ZM4 1H3V2H4ZM3 2H2V3H3ZM5 2H4V3H5ZM4 3H3V4H4Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Component;
