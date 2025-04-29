import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Weight_low: React.FC<IconProps> = ({
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
      <path d="M1 1H2V4H1V1ZM4 3H3V2H4V3ZM6 3H5V2H6V3Z" fill={color}/>
    </svg>
  );
};

export default Weight_low;
