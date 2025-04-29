"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Coverage_index = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { d: "M4 5H3V4H4V5ZM1 4H0V3H1V4ZM7 4H6V3H7V4ZM2 3H1V2H2V3ZM4 3H3V2H4V3ZM6 3H5V2H6V3ZM1 2H0V1H1V2ZM7 1V2H6V1H7ZM4 1H3V0H4V1Z", fill: color }) }));
};
exports.default = Coverage_index;
