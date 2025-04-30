import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Message: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M5 0H4H3H2H1V1V2V3V4H2V5H3V4H4H5H6V3V2V1V0H5ZM5 1H4H3H2V2V3V4H3V3H4H5V2V1Z" fill={color}/>    
    </svg>
  );
};

export default Message;
