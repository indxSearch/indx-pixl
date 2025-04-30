import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Sliders_horizontal: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M5 1V0H6V1H5ZM5 2H4H3V1H4H5V2ZM6 2V3H5V2H6ZM6 2H7V1H6V2ZM1 3V4H0V3H1ZM2 3H1V2H2V3ZM3 3H2V4H1V5H2V4H3H4V3H3Z" fill={color}/>    
    </svg>
  );
};

export default Sliders_horizontal;
