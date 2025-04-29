import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Coverage: React.FC<IconProps> = ({
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
      <path d="M4 5L3 5V4H4V5ZM2 2H1L1 3L2 3V4L0 4L0 1L2 1L2 2ZM7 4L5 4L5 3L6 3V2H5V1L7 1L7 4ZM4 3H3V2H4V3ZM4 1L3 1V0L4 0V1Z" fill={color}/>
    </svg>
  );
};

export default Coverage;
