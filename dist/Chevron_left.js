import { jsx as _jsx } from "react/jsx-runtime";
const Chevron_left = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M5 1H4V0H5V1ZM3 2V1H4V2H3ZM3 3V2H2V3H3ZM4 4H3V3H4V4ZM4 4H5V5H4V4Z", fill: color }) }));
};
export default Chevron_left;
