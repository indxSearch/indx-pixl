import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Pause: React.FC<IconProps> = ({
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
    <path d="M3 5H2V0H3V5ZM5 5H4V0H5V5Z" fill={color}/>    
    </svg>
  );
};

export default Pause;
