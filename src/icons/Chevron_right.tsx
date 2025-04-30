import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Chevron_right: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M3 0H2V1H3V2H4V3H3V4H2V5H3V4H4V3H5V2H4V1H3V0Z" fill={color}/>    
    </svg>
  );
};

export default Chevron_right;
