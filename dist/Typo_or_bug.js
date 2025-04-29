import { jsx as _jsx } from "react/jsx-runtime";
const Typo_or_bug = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M1 0H2H3H4H5H6V1H5H4H3H2H1V0ZM1 4H0V3V2V1H1V2V3V4ZM1 4H2V5H1V4ZM6 4V3V2V1H7V2V3V4H6ZM6 4H5V5H6V4ZM3 2H2V3H3V2ZM5 2H4V3H5V2ZM3 4H4V5H3V4Z", fill: color }) }));
};
export default Typo_or_bug;
