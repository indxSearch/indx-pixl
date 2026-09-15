import { jsx as _jsx } from "react/jsx-runtime";
const Point_up = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 0H4V2H6V5H2V4H1V3H2V4H3Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Point_up;
