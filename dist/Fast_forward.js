import { jsx as _jsx } from "react/jsx-runtime";
const Fast_forward = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H1V1H2V2H3V3H2V4H1V5H0ZM4 0H5V1H6V2H7V3H6V4H5V5H4Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Fast_forward;
