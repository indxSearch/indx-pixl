import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Flower: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0H3V1H2V2H3V3H4V2H5V1H4V0ZM4 1V2H3V1H4ZM2 3H1V4H2V5H3V4H2V3ZM5 3H6V4H5V3ZM5 4V5H4V4H5Z" fill={color}/>    
    </svg>
  );
};

export default Flower;
