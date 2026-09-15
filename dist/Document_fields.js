import { jsx as _jsx } from "react/jsx-runtime";
const Document_fields = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H2V1H0ZM3 0H6V1H7V5H3ZM5 1H4V4H6V2H5ZM0 2H2V3H0ZM0 4H2V5H0Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Document_fields;
