import { jsx as _jsx } from "react/jsx-runtime";
const Align_right = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M6 5H3V4H6V5ZM6 3H1V2H6V3ZM6 1H3V0H6V1Z", fill: color }) }));
};
export default Align_right;
