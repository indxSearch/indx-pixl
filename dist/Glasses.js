import { jsx as _jsx } from "react/jsx-runtime";
const Glasses = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 1H3V2H4V1H5V2H7V3H5V4H4V3H3V4H2V3H0V2H2ZM3 2H2V3H3ZM5 2H4V3H5Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Glasses;
