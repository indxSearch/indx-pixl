import { jsx as _jsx } from "react/jsx-runtime";
const Rss_feed = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H4V1H5V2H6V5H5V2H4V1H1ZM1 2H3V3H4V5H3V3H1ZM1 4H2V5H1Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Rss_feed;
