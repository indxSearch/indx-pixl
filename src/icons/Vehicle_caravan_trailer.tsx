import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Vehicle_caravan_trailer: React.FC<IconProps> = ({
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
    <path d="M2 5H1V4H2V5ZM4 5H3V4H4V5ZM6 1H4V2H6V1H7V3H6V4H4V3H3V4H2V3H1V4H0V0H6V1ZM1 2H3V1H1V2Z" fill={color}/>    
    </svg>
  );
};

export default Vehicle_caravan_trailer;
