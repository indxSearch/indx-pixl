import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Login: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M1 0H2V1H1V0ZM3 2V1H2V2H1H0V3H1H2V4H1V5H2V4H3V3H4V2H3ZM3 2H2V3H3V2ZM7 0H6H5V1H6V4H5V5H6H7V0Z" fill={color}/>    
    </svg>
  );
};

export default Login;
