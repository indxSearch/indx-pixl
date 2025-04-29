"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Maximize = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M1 0H2H3V1H2V2H1V1V0ZM5 2V1H4V0H5H6V1V2H5ZM1 3H2V4H3V5H2H1V4V3ZM5 3H6V4V5H5H4V4H5V3Z", fill: color }) }));
};
exports.default = Maximize;
