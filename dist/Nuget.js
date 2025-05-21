import { jsx as _jsx } from "react/jsx-runtime";
const Nuget = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M5 1V2L6 2L6 4H5L5 3H4V4H5V5L3 5V4L2 4L2 2H3V3H4V2L3 2L3 1L5 1ZM2 1L1 1L1 0L2 0V1Z", fill: color }) }));
};
export default Nuget;
