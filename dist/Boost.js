import { jsx as _jsx } from "react/jsx-runtime";
const Boost = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 5H1V4H2V5ZM4 2H5V3H4V5H3V4H2V3H1V2H3V1H4V2ZM6 2H5V1H4V0H6V2Z", fill: color }) }));
};
export default Boost;
