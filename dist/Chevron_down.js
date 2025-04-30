import { jsx as _jsx } from "react/jsx-runtime";
const Chevron_down = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M1 1H2V2H1V1ZM3 3H2V2H3V3ZM4 3V4H3V3H4ZM5 2H4V3H5V2ZM5 2V1H6V2H5Z", fill: color }) }));
};
export default Chevron_down;
