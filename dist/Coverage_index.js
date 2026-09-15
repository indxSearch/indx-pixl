import { jsx as _jsx } from "react/jsx-runtime";
const Coverage_index = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 0H4V1H3ZM0 1H1V2H2V3H1V4H0V3H1V2H0ZM6 1H7V2H6V3H7V4H6V3H5V2H6ZM3 2H4V3H3ZM3 4H4V5H3Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Coverage_index;
