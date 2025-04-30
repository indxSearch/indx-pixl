import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Typing: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M3 0H2V1H3V0ZM1 2H0V3H1V2ZM4 2H5V3H4V2ZM7 2H6V3H7V2ZM2 2H3V3H2V2ZM5 4H4V5H5V4Z" fill={color}/>    
    </svg>
  );
};

export default Typing;
