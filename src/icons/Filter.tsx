import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Filter: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0H2V1H4V2H7V1H4V0ZM0 2H3V3H0V2ZM7 3H4V4H2V5H4V4H7V3Z" fill={color}/>    
    </svg>
  );
};

export default Filter;
