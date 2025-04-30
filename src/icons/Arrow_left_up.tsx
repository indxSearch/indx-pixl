import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Arrow_left_up: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M5 4H6V5H5H4V4H5ZM3 2V3V4H4V3V2H5V3H6V2H5V1H4V0H3V1H2V2H1V3H2V2H3ZM3 2V1H4V2H3Z" fill={color}/>    
    </svg>
  );
};

export default Arrow_left_up;
