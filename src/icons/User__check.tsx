import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const User__check: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0L2 0V1L1 1L1 0ZM1 4V3H0L0 2L3 2V3H2V4L1 4ZM1 4L1 5H0L0 4H1ZM2 4H3V5H2V4ZM4 2H3L3 1L4 1V2ZM5 2L4 2V3H5V2ZM6 1V2H5V1L6 1ZM6 1L7 1V0L6 0V1Z" fill={color}/>
    </svg>
  );
};

export default User__check;
