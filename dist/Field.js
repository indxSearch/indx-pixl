import { jsx as _jsx } from "react/jsx-runtime";
const Field = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 4H0V3H1V4ZM7 4H6V3H7V4ZM5 3H2V2H5V3ZM1 2H0V1H1V2ZM7 2H6V1H7V2Z", fill: color }) }));
};
export default Field;
