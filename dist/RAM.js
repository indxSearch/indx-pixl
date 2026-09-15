import { jsx as _jsx } from "react/jsx-runtime";
const Ram = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H7V2H6V1H1V2H0ZM2 2H3V3H2ZM4 2H5V3H4ZM0 3H1V4H4V5H0ZM6 3H7V5H5V4H6Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Ram;
