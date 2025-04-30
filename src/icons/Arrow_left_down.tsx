import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Arrow_left_down: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M5 1H6V0H5H4V1H5ZM3 3V2V1H4V2V3H5V2H6V3H5V4H4V5H3V4H2V3H1V2H2V3H3ZM3 3V4H4V3H3Z" fill={color}/>    
    </svg>
  );
};

export default Arrow_left_down;
