import { jsx as _jsx } from "react/jsx-runtime";
const Duplicate = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M2 0H1V1V2V3V4H2V5H3H4H5H6V4V3V2V1H5V0H4H3H2ZM4 4H3V3H4V2H5V3V4H4ZM3 3V2H4V1H3H2V2V3H3Z", fill: color }) }));
};
export default Duplicate;
