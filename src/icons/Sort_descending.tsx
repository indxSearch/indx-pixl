import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Sort_descending: React.FC<IconProps> = ({
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
    <path d="M0 0H3V1H0ZM4 0H5V3H6V2H7V3H6V4H5V5H4V4H3V3H2V2H3V3H4ZM5 3H4V4H5ZM0 4H2V5H0Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Sort_descending;
