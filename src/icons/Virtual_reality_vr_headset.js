"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Virtual_reality_vr_headset = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return ((0, jsx_runtime_1.jsx)("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: (0, jsx_runtime_1.jsx)("path", { d: "M3 5H1V4H3V5ZM6 5H4V4H6V5ZM1 4H0V1H1V4ZM4 4H3V3H4V4ZM7 4H6V1H7V4ZM6 0V1H1V0H6Z", fill: color }) }));
};
exports.default = Virtual_reality_vr_headset;
