import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Fields: React.FC<IconProps> = ({
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
    <path d="M0 0H3V1H5V0H7V1H5V2H3V1H0ZM0 2H2V3H0ZM6 2H7V3H6ZM3 3H5V4H7V5H5V4H3V5H0V4H3Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Fields;
