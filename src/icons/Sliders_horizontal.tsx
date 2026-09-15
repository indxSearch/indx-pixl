import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Sliders_horizontal: React.FC<IconProps> = ({
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
    <path d="M5 0H6V1H7V2H6V3H5V2H3V1H5ZM6 1H5V2H6ZM1 2H2V3H4V4H2V5H1V4H0V3H1ZM2 3H1V4H2Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Sliders_horizontal;
