import { jsx as _jsx } from "react/jsx-runtime";
const Fields = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H3V1H5V0H7V1H5V2H3V1H0ZM0 2H2V3H0ZM6 2H7V3H6ZM3 3H5V4H7V5H5V4H3V5H0V4H3Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Fields;
