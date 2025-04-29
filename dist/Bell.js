import { jsx as _jsx } from "react/jsx-runtime";
const Bell = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 1V0H4V1H5V3H6V4H4V5H3V4H1V3H2V1H3Z", fill: color }) }));
};
export default Bell;
