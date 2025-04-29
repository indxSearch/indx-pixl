import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Csharp: React.FC<IconProps> = ({
  color = "black",
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
      <path d="M3 4V5H1V4H3ZM6 1H7V2H6V3H7V4H6V5H5V4H4V3H5V2H4V1H5V0H6V1ZM1 4H0V1H1V4ZM3 1H1V0H3V1Z" fill={color}/>
    </svg>
  );
};

export default Csharp;
