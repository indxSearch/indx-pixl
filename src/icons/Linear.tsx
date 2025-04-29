import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Linear: React.FC<IconProps> = ({
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
      <path d="M6 5L1 5L1 4H2V3L3 3V2L4 2V1L5 1V0L6 0L6 5Z" fill={color}/>
    </svg>
  );
};

export default Linear;
