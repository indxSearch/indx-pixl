import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Coins: React.FC<IconProps> = ({
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
      <path d="M6 5H5V4H6V5ZM2 4H1V3H2V4ZM5 4H4V2H5V4ZM7 4H6V2H7V4ZM1 3H0V1H1V3ZM3 3H2V1H3V3ZM6 1V2H5V1H6ZM2 1H1V0H2V1Z" fill={color}/>
    </svg>
  );
};

export default Coins;
