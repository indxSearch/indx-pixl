import { jsx as _jsx } from "react/jsx-runtime";
const Drop_half = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 3L5 3V2L6 2L6 4H5V5L2 5L2 4H1L1 2L2 2L2 3ZM3 2H2V1L3 1L3 2ZM5 2H4V1L5 1V2ZM4 1L3 1V0L4 0V1Z", fill: color }) }));
};
export default Drop_half;
