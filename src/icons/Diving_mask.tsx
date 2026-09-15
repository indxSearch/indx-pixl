import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Diving_mask: React.FC<IconProps> = ({
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
    <path d="M1 0H4V1H5V3H4V4H6V0H7V4H6V5H4V4H3V5H2V4H1V3H0V1H1ZM2 1H1V3H2V2H3V3H4V1ZM3 3H2V4H3Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Diving_mask;
