import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Glasses: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2V1H2V2L1 2L0 2V3H1H2V4H3V3H4V4H5V3H6H7V2L6 2H5V1H4V2H3ZM4 2L5 2V3H4V2ZM3 2V3H2V2L3 2Z" fill={color}/>
    </svg>
  );
};

export default Glasses;
