import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Sliders_vertical: React.FC<IconProps> = ({
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
    <path d="M0 0H3V3H2V5H1V3H0ZM2 1H1V2H2ZM5 0H6V1H7V4H6V5H5V4H4V1H5ZM6 2H5V3H6Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Sliders_vertical;
