"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Mail = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { d: "M7 5L0 5L0 0L7 0L7 5ZM2 2H1L1 4L3 4V3H4L4 4L6 4L6 2H5V1L2 1L2 2ZM3 3H2V2L3 2V3ZM5 3H4V2L5 2V3Z", fill: color }) }));
};
exports.default = Mail;
