import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Plus: React.FC<IconProps> = ({
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
    <path d="M4 5L3 5V3L1 3L1 2L3 2L3 0L4 0V2H6V3H4V5Z" fill={color}/>    
    </svg>
  );
};

export default Plus;
