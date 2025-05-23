import { jsx as _jsx } from "react/jsx-runtime";
const Document_or_file = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M2 0H1V1V2V3V4V5H2H3H4H5H6V4V3V2V1H5V0H4H3H2ZM4 2H5V3V4H4H3H2V3V2V1H3H4V2Z", fill: color }) }));
};
export default Document_or_file;
