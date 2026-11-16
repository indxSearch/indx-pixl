import { jsx as _jsx } from "react/jsx-runtime";
const Search_query = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M0 1H2V2H0ZM4 1H6V2H7V3H6V4H7V5H6V4H4V3H3V2H4ZM5 2H4V3H6V2ZM0 3H2V4H0Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Search_query;
