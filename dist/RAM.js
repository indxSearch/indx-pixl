import { jsx as _jsx } from "react/jsx-runtime";
const RAM = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 4H4V5H0V3H1V4ZM7 5H5V4H6V3H7V5ZM3 3H2V2H3V3ZM5 3H4V2H5V3ZM7 2H6V1H1V2H0V0H7V2Z", fill: color }) }));
};
export default RAM;
