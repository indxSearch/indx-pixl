import { jsx as _jsx } from "react/jsx-runtime";
const Vehicle_4x4 = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 5H2V4H3V5ZM6 5H5V4H6V5ZM4 1H2V2H4V1H5V2H7V4H6V3H5V4H3V3H2V4H1V3H0V1H1V0H4V1Z", fill: color }) }));
};
export default Vehicle_4x4;
