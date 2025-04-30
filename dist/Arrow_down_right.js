import { jsx as _jsx } from "react/jsx-runtime";
const Arrow_down_right = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M4 0H5V1H4V0ZM6 2V1H5V2H4H3H2V1V0H1V1V2H2V3H3H4H5V4H4V5H5V4H6V3H7V2H6ZM6 2V3H5V2H6Z", fill: color }) }));
};
export default Arrow_down_right;
