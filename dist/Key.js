import { jsx as _jsx } from "react/jsx-runtime";
const Key = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M5 1H6V2H5V3H6V4H5H4V3H3V4H2V3H1V4H0V3V2H1H2H3H4V1H5ZM6 3V2H7V3H6Z", fill: color }) }));
};
export default Key;
