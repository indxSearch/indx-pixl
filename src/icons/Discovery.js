"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Discovery = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M4 0H3V2H0V3H3V5H4V3H7V2H4V0ZM4 2V3H3V2H4ZM5 0H6V1H5V0ZM2 0H1V1H2V0ZM1 4H2V5H1V4ZM6 4H5V5H6V4Z", fill: color }) }));
};
exports.default = Discovery;
