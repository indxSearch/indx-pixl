import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Heart: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M5 0H4V1H3V0H2V1H1V2V3H2V4H3V5H4V4H5V3H6V2V1H5V0ZM5 1V2V3H4V4H3V3H2V2V1H3V2H4V1H5Z" fill={color}/>    
    </svg>
  );
};

export default Heart;
