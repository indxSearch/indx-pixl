import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Layout_align_top: React.FC<IconProps> = ({
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
    <path d="M3 4H4V3H3V4ZM6 1H1V0H6V1ZM5 5H2V2H5V5Z" fill={color}/>    
    </svg>
  );
};

export default Layout_align_top;
