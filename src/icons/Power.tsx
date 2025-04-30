import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Power: React.FC<IconProps> = ({
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
    <path d="M7 2H6V3H7V4H6V5H3V3H4V4H5V1H4V2H3V0H6V1H7V2ZM3 3H1V2H3V3ZM1 2H0V0H1V2Z" fill={color}/>    
    </svg>
  );
};

export default Power;
