import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Point_left: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M3 1L4 1V0L3 0V1ZM4 1L5 1V2V3V4V5H4L3 5H2V4L2 3L1 3H0V2L1 2H2L3 2H4L4 1ZM7 5H6L6 4V3V2L7 2V3L7 4V5Z" fill={color}/>    
    </svg>
  );
};

export default Point_left;
