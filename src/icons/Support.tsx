import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Support: React.FC<IconProps> = ({
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
    <path d="M6 5H3V4H6V5ZM1 4H0V1H1V4ZM7 3H8V4H6V1H7V3ZM3 3H2V2H3V3ZM5 3H4V2H5V3ZM6 1H1V0H6V1Z" fill={color}/>    
    </svg>
  );
};

export default Support;
