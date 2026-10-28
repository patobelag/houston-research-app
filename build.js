// Une src/ en un solo public/index.html: node build.js
const fs = require("fs");
const path = require("path");
const src = (f) => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
let html = src("index.src.html");
html = html.replace("/*@@STYLES@@*/", () => src("styles.css"));
html = html.replace("/*@@CORE@@*/", () => src("core.js"));
html = html.replace("/*@@APP@@*/", () => src("app.js"));
fs.mkdirSync(path.join(__dirname, "public"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "public", "index.html"), html);
console.log("public/index.html", (html.length / 1024).toFixed(1) + " KB");

// Onboarding (link aparte): public/onboarding/index.html
let onb = src("onboarding.src.html");
onb = onb.replace("/*@@STYLES@@*/", () => src("styles.css"));
onb = onb.replace("/*@@ONB_STYLES@@*/", () => src("onboarding.css"));
onb = onb.replace("/*@@ONB@@*/", () => src("onboarding.js"));
fs.mkdirSync(path.join(__dirname, "public", "onboarding"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "public", "onboarding", "index.html"), onb);
console.log("public/onboarding/index.html", (onb.length / 1024).toFixed(1) + " KB");
