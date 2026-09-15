import { jsx as _jsx } from "react/jsx-runtime";
const Clock = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 0H5V1H6V4H5V5H2V4H1V1H2ZM3 1H2V4H5V3H3ZM5 1H4V2H5Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Clock;
