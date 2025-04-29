import { jsx as _jsx } from "react/jsx-runtime";
const Loop = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M4 0H3V1H2V2V3H3V4H2H1V3V2H0V3V4H1V5H2H3V4H4V5H5H6V4H7V3V2H6V3V4H5H4V3H5V2V1H4V0ZM4 1V2V3H3V2V1H4Z", fill: color }) }));
};
export default Loop;
