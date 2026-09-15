import { jsx as _jsx } from "react/jsx-runtime";
const Nested_object = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H3V1H2V2H1V3H2V4H3V5H1V3H0V2H1ZM4 0H6V1H5V2H4V3H5V4H6V5H4V3H3V2H4ZM6 2H7V3H6Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Nested_object;
