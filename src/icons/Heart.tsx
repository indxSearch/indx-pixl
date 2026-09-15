import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Heart: React.FC<IconProps> = ({
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
    <path d="M2 0H3V1H4V0H5V1H6V3H5V4H4V5H3V4H2V3H1V1H2ZM3 1H2V3H3V4H4V3H5V1H4V2H3Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Heart;
