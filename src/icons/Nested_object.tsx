import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Nested_object: React.FC<IconProps> = ({
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
    <path d="M1 0H3V1H2V2H1V3H2V4H3V5H1V3H0V2H1ZM4 0H6V1H5V2H4V3H5V4H6V5H4V3H3V2H4ZM6 2H7V3H6Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Nested_object;
