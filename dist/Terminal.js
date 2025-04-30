import { jsx as _jsx } from "react/jsx-runtime";
const Terminal = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M1 0H0V5H1H2H3H4H5H6H7V0H6H5H4H3H2H1ZM1 4H2V3H3V2H2V1L1 1L1 2H2V3H1L1 4ZM6 3H5H4V4H5H6V3Z", fill: color }) }));
};
export default Terminal;
