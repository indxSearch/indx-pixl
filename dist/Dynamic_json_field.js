import { jsx as _jsx } from "react/jsx-runtime";
const Dynamic_json_field = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 4H3V5H1V3H2V4ZM5 5H4V4H5V5ZM6 4H5V3H6V4ZM1 2V3H0V2H1ZM5 3H3V2H5V3ZM7 3H6V2H7V3ZM3 1H2V2H1V0H3V1ZM6 2H5V1H6V2ZM5 1H4V0H5V1Z", fill: color }) }));
};
export default Dynamic_json_field;
