import { jsx as _jsx } from "react/jsx-runtime";
const Save = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M5 0V1H6V5H1V0H5ZM3 2H2V3H3V4H4V3H5V2H4V1H3V2ZM4 3H3V2H4V3Z", fill: color }) }));
};
export default Save;
