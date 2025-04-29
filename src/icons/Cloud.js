"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Cloud = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M2 1H3H4V2H3L2 2V1ZM1 3V2H2V3H1ZM1 4H0V3H1V4ZM4 4H3H2H1V5H2H3H4H5H6V4H7V3H6V2L5 2L4 2V3H5H6V4H5H4Z", fill: color }) }));
};
exports.default = Cloud;
