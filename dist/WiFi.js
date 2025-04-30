import { jsx as _jsx } from "react/jsx-runtime";
const WiFi = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M6 0L1 0L1 1L0 1L0 2L1 2V1L6 1V2L7 2V1L6 1V0ZM5 3L6 3L6 4L5 4L5 3ZM2 3V2L5 2V3H2ZM2 3V4L1 4V3L2 3ZM3 4H4V5L3 5V4Z", fill: color }) }));
};
export default WiFi;
