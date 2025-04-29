"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const User_text = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { d: "M1 5H0L0 4H1L1 5ZM3 5H2V4H3V5ZM7 5H4V4L7 4V5ZM2 4L1 4V3H0L0 2L3 2V3H2V4ZM7 3L4 3V2L7 2V3ZM2 1L1 1L1 0L2 0V1ZM7 1L3 1V0L7 0V1Z", fill: color }) }));
};
exports.default = User_text;
