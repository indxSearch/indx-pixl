import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Clock: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M2 0H3H4H5V1H4V2H5V1H6V2V3V4H5V3H4H3V2V1H2V0ZM2 4H1V3V2V1H2V2V3V4ZM2 4V5H3H4H5V4H4H3H2Z" fill={color}/>    
    </svg>
  );
};

export default Clock;
