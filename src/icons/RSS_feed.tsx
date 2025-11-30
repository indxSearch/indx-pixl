import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Rss_feed: React.FC<IconProps> = ({
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
    <path d="M2 5H1V4H2V5ZM4 5H3V3H4V5ZM6 5H5V2H6V5ZM3 3H1V2H3V3ZM5 2H4V1H5V2ZM4 0V1H1V0H4Z" fill={color}/>    
    </svg>
  );
};

export default Rss_feed;
