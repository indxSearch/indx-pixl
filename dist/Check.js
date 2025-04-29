import { jsx as _jsx } from "react/jsx-runtime";
const Check = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V3H1V4H2V5H3V4H4V3H5V2H6V1H7V0Z", fill: color }) }));
};
export default Check;
