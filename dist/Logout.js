import { jsx as _jsx } from "react/jsx-runtime";
const Logout = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M3 0H2V1H1V2H0V3H1V4H2V5H3V4H2V3H3H4V2H3H2V1H3V0ZM2 2V3H1V2H2ZM7 0H6H5V1H6V4H5V5H6H7V0Z", fill: color }) }));
};
export default Logout;
