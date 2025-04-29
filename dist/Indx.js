import { jsx as _jsx } from "react/jsx-runtime";
const Indx = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M5 0H6V1H5V0ZM6 1H7V2H6V1ZM0 1H1V2H0V1ZM1 1V0H2V1H1ZM6 3H7V4H6V3ZM6 4V5H5V4H6ZM1 4H2V5H1V4ZM1 4H0V3H1V4ZM2 2H5V3H2V2Z", fill: color }) }));
};
export default Indx;
