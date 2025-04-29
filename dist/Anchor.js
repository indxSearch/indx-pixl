import { jsx as _jsx } from "react/jsx-runtime";
const Anchor = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M4 0H3V1H2V2H3V3V4H2V3H1V4H2V5H3H5V4H6V3H5V4H4V3V2H5V1H4V0ZM4 1V2H3V1H4Z", fill: color }) }));
};
export default Anchor;
