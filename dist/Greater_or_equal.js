import { jsx as _jsx } from "react/jsx-runtime";
const Greater_or_equal = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 5H0V4H1V5ZM2 4H1V3H2V4ZM7 3V4H4V3H7ZM3 3H2V2H3V3ZM2 2H1V1H2V2ZM7 2H4V1H7V2ZM1 1H0V0H1V1Z", fill: color }) }));
};
export default Greater_or_equal;
