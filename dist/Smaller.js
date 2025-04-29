import { jsx as _jsx } from "react/jsx-runtime";
const Smaller = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M5 5H4V4H5V5ZM4 3V4H3V3H4ZM3 3H2V2H3V3ZM4 2H3V1H4V2ZM5 1H4V0H5V1Z", fill: color }) }));
};
export default Smaller;
