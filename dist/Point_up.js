import { jsx as _jsx } from "react/jsx-runtime";
const Point_up = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M3 0V1L3 2V3V4L2 4V3H1V4H2L2 5H3H4L5 5H6V4L6 3V2L5 2H4V1V0L3 0Z", fill: color }) }));
};
export default Point_up;
