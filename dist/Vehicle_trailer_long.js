import { jsx as _jsx } from "react/jsx-runtime";
const Vehicle_trailer_long = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 5H1V4H2V5ZM4 5H3V4H4V5ZM7 3H6V4H4V3H3V4H2V3H1V4H0V2H6V1H7V3Z", fill: color }) }));
};
export default Vehicle_trailer_long;
