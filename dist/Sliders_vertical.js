import { jsx as _jsx } from "react/jsx-runtime";
const Sliders_vertical = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M1 0H0V1V2V3H1V4V5H2V4V3H3V2V1V0H2H1ZM1 2V1H2V2H1ZM5 4H4V3V2V1H5V0H6V1H7V2V3V4H6V5H5V4ZM6 2H5V3H6V2Z", fill: color }) }));
};
export default Sliders_vertical;
