import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Pc: React.FC<IconProps> = ({
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
    <path d="M4 5L1 5L1 4L2 4V3L0 3L0 0L5 0V3H3V4H4V5ZM7 5H5L5 3L7 3L7 5ZM1 2L4 2V1L1 1V2Z" fill={color}/>    
    </svg>
  );
};

export default Pc;
