import { jsx as _jsx } from "react/jsx-runtime";
const Special_characters = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M6 1H4V2H5V3H4V4H6V5H3V3H2V5H1V1H2V2H3V1H2V0H6V1Z", fill: color }) }));
};
export default Special_characters;
