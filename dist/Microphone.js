import { jsx as _jsx } from "react/jsx-runtime";
const Microphone = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 0H4V1H5V3H4V4H5V5H2V4H3V3H2V1H3ZM4 1H3V2H4ZM0 1H1V3H0ZM6 1H7V3H6Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Microphone;
