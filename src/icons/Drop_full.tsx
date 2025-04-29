import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Drop_full: React.FC<IconProps> = ({
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
      <path d="M4 1L5 1V2L6 2L6 4H5V5L2 5L2 4H1L1 2L2 2V1L3 1V0L4 0V1Z" fill={color}/>
    </svg>
  );
};

export default Drop_full;
