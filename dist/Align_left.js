import { jsx as _jsx } from "react/jsx-runtime";
const Align_left = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 5H1V4H4V5ZM6 3H1V2H6V3ZM4 1H1V0H4V1Z", fill: color }) }));
};
export default Align_left;
