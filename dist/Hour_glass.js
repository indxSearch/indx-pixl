import { jsx as _jsx } from "react/jsx-runtime";
const Hour_glass = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M2 0H1V1H2V2H3V3H2V4H1V5H2H3H4H5H6V4H5V3H4V2H5V1H6V0H5H4H3H2ZM4 2H3V1H4V2Z", fill: color }) }));
};
export default Hour_glass;
