import { jsx as _jsx } from "react/jsx-runtime";
const Gps_pin = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 5H3V3H2V0H5V3H4V5ZM3 2H4V1H3V2Z", fill: color }) }));
};
export default Gps_pin;
