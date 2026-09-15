import { jsx as _jsx } from "react/jsx-runtime";
const Folder = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H4V1H7V5H0ZM2 2H1V4H6V2Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Folder;
