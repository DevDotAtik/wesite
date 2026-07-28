const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const svgPath = path.join(__dirname, "icons", "icon.svg");
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [16, 48, 128];

async function generate() {
  for (const size of sizes) {
    const outPath = path.join(__dirname, "icons", `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Created icon-${size}.png`);
  }
  console.log("All icons generated!");
}

generate().catch(console.error);
