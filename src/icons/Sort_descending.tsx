import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Sort_descending: React.FC<IconProps> = ({
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
    <path d="M2 5H0V4H2V5ZM5 5H4V4H5V5ZM4 4H3V3H4V4ZM6 4H5V3H6V4ZM3 3H2V2H3V3ZM5 3H4V0H5V3ZM7 3H6V2H7V3ZM3 1H0V0H3V1Z" fill={color}/>    
    </svg>
  );
};

export default Sort_descending;
