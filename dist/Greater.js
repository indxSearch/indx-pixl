import { jsx as _jsx } from "react/jsx-runtime";
const Greater = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 5H2V4H3V5ZM4 3V4H3V3H4ZM5 3H4V2H5V3ZM4 2H3V1H4V2ZM3 1H2V0H3V1Z", fill: color }) }));
};
export default Greater;
