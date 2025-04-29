import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Align_justify: React.FC<IconProps> = ({
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
      <path d="M6 5H1V4H6V5ZM6 3H1V2H6V3ZM6 1H1V0H6V1Z" fill={color}/>
    </svg>
  );
};

export default Align_justify;
