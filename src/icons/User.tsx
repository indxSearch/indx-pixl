import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const User: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M3 0L4 0V1L3 1V0ZM3 4V3H2V2L5 2V3H4V4L3 4ZM3 4L3 5H2V4H3ZM4 4H5V5H4V4Z" fill={color}/>    
    </svg>
  );
};

export default User;
