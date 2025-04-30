import { jsx as _jsx } from "react/jsx-runtime";
const Vehicle_sports_car = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M2 5H1V4H2V5ZM6 5H5V4H6V5ZM1 2H2V1H3V2H6V3H5V4H2V3H1V4H0V1H1V2ZM7 4H6V3H7V4Z", fill: color }) }));
};
export default Vehicle_sports_car;
