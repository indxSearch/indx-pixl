import { jsx as _jsx } from "react/jsx-runtime";
const Weight_high = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 4H1V1H2V4ZM4 4H3V1H4V4ZM5 1H6V4H5V1Z", fill: color }) }));
};
export default Weight_high;
