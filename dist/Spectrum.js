import { jsx as _jsx } from "react/jsx-runtime";
const Spectrum = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M3 0H2V5H3V0ZM1 1H0V4H1V1ZM4 2H5V3H4V2ZM7 1H6V4H7V1Z", fill: color }) }));
};
export default Spectrum;
