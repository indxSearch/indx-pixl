import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Vehicle_coupe: React.FC<IconProps> = ({
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
    <path d="M2 5H1V4H2V5ZM5 5H4V4H5V5ZM4 1H3V2H4V1H5V2H6V4H5V3H4V4H2V3H1V4H0V1H1V2H2V1H1V0H4V1Z" fill={color}/>    
    </svg>
  );
};

export default Vehicle_coupe;
