import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Microphone: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0H3V1H2V2V3H3V4H2V5H3H4H5V4H4V3H5V2V1H4V0ZM4 1V2H3V1H4ZM6 3V2V1H7V2V3H6ZM0 3V2V1H1V2V3H0Z" fill={color}/>    
    </svg>
  );
};

export default Microphone;
