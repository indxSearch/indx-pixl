import { jsx as _jsx } from "react/jsx-runtime";
const Discovery = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M4 0H3V2H0V3H3V5H4V3H7V2H4V0ZM4 2V3H3V2H4ZM5 0H6V1H5V0ZM2 0H1V1H2V0ZM1 4H2V5H1V4ZM6 4H5V5H6V4Z", fill: color }) }));
};
export default Discovery;
