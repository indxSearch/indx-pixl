"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Panel_delete = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 5H0V0H7V1H1V4H3V5ZM5 5H4V4H5V5ZM7 5H6V4H7V5ZM6 4H5V3H6V4ZM5 3H4V2H5V3ZM7 3H6V2H7V3Z", fill: color }) }));
};
exports.default = Panel_delete;
