import { jsx as _jsx } from "react/jsx-runtime";
const Tool_box = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M6 1L7 1L7 5L0 5L0 1L1 1L1 0L6 0V1ZM3 2L1 2L1 4L6 4L6 2L4 2V1L3 1L3 2ZM4 3H3V2H4V3Z", fill: color }) }));
};
export default Tool_box;
