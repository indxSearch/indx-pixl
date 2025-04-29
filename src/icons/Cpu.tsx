import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Cpu: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M5 0H6V1H5V0ZM6 1H7V2H6V1ZM0 1H1V2H0V1ZM1 1V0H2V1H1ZM0 3H1V4H0V3ZM1 4H2V5H1V4ZM3 4H4V5H3V4ZM6 4H5V5H6V4ZM6 4H7V3H6V4ZM4 0H3V1H4V0ZM2 2H3V3H2V2Z" fill={color}/>
    </svg>
  );
};

export default Cpu;
