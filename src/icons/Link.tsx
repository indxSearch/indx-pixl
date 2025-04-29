import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Link: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M5 1H6V2H5H4V1H5ZM6 3V2H7V3H6ZM6 3V4H5H4V3H5H6ZM0 2H1V3H0V2ZM1 3H2H3V4H2H1V3ZM2 1H1V2H2H3V1H2Z" fill={color}/>
    </svg>
  );
};

export default Link;
