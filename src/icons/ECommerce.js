"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const ECommerce = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M0 0H1V1H0V0ZM2 1H3V2H2V1ZM4 2H3V3H2V4H3V5H4V4H5V5H6V4H7V3H6V2H7V1H6V2H5V1H4V2ZM4 3V2H5V3H4ZM4 3H3V4H4V3ZM5 3V4H6V3H5Z", fill: color }) }));
};
exports.default = ECommerce;
