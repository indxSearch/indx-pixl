import { jsx as _jsx } from "react/jsx-runtime";
const Coverage = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 0H4V1H3ZM0 1H2V2H1V3H2V4H0ZM5 1H7V4H5V3H6V2H5ZM3 2H4V3H3ZM3 4H4V5H3Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Coverage;
