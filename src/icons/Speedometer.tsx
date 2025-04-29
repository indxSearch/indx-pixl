import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Speedometer: React.FC<IconProps> = ({
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
      <path d="M2 5H1V4H2V5ZM6 5H5V4H6V5ZM1 4H0V2H1V4ZM4 4H3V3H4V4ZM7 4H6V2H7V4ZM5 3H4V2H5V3ZM2 2H1V1H2V2ZM6 2H5V1H6V2ZM5 1H2V0H5V1Z" fill={color}/>
    </svg>
  );
};

export default Speedometer;
