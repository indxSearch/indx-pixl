import { jsx as _jsx } from "react/jsx-runtime";
const Vehicle_postal_van = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 5H1V4H2V5ZM5 5H4V4H5V5ZM4 1H3V2H4V1H5V2H6V4H5V3H4V4H2V3H1V4H0V0H4V1Z", fill: color }) }));
};
export default Vehicle_postal_van;
