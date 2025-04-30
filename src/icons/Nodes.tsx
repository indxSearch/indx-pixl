import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Nodes: React.FC<IconProps> = ({
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
    <path d="M2 5H1L1 4L2 4V5ZM4 5L3 5V4H4V5ZM6 5H5V4L6 4V5ZM1 3H0L0 2L1 2L1 3ZM3 3H2V2L3 2V3ZM5 3H4V2L5 2V3ZM7 3H6V2L7 2V3ZM2 1L1 1L1 0L2 0V1ZM4 1L3 1V0L4 0V1ZM6 1L5 1V0L6 0V1Z" fill={color}/>    
    </svg>
  );
};

export default Nodes;
