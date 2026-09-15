import { jsx as _jsx } from "react/jsx-runtime";
const Percent = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H2V2H0ZM5 0H6V1H5V2H4V3H3V4H2V5H1V4H2V3H3V2H4V1H5ZM5 3H7V5H5Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Percent;
