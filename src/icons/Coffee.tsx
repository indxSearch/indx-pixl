import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Coffee: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3 0H2V1H1H0V2V3H1V2H2V3V4H3V5H4H5H6V4H7V3V2V1V0H6H5H4H3ZM6 1H5H4H3V2V3V4H4H5H6V3V2V1Z" fill={color}/>
    </svg>
  );
};

export default Coffee;
