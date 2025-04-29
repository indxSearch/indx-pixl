"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Nuget = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { d: "M5 1V2H6L6 4H5L5 3H4V4L5 4V5L3 5V4L2 4L2 2H3V3L4 3V2L3 2L3 1L5 1ZM2 1L1 1L1 0L2 0V1Z", fill: color }) }));
};
exports.default = Nuget;
