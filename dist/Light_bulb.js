import { jsx as _jsx } from "react/jsx-runtime";
const Light_bulb = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M3 0L2 0V1L1 1V2L1 3H2V4L2 5H3H4L5 5V4L5 3H6V2V1L5 1V0L4 0L3 0ZM5 2V1L4 1L3 1L2 1V2L2 3L3 3V4H4V3H5V2Z", fill: color }) }));
};
export default Light_bulb;
