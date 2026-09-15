import { jsx as _jsx } from "react/jsx-runtime";
const Pc = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H5V3H7V5H5V3H3V4H4V5H1V4H2V3H0Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Pc;
