import { jsx as _jsx } from "react/jsx-runtime";
const Core = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M5 4V5H2V4H5ZM2 4H0V2H2V4ZM4 3H3V2H4V3ZM7 3H5V1H7V3ZM5 1H2V0H5V1Z", fill: color }) }));
};
export default Core;
