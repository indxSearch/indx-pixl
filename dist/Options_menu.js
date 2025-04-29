import { jsx as _jsx } from "react/jsx-runtime";
const Options_menu = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 5H3V4H4L4 5ZM4 3H3V2L4 2V3ZM4 1L3 1V0L4 0V1Z", fill: color }) }));
};
export default Options_menu;
