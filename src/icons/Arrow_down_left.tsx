import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Arrow_down_left: React.FC<IconProps> = ({
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
    <path d="M3 0H2V1H3V0ZM6 0H5L5 2L6 2L6 0ZM2 1L1 1V2L2 2V1ZM1 2H0L0 3H1L1 2ZM5 2H2V3L5 3V2ZM2 3H1V4H2L2 3ZM3 4H2V5H3V4Z" fill={color}/>    
    </svg>
  );
};

export default Arrow_down_left;
