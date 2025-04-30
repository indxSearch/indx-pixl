import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Thumbs_up: React.FC<IconProps> = ({
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
    <path d="M1 5H0L0 2L1 2L1 5ZM3 2L5 2L5 5L2 5L2 0L3 0L3 2Z" fill={color}/>    
    </svg>
  );
};

export default Thumbs_up;
