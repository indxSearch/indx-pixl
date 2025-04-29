import { jsx as _jsx } from "react/jsx-runtime";
const Crystal_ball = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M5 0V1H4V2H5V1H6V4H5V5H2V4H1V1H2V0H5Z", fill: color }) }));
};
export default Crystal_ball;
