import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Personalise: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M2 0H3V1H2V0ZM1 2V3H2V4V5H3V4V3V2H1ZM6 3V2H4V3H5V4V5H6V4V3ZM6 0H5V1H6V0Z" fill={color}/>    
    </svg>
  );
};

export default Personalise;
