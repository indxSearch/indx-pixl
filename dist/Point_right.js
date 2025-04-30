import { jsx as _jsx } from "react/jsx-runtime";
const Point_right = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M3 0L4 0V1L3 1V0ZM3 1L3 2H4L5 2H6L7 2V3H6L5 3L5 4V5H4L3 5H2V4V3V2L2 1L3 1ZM1 5L1 4V3L1 2L0 2L0 3L0 4L0 5H1Z", fill: color }) }));
};
export default Point_right;
