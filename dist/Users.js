import { jsx as _jsx } from "react/jsx-runtime";
const Users = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M1 0H2V1H1V0ZM3 2H0V3H1V4H0V5H1V4H2V5H3V4H2V3H3V2ZM7 2H4V3H5V4H4V5H5V4H6V5H7V4H6V3H7V2ZM6 0H5V1H6V0Z", fill: color }) }));
};
export default Users;
