import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Volume_mute: React.FC<IconProps> = ({
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
      <path d="M3 5H2V4H1V3H0V2H1V1H2V0H3V5ZM5 4H4V3H5V4ZM7 4H6V3H7V4ZM6 3H5V2H6V3ZM5 2H4V1H5V2ZM7 2H6V1H7V2Z" fill={color}/>
    </svg>
  );
};

export default Volume_mute;
