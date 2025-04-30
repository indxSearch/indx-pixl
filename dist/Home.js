import { jsx as _jsx } from "react/jsx-runtime";
const Home = ({ color = "black", size = 21, }) => {
    const aspectRatio = 0.7142857142857143;
    const width = size;
    const height = typeof size === "number" ? size * aspectRatio : `calc(${size} * 0.7142857142857143)`;
    return (_jsx("svg", { width: width, height: height, viewBox: "0 0 7 5", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M4 0H3V1H2V2H1V3V4V5H2H5H6V4V3V2H5V1H4V0ZM2 3V2H3V1H4V2H5V3V4H4V3H3V4H2V3Z", fill: color }) }));
};
export default Home;
