const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function resize() {
  const inputPath = path.join(__dirname, 'public/images/articles/u18.jpg');
  const outputPath = path.join(__dirname, 'public/images/articles/u18_small.jpg');

  try {
    console.log("Starting image compression for U18 photo (17MB)...");
    await sharp(inputPath)
      .resize(1200) // Max width 1200px
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    // Replace the original with the compressed one
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);
    
    const stats = fs.statSync(inputPath);
    console.log(`Image compressed successfully! New size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (err) {
    console.error("Error compressing image:", err);
  }
}

resize();
