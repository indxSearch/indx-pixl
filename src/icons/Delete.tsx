import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Delete: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M3 0H2V1H1V2H0V3H1V4H2V5H3H6H7V1V0H4H3ZM6 4V3H5V2H6V1H5V2H4V1H3V2H4V3H3V4H4V3H5V4H6Z" fill={color}/>    
    </svg>
  );
};

export default Delete;
