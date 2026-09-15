import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Typing: React.FC<IconProps> = ({
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
    <path d="M2 0H3V1H2ZM0 2H1V3H0ZM2 2H3V3H2ZM4 2H5V3H4ZM6 2H7V3H6ZM4 4H5V5H4Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Typing;
