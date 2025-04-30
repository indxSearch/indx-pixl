import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Shield: React.FC<IconProps> = ({
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
    <path d="M4 5H3V4H4V5ZM3 4H2V3H3V4ZM5 4H4V3H5V4ZM2 3H1V0H6V3H5V1H2V3Z" fill={color}/>    
    </svg>
  );
};

export default Shield;
