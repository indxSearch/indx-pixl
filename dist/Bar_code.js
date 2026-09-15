import { jsx as _jsx } from "react/jsx-runtime";
const Bar_code = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H1V5H0ZM2 0H3V3H2ZM4 0H5V3H4ZM6 0H7V5H6ZM2 4H3V5H2ZM4 4H5V5H4Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Bar_code;
