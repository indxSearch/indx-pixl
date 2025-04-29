import { jsx as _jsx } from "react/jsx-runtime";
const Minimize = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M2 0H3V1V2H2H1V1H2V0ZM5 1H6V2H5H4V1V0H5V1ZM1 3H2H3V4V5H2V4H1V3ZM5 3H6V4H5V5H4V4V3H5Z", fill: color }) }));
};
export default Minimize;
