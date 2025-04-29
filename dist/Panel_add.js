import { jsx as _jsx } from "react/jsx-runtime";
const Panel_add = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 4H3V5H0V0H7V1H1V4ZM6 3H7V4H6V5H5V4H4V3H5V2H6V3Z", fill: color }) }));
};
export default Panel_add;
