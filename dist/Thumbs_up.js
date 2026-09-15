import { jsx as _jsx } from "react/jsx-runtime";
const Thumbs_up = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 0H3V2H5V5H2ZM0 2H1V5H0Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Thumbs_up;
