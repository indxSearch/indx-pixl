import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Compose: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M1 0H2H4V1H2V4H5V2H6V4V5H1V4V0ZM4 2H5V1H6V0H5V1H4V2ZM4 2H3V3H4V2Z" fill={color}/>    
    </svg>
  );
};

export default Compose;
