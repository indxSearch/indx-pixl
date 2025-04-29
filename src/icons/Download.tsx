import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Download: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M5 0H6V1H5V0ZM4 2V1H5V2H4ZM3 2H4V3H3V2ZM2 1H3V2H2V1ZM2 1H1V0H2V1ZM7 4V5H0V4V3H1V4H6V3H7V4Z" fill={color}/>
    </svg>
  );
};

export default Download;
