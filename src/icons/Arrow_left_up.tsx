import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Arrow_left_up: React.FC<IconProps> = ({
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
    <path d="M6 5L4 5V4H6V5ZM4 4L3 4L3 2L4 2V4ZM2 3H1L1 2H2L2 3ZM6 3H5V2L6 2V3ZM3 2L2 2L2 1H3V2ZM5 2H4L4 1L5 1V2ZM4 1L3 1V0L4 0V1Z" fill={color}/>    
    </svg>
  );
};

export default Arrow_left_up;
