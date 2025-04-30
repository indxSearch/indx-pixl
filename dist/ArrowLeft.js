import { jsx as _jsx } from "react/jsx-runtime";
const ArrowLeft = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M3 1H2V2H3H4H5H6V3H5H4H3H2V4H3V5H2V4H1V3H0V2H1V1H2V0H3V1ZM1 2V3H2V2H1Z", fill: color }) }));
};
export default ArrowLeft;
