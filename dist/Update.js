import { jsx as _jsx } from "react/jsx-runtime";
const Update = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 3H2V4H1V5H0V2H3V3ZM5 4V5H2V4H5ZM7 3H4V2H5V1H6V0H7V3ZM5 1H2V0H5V1Z", fill: color }) }));
};
export default Update;
