import { jsx as _jsx } from "react/jsx-runtime";
const Delete = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 0H7V5H2V4H1V3H0V2H1V1H2ZM4 1H3V2H4ZM6 1H5V2H6ZM5 2H4V3H5ZM4 3H3V4H4ZM6 3H5V4H6Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Delete;
