import { jsx as _jsx } from "react/jsx-runtime";
const Layout_align_bottom = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M6 5H1V4H6V5ZM3 2H4V1H3V2ZM5 3H2V0H5V3Z", fill: color }) }));
};
export default Layout_align_bottom;
