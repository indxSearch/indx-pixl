import { jsx as _jsx } from "react/jsx-runtime";
const Arrow_left_down = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M6 0L4 0V1H6V0ZM4 1H3V3L4 3V1ZM2 2H1L1 3H2L2 2ZM6 2H5V3L6 3V2ZM3 3H2V4H3L3 3ZM5 3H4V4H5V3ZM4 4H3V5H4V4Z", fill: color }) }));
};
export default Arrow_left_down;
