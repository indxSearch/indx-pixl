import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Folder: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M1 0H0V1V2V3V4V5H1H2H3H4H5H6H7V4V3V2V1H6H4V0H3H2H1ZM6 2H1V3V4H2H3H4H5H6V3V2Z" fill={color}/>    
    </svg>
  );
};

export default Folder;
