import { jsx as _jsx } from "react/jsx-runtime";
const Json_result = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H3V1H2V2H1V3H2V4H3V5H1V3H0V2H1ZM4 0H7V1H4ZM4 2H7V3H4ZM4 4H7V5H4Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Json_result;
