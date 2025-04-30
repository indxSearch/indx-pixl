import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Vehicle_motorcycle: React.FC<IconProps> = ({
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
    <path d="M2 5H1V4H2V5ZM5 5H4V4H5V5ZM1 4H0V3H1V4ZM3 2H5V3H4V4H2V3H1V2H2V1H3V2ZM6 4H5V3H6V4ZM4 1H3V0H4V1Z" fill={color}/>    
    </svg>
  );
};

export default Vehicle_motorcycle;
