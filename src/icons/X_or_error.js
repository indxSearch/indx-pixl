"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const X_or_error = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M1 0H2V1H1V0ZM3 2H2V1H3V2ZM4 2H3V3H2V4H1V5H2V4H3V3H4V4H5V5H6V4H5V3H4V2ZM5 1V2H4V1H5ZM5 1V0H6V1H5Z", fill: color }) }));
};
exports.default = X_or_error;
