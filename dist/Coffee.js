import { jsx as _jsx } from "react/jsx-runtime";
const Coffee = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 0H7V4H6V5H3V4H2V2H1V3H0V1H2ZM4 1H3V4H6V1Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Coffee;
