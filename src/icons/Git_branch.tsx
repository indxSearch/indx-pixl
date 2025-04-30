import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Git_branch: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M2 5H1V4H0V3H1V2V1V0H2V1V2V3H3H4H5V2H4V1H5V0H6V1H7V2H6V3H5V4H4H3H2V5ZM6 2H5V1H6V2ZM2 4V3H1V4H2Z" fill={color}/>    
    </svg>
  );
};

export default Git_branch;
