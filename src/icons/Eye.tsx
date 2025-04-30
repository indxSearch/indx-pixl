import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Eye: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M3 0H2V1H1V2H0V3H1V4H2V5H3H4H5V4H6V3H7V2H6V1H5V0H4H3ZM5 1V2H6V3H5V4H4H3H2V3H1V2H2V1H3H4H5ZM4 2H3V3H4V2Z" fill={color}/>    
    </svg>
  );
};

export default Eye;
