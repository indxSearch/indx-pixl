import { jsx as _jsx } from "react/jsx-runtime";
const Internet_browser = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M7 0H1V1H0V2V3V4V5H1H2H3H4H5H6H7V4V3V2V1V0ZM3 1V2H4H5H6V3V4H5H4H3H2H1V3V2V1H3Z", fill: color }) }));
};
export default Internet_browser;
