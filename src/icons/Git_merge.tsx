import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Git_merge: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M2 0H1V1H0V2H1V3V4V5H2V4H3H4H5V5H6V4H7V3H6V2H5V3H4H3H2V2H3V1H2V0ZM2 1V2H1V1H2ZM5 3V4H6V3H5Z" fill={color}/>
    </svg>
  );
};

export default Git_merge;
