import { jsx as _jsx } from "react/jsx-runtime";
const Internet_browser = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H7V5H0V1H1ZM2 1H1V4H6V2H3V1Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Internet_browser;
