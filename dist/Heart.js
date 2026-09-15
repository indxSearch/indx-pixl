import { jsx as _jsx } from "react/jsx-runtime";
const Heart = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 0H3V1H4V0H5V1H6V3H5V4H4V5H3V4H2V3H1V1H2ZM3 1H2V3H3V4H4V3H5V1H4V2H3Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Heart;
