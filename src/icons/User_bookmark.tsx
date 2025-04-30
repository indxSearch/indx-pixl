import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const User_bookmark: React.FC<IconProps> = ({
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
    <path d="M1 5H0L0 4H1L1 5ZM3 5H2V4H3V5ZM3 3H2V4L1 4V3H0L0 2L3 2V3ZM7 4H6L6 3L5 3L5 4H4L4 0L7 0L7 4ZM2 1L1 1L1 0L2 0V1Z" fill={color}/>    
    </svg>
  );
};

export default User_bookmark;
