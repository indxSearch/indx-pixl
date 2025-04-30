import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Search: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0H2V1H1V3H2V4H4V3H5V1H4V0ZM4 1V3H2V1H4ZM6 4H5V5H6V4Z" fill={color}/>    
    </svg>
  );
};

export default Search;
