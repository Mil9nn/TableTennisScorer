import sharp from "sharp";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = join(root, "assets", "feature-graphic.png");
const logoPath = join(root, "assets", "images", "logo.png");

const W = 1024;
const H = 500;

const FONT = "Segoe UI, Arial, sans-serif";
const PLAYER_LEFT = { seed: "James Chen", name: "James", score: 8, sets: 1, serving: true };
const PLAYER_RIGHT = { seed: "Alex Rivera", name: "Alex", score: 6, sets: 0, serving: false };

async function fetchDicebear(seed, size) {
  const url = `https://api.dicebear.com/9.x/glass/png?seed=${encodeURIComponent(seed)}&size=${size * 2}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DiceBear fetch failed for ${seed}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  );
  return sharp(buf)
    .resize(size, size)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

function buildPhoneScreenSvg(sw, sh) {
  const colW = sw / 2;
  const cardH = 158;
  const controlsY = 28 + cardH + 8;
  const historyY = controlsY + 52;

  return `
<svg width="${sw}" height="${sh}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.08"/>
      <stop offset="52%" stop-color="#FFFFFF" stop-opacity="1"/>
      <stop offset="100%" stop-color="#EF4444" stop-opacity="0.08"/>
    </linearGradient>
    <clipPath id="screenClip">
      <rect width="${sw}" height="${sh}" rx="18" ry="18"/>
    </clipPath>
  </defs>
  <g clip-path="url(#screenClip)">
    <rect width="${sw}" height="${sh}" fill="#F1F5F9"/>

    <!-- header -->
    <text x="14" y="22" font-family="${FONT}" font-size="11" font-weight="600" fill="#0F172A">‹ Go Back</text>

    <!-- scoreboard shell -->
    <rect x="0" y="28" width="${sw}" height="${cardH}" fill="#FFFFFF"/>
    <rect x="0" y="28" width="${sw}" height="${cardH}" fill="url(#boardGrad)"/>

    <!-- left player card -->
    <rect x="0" y="28" width="${colW}" height="${cardH}" fill="#F1F5F9"/>
    <rect x="0" y="28" width="${colW}" height="3" fill="#4F46E5"/>
    <line x1="${colW}" y1="28" x2="${colW}" y2="${28 + cardH}" stroke="#E2E8F0" stroke-width="1"/>

    <!-- right player card -->
    <rect x="${colW}" y="28" width="${colW}" height="${cardH}" fill="#F1F5F9"/>
    <rect x="${colW}" y="28" width="${colW}" height="3" fill="#EF4444"/>

    <!-- avatar placeholders (overlaid with dicebear) -->
    <circle cx="30" cy="58" r="15" fill="#E2E8F0" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="${colW + 30}" cy="58" r="15" fill="#E2E8F0" stroke="#E2E8F0" stroke-width="2"/>

    <!-- names -->
    <text x="52" y="56" font-family="${FONT}" font-size="11" font-weight="600" fill="#111827">${PLAYER_LEFT.name}</text>
    <text x="52" y="68" font-family="${FONT}" font-size="7.5" font-weight="700" fill="#F59E0B" letter-spacing="0.4">SERVING</text>

    <text x="${colW + 52}" y="60" font-family="${FONT}" font-size="11" font-weight="600" fill="#111827">${PLAYER_RIGHT.name}</text>

    <!-- scores -->
    <text x="${colW / 2}" y="128" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="800" fill="#111827" letter-spacing="-1">${PLAYER_LEFT.score}</text>
    <text x="${colW + colW / 2}" y="128" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="800" fill="#111827" letter-spacing="-1">${PLAYER_RIGHT.score}</text>

  <!-- tap hint -->
    <text x="${colW / 2}" y="148" text-anchor="middle" font-family="${FONT}" font-size="7" font-weight="500" fill="#6B7280">Tap to add point</text>
    <text x="${colW + colW / 2}" y="148" text-anchor="middle" font-family="${FONT}" font-size="7" font-weight="500" fill="#6B7280">Tap to add point</text>

    <!-- sets won -->
    <text x="${colW / 2}" y="168" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="600" fill="#4B5563">${PLAYER_LEFT.sets} set</text>

    <!-- controls -->
    <rect x="10" y="${controlsY}" width="78" height="28" rx="14" fill="#10B981" fill-opacity="0.35"/>
    <text x="49" y="${controlsY + 18}" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="700" fill="#0F766E">UNDO</text>

    <rect x="97" y="${controlsY}" width="78" height="28" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8"/>
    <text x="136" y="${controlsY + 18}" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="700" fill="#475569">SWAP</text>

    <rect x="184" y="${controlsY}" width="78" height="28" rx="14" fill="#EF4444" fill-opacity="0.35"/>
    <text x="223" y="${controlsY + 18}" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="700" fill="#B91C1C">RESET</text>

    <!-- games history -->
    <text x="14" y="${historyY + 12}" font-family="${FONT}" font-size="8" font-weight="600" fill="#4B5563" letter-spacing="0.6">GAMES HISTORY</text>

    <text x="36" y="${historyY + 30}" text-anchor="middle" font-family="${FONT}" font-size="7" font-weight="600" fill="#6B7280">GAME</text>
    <text x="108" y="${historyY + 30}" text-anchor="middle" font-family="${FONT}" font-size="7" font-weight="600" fill="#6B7280">${PLAYER_LEFT.name.toUpperCase()}</text>
    <text x="196" y="${historyY + 30}" text-anchor="middle" font-family="${FONT}" font-size="7" font-weight="600" fill="#6B7280">${PLAYER_RIGHT.name.toUpperCase()}</text>

    <!-- game 1 -->
    <rect x="10" y="${historyY + 36}" width="${sw - 20}" height="24" rx="6" fill="#FFFFFF"/>
    <text x="36" y="${historyY + 52}" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="600" fill="#6B7280">1</text>
    <text x="108" y="${historyY + 52}" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="#3B82F6">11</text>
    <text x="196" y="${historyY + 52}" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="500" fill="#9CA3AF">9</text>

    <!-- game 2 (current) -->
    <rect x="10" y="${historyY + 64}" width="${sw - 20}" height="24" rx="6" fill="#3B82F6" fill-opacity="0.22"/>
    <text x="36" y="${historyY + 80}" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="600" fill="#374151">2</text>
    <text x="108" y="${historyY + 80}" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="#111827">${PLAYER_LEFT.score}</text>
    <text x="196" y="${historyY + 80}" text-anchor="middle" font-family="${FONT}" font-size="9" font-weight="700" fill="#111827">${PLAYER_RIGHT.score}</text>
  </g>
</svg>`;
}

async function buildPhoneScreen(sw, sh) {
  const avatarSize = 30;
  const [leftAvatar, rightAvatar] = await Promise.all([
    fetchDicebear(PLAYER_LEFT.seed, avatarSize),
    fetchDicebear(PLAYER_RIGHT.seed, avatarSize),
  ]);

  const screenSvg = buildPhoneScreenSvg(sw, sh);
  const screenBase = await sharp(Buffer.from(screenSvg)).png().toBuffer();

  const colW = sw / 2;
  return sharp(screenBase)
    .composite([
      { input: leftAvatar, left: 15, top: 43 },
      { input: rightAvatar, left: colW + 15, top: 43 },
    ])
    .png()
    .toBuffer();
}

function buildBannerSvg() {
  return `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1220"/>
      <stop offset="55%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="42%" r="45%">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="#3B82F6" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="18%" cy="80%" r="35%">
      <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#22D3EE" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  <g opacity="0.06" stroke="#94A3B8" stroke-width="1">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 80}" y1="0" x2="${i * 80}" y2="${H}"/>`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 80}" x2="${W}" y2="${i * 80}"/>`).join("")}
  </g>

  <!-- phone frame -->
  <g filter="url(#shadow)" transform="translate(640, 52)">
    <rect x="0" y="0" width="300" height="396" rx="28" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    <rect x="118" y="12" width="64" height="8" rx="4" fill="#475569"/>
    <!-- screen inset placeholder (filled by composite) -->
    <rect x="14" y="34" width="272" height="348" rx="18" fill="#0F172A"/>
  </g>

  <text x="168" y="92" font-family="${FONT}" font-size="54" font-weight="700" fill="#FFFFFF">TTPro</text>
  <text x="168" y="124" font-family="${FONT}" font-size="18" font-weight="600" fill="#93C5FD">The Home of Table Tennis Players</text>
  <text x="56" y="186" font-family="${FONT}" font-size="18" fill="#CBD5E1">Score matches live. Run tournaments. Track your stats.</text>

  <g font-family="${FONT}" font-size="15" font-weight="600">
    <rect x="56" y="212" width="132" height="36" rx="18" fill="#1D4ED8" fill-opacity="0.35" stroke="#3B82F6" stroke-width="1.2"/>
    <text x="122" y="236" text-anchor="middle" fill="#EFF6FF">Live Scoring</text>
    <rect x="198" y="212" width="132" height="36" rx="18" fill="#1D4ED8" fill-opacity="0.35" stroke="#3B82F6" stroke-width="1.2"/>
    <text x="264" y="236" text-anchor="middle" fill="#EFF6FF">Tournaments</text>
    <rect x="340" y="212" width="118" height="36" rx="18" fill="#1D4ED8" fill-opacity="0.35" stroke="#3B82F6" stroke-width="1.2"/>
    <text x="399" y="236" text-anchor="middle" fill="#EFF6FF">Team Ties</text>
    <rect x="56" y="262" width="146" height="36" rx="18" fill="#0F766E" fill-opacity="0.28" stroke="#14B8A6" stroke-width="1.2"/>
    <text x="129" y="286" text-anchor="middle" fill="#CCFBF1">Match Analytics</text>
    <rect x="212" y="262" width="146" height="36" rx="18" fill="#0F766E" fill-opacity="0.28" stroke="#14B8A6" stroke-width="1.2"/>
    <text x="285" y="286" text-anchor="middle" fill="#CCFBF1">Leaderboards</text>
  </g>

  <rect x="56" y="328" width="92" height="4" rx="2" fill="#22D3EE"/>
</svg>`;
}

const PHONE_X = 654;
const PHONE_Y = 86;
const SCREEN_W = 272;
const SCREEN_H = 348;

const logoSize = 96;
const [logo, phoneScreen, banner] = await Promise.all([
  sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer(),
  buildPhoneScreen(SCREEN_W, SCREEN_H),
  sharp(Buffer.from(buildBannerSvg())).png().toBuffer(),
]);

await sharp(banner)
  .composite([
    { input: logo, left: 56, top: 44 },
    { input: phoneScreen, left: PHONE_X, top: PHONE_Y },
  ])
  .png({ compressionLevel: 9 })
  .toFile(outPath);

const meta = await sharp(outPath).metadata();
console.log(`Created ${outPath} (${meta.width}x${meta.height})`);
