import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Layout_align_right: React.FC<IconProps> = ({
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
    <path d="M6 5H5V0H6V5ZM2 3H3V2H2V3ZM4 4H1V1H4V4Z" fill={color}/>    
    </svg>
  );
};

export default Layout_align_right;
