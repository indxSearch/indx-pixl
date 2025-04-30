import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Git_pull_request: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M1 0H2V1H1V0ZM1 2H0V1H1V2ZM2 2H1V3V4V5H2V4V3V2ZM2 2H3V1H2V2ZM5 1H4V2H5V3H4V4H5V5H6V4H7V3H6V2V1H5ZM6 3V4H5V3H6Z" fill={color}/>    
    </svg>
  );
};

export default Git_pull_request;
