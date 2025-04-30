import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Component: React.FC<IconProps> = ({
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
    <path d="M4 5H3V4H4V5ZM3 3V4H2V3H3ZM5 4H4V3H5V4ZM2 3H1V2H2V3ZM4 3H3V2H4V3ZM6 3H5V2H6V3ZM3 2H2V1H3V2ZM5 2H4V1H5V2ZM4 1H3V0H4V1Z" fill={color}/>    
    </svg>
  );
};

export default Component;
