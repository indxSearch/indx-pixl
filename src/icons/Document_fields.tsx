import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Document_fields: React.FC<IconProps> = ({
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
      <path d="M2 5H0V4H2V5ZM5 2V1H4V4H6V2H5ZM2 3H0V2H2V3ZM2 1H0V0H2V1ZM7 5H3V0H6V1H7V5Z" fill={color}/>
    </svg>
  );
};

export default Document_fields;
