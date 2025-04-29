import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Crop: React.FC<IconProps> = ({
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
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3 0H2V1H1V2H2V3V4H3H4V5H5V4H6V3H5V2V1H4H3V0ZM3 2V3H4V2H3Z" fill={color}/>
    </svg>
  );
};

export default Crop;
