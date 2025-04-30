import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const ArrowRight: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M5 0H4V1H5V2H4H3H2H1V3H2H3H4H5V4H4V5H5V4H6V3H7V2H6V1H5V0ZM6 2H5V3H6V2Z" fill={color}/>    
    </svg>
  );
};

export default ArrowRight;
