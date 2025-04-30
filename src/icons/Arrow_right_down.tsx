import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Arrow_right_down: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M1 0H2H3V1H2H1V0ZM4 3V2V1H3V2V3H2V2H1V3H2V4H3V5H4V4H5V3H6V2H5V3H4ZM4 3V4H3V3H4Z" fill={color}/>    
    </svg>
  );
};

export default Arrow_right_down;
