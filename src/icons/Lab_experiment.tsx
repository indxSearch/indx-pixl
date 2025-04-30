import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Lab_experiment: React.FC<IconProps> = ({
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
    <path d="M2 3H5V2H6V4H5V5H2V4H1V2H2V3ZM6 1H5V2H4V1H3V2H2V1H1V0H6V1Z" fill={color}/>    
    </svg>
  );
};

export default Lab_experiment;
