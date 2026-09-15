import { jsx as _jsx } from "react/jsx-runtime";
const Spark = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H2V1H1ZM5 0H6V1H5ZM3 1H4V2H5V3H4V4H3V3H2V2H3ZM4 2H3V3H4ZM0 2H1V3H0ZM6 2H7V3H6ZM1 4H2V5H1ZM5 4H6V5H5Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Spark;
