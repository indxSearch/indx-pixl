import { jsx as _jsx } from "react/jsx-runtime";
const Vehicle_sports_car = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 1H1V2H2V1H3V2H6V3H7V4H6V5H5V4H2V5H1V4H0ZM2 3H1V4H2ZM6 3H5V4H6Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Vehicle_sports_car;
