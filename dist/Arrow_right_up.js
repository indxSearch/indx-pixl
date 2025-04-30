import { jsx as _jsx } from "react/jsx-runtime";
const Arrow_right_up = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M1 5H2H3V4H2H1V5ZM4 2V3V4H3V3V2H2V3H1V2H2V1H3V0H4V1H5V2H6V3H5V2H4ZM4 2V1H3V2H4Z", fill: color }) }));
};
export default Arrow_right_up;
