import { jsx as _jsx } from "react/jsx-runtime";
const Prev = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 5H1V0H2V5ZM6 5H5V4H4V3H3V2H4V1H5V0H6V5Z", fill: color }) }));
};
export default Prev;
