import { jsx as _jsx } from "react/jsx-runtime";
const User_id = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H2V1H1ZM4 0H7V3H4ZM6 1H5V2H6ZM0 2H3V3H2V4H3V5H2V4H1V5H0V4H1V3H0Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default User_id;
