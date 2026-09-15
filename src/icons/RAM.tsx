import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Ram: React.FC<IconProps> = ({
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
    <path d="M0 0H7V2H6V1H1V2H0ZM2 2H3V3H2ZM4 2H5V3H4ZM0 3H1V4H4V5H0ZM6 3H7V5H5V4H6Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Ram;
