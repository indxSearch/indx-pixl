import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Code: React.FC<IconProps> = ({
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
      <path d="M3 5H2V4H3V5ZM5 4V5H4V4H5ZM2 4H1V3H2V4ZM6 4H5V3H6V4ZM1 3H0V2H1V3ZM7 3H6V2H7V3ZM2 2H1V1H2V2ZM6 2H5V1H6V2ZM3 1H2V0H3V1ZM5 1H4V0H5V1Z" fill={color}/>
    </svg>
  );
};

export default Code;
