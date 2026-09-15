import React from "react";

type IconProps = {
  /** Overrides every fill. Omit to keep the icon's own level fills (var(--lvN)). */
  color?: string;
  size?: number | string;
};

const Pattern_recognition: React.FC<IconProps> = ({
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
    <path d="M0 0H1V1H2V2H1V1H0ZM6 0H7V1H6V2H5V1H6ZM3 1H4V2H3ZM1 3H2V4H1V5H0V4H1ZM3 3H4V4H3ZM5 3H6V4H7V5H6V4H5Z" fill={color ?? "var(--lv8)"}/>    
    </svg>
  );
};

export default Pattern_recognition;
