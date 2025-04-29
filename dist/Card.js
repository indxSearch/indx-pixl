import { jsx as _jsx } from "react/jsx-runtime";
const Card = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M7 5H0V0H7V5ZM1 4H6V3H1V4ZM1 2H2V1H1V2Z", fill: color }) }));
};
export default Card;
