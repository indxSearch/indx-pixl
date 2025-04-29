"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Fields = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M3 0H0V1H3V2H5V1H7V0H5V1H3V0ZM2 2H0V3H2V2ZM6 2H7V3H6V2ZM3 4H0V5H3V4ZM5 4H3V3H5V4ZM5 4V5H7V4H5Z", fill: color }) }));
};
exports.default = Fields;
