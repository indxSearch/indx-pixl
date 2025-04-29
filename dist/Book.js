import { jsx as _jsx } from "react/jsx-runtime";
const Book = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M4 5H3V4H0V1H1V3H3V1H4V3H6V1H7V4H4V5ZM3 1H1V0H3V1ZM6 1H4V0H6V1Z", fill: color }) }));
};
export default Book;
