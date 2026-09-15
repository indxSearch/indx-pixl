import { jsx as _jsx } from "react/jsx-runtime";
const Greater_or_equal = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H1V1H2V2H3V3H2V4H1V5H0V4H1V3H2V2H1V1H0ZM4 1H7V2H4ZM4 3H7V4H4Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Greater_or_equal;
