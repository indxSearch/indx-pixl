"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Check = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V3H1V4H2V5H3V4H4V3H5V2H6V1H7V0Z", fill: color }) }));
};
exports.default = Check;
