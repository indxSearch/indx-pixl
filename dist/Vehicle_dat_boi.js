import { jsx as _jsx } from "react/jsx-runtime";
const Vehicle_dat_boi = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 5H3V4H4V5ZM3 4H2V3H3V4ZM5 4H4V3H5V4ZM4 3H3V1H4V3ZM5 1H4V0H5V1Z", fill: color }) }));
};
export default Vehicle_dat_boi;
