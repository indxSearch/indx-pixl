import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Frost: React.FC<IconProps> = ({
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
    <path d="M3 5H2V4H3V5ZM5 5H4V4H5V5ZM1 4H0V3H1V4ZM4 4H3V3H4V4ZM7 4H6V3H7V4ZM3 3H1V2H3V3ZM6 3H4V2H6V3ZM1 2H0V1H1V2ZM4 2H3V1H4V2ZM7 2H6V1H7V2ZM3 0V1H2V0H3ZM5 1H4V0H5V1Z" fill={color}/>    
    </svg>
  );
};

export default Frost;
