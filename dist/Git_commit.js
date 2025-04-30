import { jsx as _jsx } from "react/jsx-runtime";
const Git_commit = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M3 1H4V2H3V1ZM3 3H2H1H0V2H1H2H3V3ZM4 3V4H3V3H4ZM6 3H5H4V2H5H6H7V3H6Z", fill: color }) }));
};
export default Git_commit;
