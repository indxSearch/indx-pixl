import { jsx as _jsx } from "react/jsx-runtime";
const Align_center = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M5 5H2V4H5V5ZM6 3H1V2H6V3ZM5 1H2V0H5V1Z", fill: color }) }));
};
export default Align_center;
