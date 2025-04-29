import { jsx as _jsx } from "react/jsx-runtime";
const Copy = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M0 0H1H2H3H4V1H5H6V2V3V4V5H5H4H3H2V4H1H0V3V2V1V0ZM4 4H3V3V2H4H5V3V4H4ZM2 3V2H3V1H2H1V2V3H2Z", fill: color }) }));
};
export default Copy;
