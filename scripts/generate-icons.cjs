const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, isMaskable = false) {
  // RGBA buffer: 4 bytes per pixel + 1 filter byte per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = (width / 2) * (isMaskable ? 0.95 : 0.85);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: Dental Cyan gradient
      const t = y / height;
      let r = Math.round(2 * (1 - t) + 3 * t);
      let g = Math.round(132 * (1 - t) + 105 * t);
      let b = Math.round(199 * (1 - t) + 161 * t);
      let a = 255;

      // Rounded container if not maskable
      if (!isMaskable) {
        const cornerDist = Math.max(Math.abs(dx) - (width * 0.4), 0);
        const cornerDistY = Math.max(Math.abs(dy) - (height * 0.4), 0);
        if (Math.hypot(cornerDist, cornerDistY) > width * 0.1) {
          a = 0;
        }
      }

      // Draw tooth shape / cross inside safe zone
      const toothScale = width / 512;
      const nx = (x - cx) / toothScale;
      const ny = (y - cy) / toothScale;

      // Cross symbol
      const inCrossH = Math.abs(nx) <= 50 && Math.abs(ny + 10) <= 16;
      const inCrossV = Math.abs(nx) <= 16 && Math.abs(ny + 10) <= 50;
      
      // Tooth body approximation: top lobe and two roots
      const inLobe = (nx * nx) / (110 * 110) + ((ny + 20) * (ny + 20)) / (90 * 90) <= 1;
      const inRootL = nx >= -75 && nx <= -15 && ny >= 10 && ny <= 120 - Math.abs(nx + 45) * 0.5;
      const inRootR = nx >= 15 && nx <= 75 && ny >= 10 && ny <= 120 - Math.abs(nx - 45) * 0.5;

      if (a > 0 && (inLobe || inRootL || inRootR)) {
        if (inCrossH || inCrossV) {
          // Dental cyan cross inside tooth
          r = 2;
          g = 132;
          b = 199;
          a = 255;
        } else {
          // White tooth body
          r = 255;
          g = 255;
          b = 255;
          a = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bits per channel
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression method
  ihdr.writeUInt8(0, 11); // filter method
  ihdr.writeUInt8(0, 12); // interlace method
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 table & function
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, false));

console.log('PWA icons created successfully in public directory!');
