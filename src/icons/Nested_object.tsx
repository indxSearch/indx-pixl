import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Nested_object: React.FC<IconProps> = ({
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
    <path d="M2 4H3V5H1V3H2V4ZM5 4H6V5H4V3H5V4ZM1 3H0V2H1V3ZM4 3H3V2H4V3ZM7 3H6V2H7V3ZM3 1H2V2H1V0H3V1ZM6 1H5V2H4V0H6V1Z" fill={color}/>    
    </svg>
  );
};

export default Nested_object;
