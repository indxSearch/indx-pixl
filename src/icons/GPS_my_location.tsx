import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const GPS_my_location: React.FC<IconProps> = ({
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
    <path d="M4 1H5V2H6V3H5V4H4V5H3V4H2V3H1V2H2V1H3V0H4V1ZM4 2H3V3H4V2Z" fill={color}/>    
    </svg>
  );
};

export default GPS_my_location;
