import { jsx as _jsx } from "react/jsx-runtime";
const Four_leaf_clover = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 5H2L2 4H1V3L3 3V5ZM6 4H5V5L4 5V3H6L6 4ZM4 3H3V2L4 2V3ZM3 2L1 2V1L2 1V0L3 0L3 2ZM5 1L6 1V2L4 2V0L5 0V1Z", fill: color }) }));
};
export default Four_leaf_clover;
