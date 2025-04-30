import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Virtual_reality_headset: React.FC<IconProps> = ({
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
    <path d="M3 5H1V4H3V5ZM6 5H4V4H6V5ZM1 4H0V1H1V4ZM4 4H3V3H4V4ZM7 4H6V1H7V4ZM6 0V1H1V0H6Z" fill={color}/>    
    </svg>
  );
};

export default Virtual_reality_headset;
