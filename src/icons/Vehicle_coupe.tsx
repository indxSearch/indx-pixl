import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Vehicle_coupe: React.FC<IconProps> = ({
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
    <path d="M1 0H4V1H5V2H6V4H5V5H4V4H2V5H1V4H0V1H1ZM2 1H1V2H2ZM4 1H3V2H4ZM2 3H1V4H2ZM5 3H4V4H5Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Vehicle_coupe;
