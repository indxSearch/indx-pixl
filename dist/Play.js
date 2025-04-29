import { jsx as _jsx } from "react/jsx-runtime";
const Play = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 1H4V2H5V3H4V4H3V5H2V0H3V1Z", fill: color }) }));
};
export default Play;
