import { jsx as _jsx } from "react/jsx-runtime";
const Json_query = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 4H3V5H1V3H2V4ZM7 5H6V4H7V5ZM6 1V4H3V1H6ZM1 3H0V2H1V3ZM4 3H5V2H4V3ZM3 1H2V2H1V0H3V1Z", fill: color }) }));
};
export default Json_query;
