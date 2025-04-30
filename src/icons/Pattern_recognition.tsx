import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Pattern_recognition: React.FC<IconProps> = ({
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
    <path d="M1 5H0V4H1V5ZM7 5H6V4H7V5ZM2 4H1V3H2V4ZM4 4H3V3H4V4ZM6 4H5V3H6V4ZM2 2H1V1H2V2ZM4 2H3V1H4V2ZM6 1V2H5V1H6ZM1 1H0V0H1V1ZM7 1H6V0H7V1Z" fill={color}/>    
    </svg>
  );
};

export default Pattern_recognition;
