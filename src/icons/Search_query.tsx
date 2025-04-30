import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Search_query: React.FC<IconProps> = ({
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
    <path d="M7 5H6V4H7V5ZM2 3V4H0V3H2ZM6 4H3V1H6V4ZM4 3H5V2H4V3ZM2 2H0V1H2V2Z" fill={color}/>    
    </svg>
  );
};

export default Search_query;
