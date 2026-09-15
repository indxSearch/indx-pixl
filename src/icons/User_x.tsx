import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const User_x: React.FC<IconProps> = ({
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
    <path d="M1 0H2V1H1ZM4 0H5V1H6V0H7V1H6V2H7V3H6V2H5V3H4V2H5V1H4ZM0 2H3V3H2V4H3V5H2V4H1V5H0V4H1V3H0Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default User_x;
