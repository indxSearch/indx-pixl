import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Json: React.FC<IconProps> = ({
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
      <path d="M2 4H3V5H1L1 3L2 3V4ZM6 5H4V4H5L5 3L6 3L6 5ZM1 3H0L0 2L1 2L1 3ZM4 3H3V2H4V3ZM7 3H6V2L7 2V3ZM3 1L2 1L2 2H1L1 0L3 0V1ZM6 2H5V1L4 1V0L6 0V2Z" fill={color}/>
    </svg>
  );
};

export default Json;
