import { jsx as _jsx } from "react/jsx-runtime";
const Docker = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H3V2H0V1H1ZM4 1H5V2H6V1H7V2H6V4H5V5H1V4H0V3H5V2H4Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Docker;
