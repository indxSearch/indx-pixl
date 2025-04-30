import React from "react";

type IconProps = {
  color?: string;
  size?: number | string;
};

const Recorder: React.FC<IconProps> = ({
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
    <path fillRule="evenodd" clipRule="evenodd" d="M1 0L2 0V1L1 1L1 0ZM1 2L0 2L0 1L1 1V2ZM2 2H1L1 3L2 3V4L1 4L1 5H2H3L4 5H5H6V4L5 4L5 3L6 3V2L7 2V1L6 1V0L5 0V1L4 1V2L5 2V3H4H3H2V2ZM5 2V1L6 1V2H5ZM2 2L3 2L3 1L2 1L2 2Z" fill={color}/>    
    </svg>
  );
};

export default Recorder;
