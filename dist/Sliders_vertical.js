import { jsx as _jsx } from "react/jsx-runtime";
const Sliders_vertical = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H3V3H2V5H1V3H0ZM2 1H1V2H2ZM5 0H6V1H7V4H6V5H5V4H4V1H5ZM6 2H5V3H6Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Sliders_vertical;
