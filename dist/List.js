import { jsx as _jsx } from "react/jsx-runtime";
const List = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 5H0V4H1V5ZM7 4V5H2V4H7ZM1 3H0V2H1V3ZM7 3H2V2H7V3ZM1 1H0V0H1V1ZM7 1H2V0H7V1Z", fill: color }) }));
};
export default List;
