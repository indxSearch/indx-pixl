import { jsx as _jsx } from "react/jsx-runtime";
const Weight = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 4H3V5H0L0 4H1V3L2 3V4ZM6 4H7V5H4V4H5L5 3L6 3L6 4ZM4 4H3V2H4L4 4ZM1 3H0L0 2L1 2L1 3ZM7 3H6V2L7 2V3ZM3 2L1 2V1L3 1L3 2ZM6 2L4 2V1L6 1V2ZM4 1L3 1V0L4 0V1Z", fill: color }) }));
};
export default Weight;
