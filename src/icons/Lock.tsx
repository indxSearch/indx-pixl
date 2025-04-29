import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Lock: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3 0H4H5V1H4H3H2V0H3ZM4 2H3H2V1H1V2V3V4V5H2H3H4H5H6V4V3V2V1H5V2H4ZM3 3H4V4H3V3Z" fill={color}/>
    </svg>
  );
};

export default Lock;
