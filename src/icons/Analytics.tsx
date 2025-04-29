import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Analytics: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3 0H2V5H3V0ZM1 2H0V5H1V2ZM4 3H5V5H4V3ZM7 1H6V5H7V1Z" fill={color}/>
    </svg>
  );
};

export default Analytics;
