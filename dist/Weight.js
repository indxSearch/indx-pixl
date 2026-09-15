import { jsx as _jsx } from "react/jsx-runtime";
const Weight = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 0H4V1H6V2H7V3H6V4H7V5H4V4H3V5H0V4H1V3H0V2H1V1H3ZM4 1H3V2H4ZM2 2H1V3H2V4H3V2ZM5 2H4V4H5V3H6V2Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Weight;
