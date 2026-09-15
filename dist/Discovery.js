import { jsx as _jsx } from "react/jsx-runtime";
const Discovery = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H2V1H1ZM3 0H4V2H7V3H4V5H3V3H0V2H3ZM5 0H6V1H5ZM4 2H3V3H4ZM1 4H2V5H1ZM5 4H6V5H5Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Discovery;
