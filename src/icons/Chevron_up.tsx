import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Chevron_up: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M3 2H4V3H5V4H6V3H5V2H4V1H3V2ZM2 3V2H3V3H2ZM2 3V4H1V3H2Z" fill={color}/>    
    </svg>
  );
};

export default Chevron_up;
