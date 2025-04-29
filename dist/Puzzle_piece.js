import { jsx as _jsx } from "react/jsx-runtime";
const Puzzle_piece = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M6 5H4V4H3V5H1L1 3H0L0 2L1 2L1 0L3 0V1L4 1V0L6 0V2H5V3L6 3L6 5Z", fill: color }) }));
};
export default Puzzle_piece;
