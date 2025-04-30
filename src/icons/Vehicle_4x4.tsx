import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Vehicle_4x4: React.FC<IconProps> = ({
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
    <path d="M3 5H2V4H3V5ZM6 5H5V4H6V5ZM4 1H2V2H4V1H5V2H7V4H6V3H5V4H3V3H2V4H1V3H0V1H1V0H4V1Z" fill={color}/>    
    </svg>
  );
};

export default Vehicle_4x4;
