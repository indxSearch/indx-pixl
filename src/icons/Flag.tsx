import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Flag: React.FC<IconProps> = ({
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
    <path d="M4 1H1V2H3V3H1V5H0V0H4V1ZM6 4H3V3H5V2H4V1H6V4Z" fill={color}/>    
    </svg>
  );
};

export default Flag;
