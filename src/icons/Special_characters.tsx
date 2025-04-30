import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Special_characters: React.FC<IconProps> = ({
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
    <path d="M6 1H4V2H5V3H4V4H6V5H3V3H2V5H1V1H2V2H3V1H2V0H6V1Z" fill={color}/>    
    </svg>
  );
};

export default Special_characters;
