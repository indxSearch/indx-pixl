import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Frost: React.FC<IconProps> = ({
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
    <path d="M2 0H3V1H4V0H5V1H4V2H6V1H7V2H6V3H7V4H6V3H4V4H5V5H4V4H3V5H2V4H3V3H1V4H0V3H1V2H0V1H1V2H3V1H2ZM4 2H3V3H4Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Frost;
