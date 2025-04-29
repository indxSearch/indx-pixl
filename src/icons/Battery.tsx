import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Battery: React.FC<IconProps> = ({
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
      <path d="M6 3V2H5V1H3V4H5V3H6ZM7 4H6V5H0V0H6V1H7V4Z" fill={color}/>
    </svg>
  );
};

export default Battery;
