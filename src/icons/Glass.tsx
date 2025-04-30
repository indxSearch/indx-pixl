import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Glass: React.FC<IconProps> = ({
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
    <path d="M5 3H4V4H5V5H2V4H3V3H2V2H5V3ZM6 0V2H5V1H2V2H1V0H6Z" fill={color}/>    
    </svg>
  );
};

export default Glass;
