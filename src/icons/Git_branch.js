"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Git_branch = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M2 5H1V4H0V3H1V2V1V0H2V1V2V3H3H4H5V2H4V1H5V0H6V1H7V2H6V3H5V4H4H3H2V5ZM6 2H5V1H6V2ZM2 4V3H1V4H2Z", fill: color }) }));
};
exports.default = Git_branch;
