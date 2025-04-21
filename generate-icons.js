const fs = require('fs');
const { createCanvas } = require('canvas');

// Create icons directory if it doesn't exist
if (!fs.existsSync('img/icons')) {
    fs.mkdirSync('img/icons', { recursive: true });
}

// Function to generate icon
function generateIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, size, size);

    // Grid pattern
    ctx.fillStyle = '#ffffff';
    const gridSize = size / 8;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 2 === 0) {
                ctx.fillRect(i * gridSize, j * gridSize, gridSize, gridSize);
            }
        }
    }

    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`img/icons/${filename}`, buffer);
}

// Generate icons
generateIcon(192, 'icon-192x192.png');
generateIcon(512, 'icon-512x512.png');

// Create favicon
const faviconCanvas = createCanvas(32, 32);
const faviconCtx = faviconCanvas.getContext('2d');

// Background
faviconCtx.fillStyle = '#3b82f6';
faviconCtx.fillRect(0, 0, 32, 32);

// Grid pattern
faviconCtx.fillStyle = '#ffffff';
const faviconGridSize = 32 / 4;
for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
        if ((i + j) % 2 === 0) {
            faviconCtx.fillRect(i * faviconGridSize, j * faviconGridSize, faviconGridSize, faviconGridSize);
        }
    }
}

// Save favicon
const faviconBuffer = faviconCanvas.toBuffer('image/png');
fs.writeFileSync('img/icons/favicon.ico', faviconBuffer);

console.log('Icons generated successfully!'); 