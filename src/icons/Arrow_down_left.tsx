import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Arrow_down_left: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M2 1H3V0H2V1ZM1 2V1H2V2H3H4H5V1V0H6V1V2H5V3H4H3H2V4H3V5H2V4H1V3H0V2H1ZM1 2V3H2V2H1Z" fill={color}/>    
    </svg>
  );
};

export default Arrow_down_left;
