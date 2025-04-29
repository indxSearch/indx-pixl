import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Status: React.FC<IconProps> = ({
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
      <path d="M2 5H1L1 4L2 4V5ZM6 5H5V4L6 4V5ZM1 4H0L0 1L1 1L1 4ZM4 4H3V3H4L4 4ZM7 4H6L6 1L7 1L7 4ZM3 3H2V2L3 2V3ZM5 3H4V2L5 2V3ZM4 2H3L3 1L4 1V2ZM2 1L1 1L1 0L2 0V1ZM6 1L5 1V0L6 0V1Z" fill={color}/>
    </svg>
  );
};

export default Status;
