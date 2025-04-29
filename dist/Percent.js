import { jsx as _jsx } from "react/jsx-runtime";
const Percent = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 5H1V4H2V5ZM7 5H5V3H7V5ZM3 4H2V3H3V4ZM4 3H3V2H4V3ZM2 2H0V0H2V2ZM5 2H4V1H5V2ZM6 0V1H5V0H6Z", fill: color }) }));
};
export default Percent;
