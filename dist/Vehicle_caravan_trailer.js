import { jsx as _jsx } from "react/jsx-runtime";
const Vehicle_caravan_trailer = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 0H6V1H7V3H6V4H4V5H3V4H2V5H1V4H0ZM2 1H1V2H3V1ZM5 1H4V2H6V1ZM2 3H1V4H2ZM4 3H3V4H4Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Vehicle_caravan_trailer;
