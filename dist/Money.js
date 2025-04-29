import { jsx as _jsx } from "react/jsx-runtime";
const Money = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 0V1H2V2H1V3H2V4H3V5H0V0H3ZM7 5H4V4H5V3H6V2H5V1H4V0H7V5ZM4 3H3V2H4V3Z", fill: color }) }));
};
export default Money;
