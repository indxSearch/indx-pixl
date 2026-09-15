import { jsx as _jsx } from "react/jsx-runtime";
const Code = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 0H3V1H2V2H1V3H2V4H3V5H2V4H1V3H0V2H1V1H2ZM4 0H5V1H6V2H7V3H6V4H5V5H4V4H5V3H6V2H5V1H4Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Code;
