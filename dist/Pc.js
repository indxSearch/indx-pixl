import { jsx as _jsx } from "react/jsx-runtime";
const Pc = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 5L1 5L1 4L2 4V3L0 3L0 0L5 0V3H3V4H4V5ZM7 5H5L5 3L7 3L7 5Z", fill: color }) }));
};
export default Pc;
