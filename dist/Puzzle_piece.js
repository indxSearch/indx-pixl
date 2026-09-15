import { jsx as _jsx } from "react/jsx-runtime";
const Puzzle_piece = ({ color, size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 0H3V1H4V0H6V2H5V3H6V5H4V4H3V5H1V3H0V2H1Z", fill: color !== null && color !== void 0 ? color : "var(--lv8)" }) }));
};
export default Puzzle_piece;
