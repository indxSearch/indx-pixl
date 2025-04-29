import { jsx as _jsx } from "react/jsx-runtime";
const User_minus = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { "fill-rule": "evenodd", "clip-rule": "evenodd", d: "M2 0L1 0L1 1L2 1V0ZM2 4V3H3V2L0 2L0 3H1V4H0L0 5H1L1 4L2 4ZM2 4V5H3V4H2ZM5 1L6 1L7 1V2L6 2H5L4 2V1L5 1Z", fill: color }) }));
};
export default User_minus;
