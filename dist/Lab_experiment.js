import { jsx as _jsx } from "react/jsx-runtime";
const Lab_experiment = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 3H5V2H6V4H5V5H2V4H1V2H2V3ZM6 1H5V2H4V1H3V2H2V1H1V0H6V1Z", fill: color }) }));
};
export default Lab_experiment;
