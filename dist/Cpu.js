import { jsx as _jsx } from "react/jsx-runtime";
const Cpu = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H2V1H1V2H0V1H1ZM3 0H4V1H3ZM5 0H6V1H7V2H6V1H5ZM2 2H3V3H2ZM0 3H1V4H2V5H1V4H0ZM6 3H7V4H6V5H5V4H6ZM3 4H4V5H3Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Cpu;
