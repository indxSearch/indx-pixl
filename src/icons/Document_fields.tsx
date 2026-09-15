import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Document_fields: React.FC<IconProps> = ({
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
    <path d="M0 0H2V1H0ZM3 0H6V1H7V5H3ZM5 1H4V4H6V2H5ZM0 2H2V3H0ZM0 4H2V5H0Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Document_fields;
