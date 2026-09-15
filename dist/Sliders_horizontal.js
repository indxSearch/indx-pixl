import { jsx as _jsx } from "react/jsx-runtime";
const Sliders_horizontal = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M5 0H6V1H7V2H6V3H5V2H3V1H5ZM6 1H5V2H6ZM1 2H2V3H4V4H2V5H1V4H0V3H1ZM2 3H1V4H2Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Sliders_horizontal;
