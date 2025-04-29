import { jsx as _jsx } from "react/jsx-runtime";
const Empty = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M6 0H5V1H6V2H7V1H6V0ZM1 1H0V2H1V1ZM1 1V0H2V1H1ZM1 3H0V4H1V5H2V4H1V3ZM4 4H3V5H4V4ZM5 4H6V5H5V4ZM6 4V3H7V4H6ZM3 0H4V1H3V0Z", fill: color }) }));
};
export default Empty;
