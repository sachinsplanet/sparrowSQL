import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generate() {
  const browser = await chromium.launch({
    args: process.platform === "linux"
      ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
      : [],
  });

  const page = await browser.newPage();

  // 1. Generate OG Image (1200x630)
  await page.setViewportSize({ width: 1200, height: 630 });
  const ogHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,700;800&family=JetBrains+Mono:wght@500;700&family=Manrope:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1200px;
        height: 630px;
        background: #08090e;
        color: #eef0f7;
        font-family: 'Manrope', -apple-system, sans-serif;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 72px 84px;
        position: relative;
        overflow: hidden;
      }
      .bg-glow-1 {
        position: absolute;
        top: -120px;
        left: -80px;
        width: 700px;
        height: 700px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(139, 108, 255, 0.22) 0%, transparent 68%);
        pointer-events: none;
      }
      .bg-glow-2 {
        position: absolute;
        bottom: -150px;
        right: -80px;
        width: 750px;
        height: 750px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 180, 84, 0.16) 0%, transparent 68%);
        pointer-events: none;
      }
      .grid-lines {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 48px 48px;
        pointer-events: none;
      }
      .content {
        position: relative;
        z-index: 2;
        max-width: 680px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 18px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(16, 18, 27, 0.75);
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: #a2a9bf;
        margin-bottom: 28px;
      }
      .badge-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #42dd9b;
        box-shadow: 0 0 10px #42dd9b;
      }
      h1 {
        font-family: 'Bricolage Grotesque', sans-serif;
        font-size: 72px;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.02;
        margin-bottom: 20px;
      }
      .accent { color: #8b6cff; }
      .lead {
        font-size: 24px;
        color: #a2a9bf;
        line-height: 1.35;
        margin-bottom: 34px;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .tag {
        background: rgba(23, 26, 38, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 9px 18px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        color: #eef0f7;
      }
      .tag-accent {
        background: rgba(139, 108, 255, 0.16);
        border-color: rgba(139, 108, 255, 0.4);
        color: #c4b5fd;
      }
      .mascot-box {
        position: relative;
        z-index: 2;
        width: 320px;
        height: 320px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .sparrow-svg {
        width: 300px;
        height: 300px;
        filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 50px rgba(139, 108, 255, 0.3));
      }
    </style>
  </head>
  <body>
    <div class="bg-glow-1"></div>
    <div class="bg-glow-2"></div>
    <div class="grid-lines"></div>

    <div class="content">
      <div class="badge">
        <span class="badge-dot"></span>
        In-Browser WebAssembly SQL
      </div>
      <h1>sparrow<span class="accent">sql</span></h1>
      <p class="lead">Learn SQL by actually using SQL. Write queries against a real database in your browser with guidance from an intelligent tutor.</p>
      <div class="tags">
        <div class="tag tag-accent">12 Modules</div>
        <div class="tag">3 Capstone Schemas</div>
        <div class="tag">sql.js WASM Sandbox</div>
        <div class="tag">Zero Backend Needed</div>
      </div>
    </div>

    <div class="mascot-box">
      <svg class="sparrow-svg" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffb454" />
            <stop offset="100%" stop-color="#c9743a" />
          </linearGradient>
          <linearGradient id="head" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffc06a" />
            <stop offset="100%" stop-color="#ffb454" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#8b6cff" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#8b6cff" stop-opacity="0" />
          </radialGradient>
        </defs>
        <circle cx="70" cy="74" r="62" fill="url(#glow)" />
        <path d="M40 84 L18 74 Q14 82 20 90 L18 100 Q30 100 42 94 Z" fill="#b9682f" />
        <g stroke="#e08a2e" stroke-width="3.4" stroke-linecap="round">
          <path d="M62 108 L60 120 M62 108 L67 119" />
          <path d="M80 108 L80 120 M80 108 L85 119" />
        </g>
        <ellipse cx="70" cy="82" rx="34" ry="30" fill="url(#body)" />
        <ellipse cx="72" cy="90" rx="20" ry="18" fill="#ffe6c2" opacity="0.95" />
        <path d="M64 72 Q48 74 44 92 Q58 96 70 86 Q70 76 64 72 Z" fill="#a95f2b" />
        <circle cx="82" cy="52" r="26" fill="url(#head)" />
        <path d="M78 27 Q82 18 90 24 Q84 26 83 31 Z" fill="#b9682f" />
        <circle cx="70" cy="60" r="5" fill="#ff9d7a" opacity="0.6" />
        <path d="M104 52 L124 57 L104 63 Z" fill="#f2932c" />
        <circle cx="92" cy="47" r="5.4" fill="#241a12" />
        <circle cx="93.6" cy="45.2" r="1.7" fill="#fff" />
      </svg>
    </div>
  </body>
  </html>
  `;
  await page.setContent(ogHtml, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(publicDir, "og-image.png"), type: "png" });
  console.log("Created og-image.png (1200x630)");

  // 2. Generate square icons: 512, 192, 180 (apple-touch-icon)
  const iconSizes = [
    { name: "icon-512.png", size: 512 },
    { name: "icon-192.png", size: 192 },
    { name: "apple-touch-icon.png", size: 180 },
  ];

  for (const { name, size } of iconSizes) {
    await page.setViewportSize({ width: size, height: size });
    const iconHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: ${size}px;
          height: ${size}px;
          background: #08090e;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: ${size > 190 ? "24%" : "22%"};
          overflow: hidden;
        }
        svg {
          width: 84%;
          height: 84%;
        }
      </style>
    </head>
    <body>
      <svg viewBox="0 0 140 140">
        <defs>
          <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffb454" />
            <stop offset="100%" stop-color="#c9743a" />
          </linearGradient>
          <linearGradient id="head" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffc06a" />
            <stop offset="100%" stop-color="#ffb454" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#8b6cff" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#8b6cff" stop-opacity="0" />
          </radialGradient>
        </defs>
        <circle cx="70" cy="74" r="62" fill="url(#glow)" />
        <path d="M40 84 L18 74 Q14 82 20 90 L18 100 Q30 100 42 94 Z" fill="#b9682f" />
        <g stroke="#e08a2e" stroke-width="3.4" stroke-linecap="round">
          <path d="M62 108 L60 120 M62 108 L67 119" />
          <path d="M80 108 L80 120 M80 108 L85 119" />
        </g>
        <ellipse cx="70" cy="82" rx="34" ry="30" fill="url(#body)" />
        <ellipse cx="72" cy="90" rx="20" ry="18" fill="#ffe6c2" opacity="0.95" />
        <path d="M64 72 Q48 74 44 92 Q58 96 70 86 Q70 76 64 72 Z" fill="#a95f2b" />
        <circle cx="82" cy="52" r="26" fill="url(#head)" />
        <path d="M78 27 Q82 18 90 24 Q84 26 83 31 Z" fill="#b9682f" />
        <circle cx="70" cy="60" r="5" fill="#ff9d7a" opacity="0.6" />
        <path d="M104 52 L124 57 L104 63 Z" fill="#f2932c" />
        <circle cx="92" cy="47" r="5.4" fill="#241a12" />
        <circle cx="93.6" cy="45.2" r="1.7" fill="#fff" />
      </svg>
    </body>
    </html>
    `;
    await page.setContent(iconHtml, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(publicDir, name), type: "png" });
    console.log(`Created ${name} (${size}x${size})`);
  }

  await browser.close();
  console.log("All launch assets generated successfully!");
}

generate().catch(err => {
  console.error("Error generating assets:", err);
  process.exit(1);
});
