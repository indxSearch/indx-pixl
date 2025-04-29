import { jsx as _jsx } from "react/jsx-runtime";
const Layout_align_top = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M3 4H4V3H3V4ZM6 1H1V0H6V1ZM5 5H2V2H5V5Z", fill: color }) }));
};
export default Layout_align_top;
