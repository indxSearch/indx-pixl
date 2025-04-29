import { jsx as _jsx } from "react/jsx-runtime";
const Diving_mask = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 5H2V4H3V5ZM6 5H4V4H6V5ZM2 4H1V3H2V4ZM4 4H3V3H4V4ZM7 4H6V0H7V4ZM1 3H0V1H1V3ZM3 2V3H2V2H3ZM5 3H4V1H5V3ZM4 1H1V0H4V1Z", fill: color }) }));
};
export default Diving_mask;
