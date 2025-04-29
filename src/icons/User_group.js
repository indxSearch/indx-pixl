"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const User_group = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { d: "M1 5H0V4H1V5ZM3 5H2V4H3V5ZM2 4H1V3H0V2H3V3H2V4ZM5 3H4V2H5V3ZM7 3H6V2H7V3ZM2 1H1V0H2V1ZM5 1H4V0H5V1ZM7 1H6V0H7V1Z", fill: color }) }));
};
exports.default = User_group;
