import { jsx as _jsx } from "react/jsx-runtime";
const Volume_high = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 5H2V4H1V3H0V2H1V1H2V0H3V5ZM7 5H6V0H7V5ZM5 4H4V1H5V4Z", fill: color }) }));
};
export default Volume_high;
