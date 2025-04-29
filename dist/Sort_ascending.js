import { jsx as _jsx } from "react/jsx-runtime";
const Sort_ascending = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 5H0V4H3V5ZM5 5H4V2H5V5ZM3 3H2V2H3V3ZM7 3H6V2H7V3ZM4 2H3V1H4V2ZM6 2H5V1H6V2ZM2 1H0V0H2V1ZM5 0V1H4V0H5Z", fill: color }) }));
};
export default Sort_ascending;
