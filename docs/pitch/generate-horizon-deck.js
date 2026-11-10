/**
 * Aurove Horizon — Wave 2 pitch deck generator (PptxGenJS).
 *
 * Adapted from institutional_crypto_exchange_pitch_deck.js
 * (dark navy / electric blue fintech theme).
 *
 * Usage (from repo root):
 *   npm install pptxgenjs          # once, locally or globally
 *   node docs/pitch/generate-horizon-deck.js
 *
 * Output: docs/pitch/Aurove-Horizon-Wave2.pptx
 */

const path = require("path");
const Module = require("module");

function loadPptxgen() {
  try {
    return require("pptxgenjs");
  } catch (_) {
    /* continue */
  }
  const candidates = [
    path.join(__dirname, "node_modules"),
    path.join(__dirname, "../../node_modules"),
    "/tmp/horizon-pptx/node_modules",
  ];
  for (const dir of candidates) {
    try {
      const req = Module.createRequire(path.join(dir, "pptxgenjs/package.json"));
      return req("pptxgenjs");
    } catch (_) {
      /* try next */
    }
  }
  console.error(
    "Missing pptxgenjs. Run: npm install pptxgenjs\n" +
      "Or: npm install pptxgenjs --prefix /tmp/horizon-pptx && NODE_PATH=/tmp/horizon-pptx/node_modules node docs/pitch/generate-horizon-deck.js"
  );
  process.exit(1);
}

const pptxgen = loadPptxgen();

const FONT_SANS = "Arial";
const FONT_MONO = "Consolas";

const COLOR = {
  bg: "0B1220",
  bgPanel: "111A2E",
  bgPanel2: "0F1A30",
  border: "1E2A44",
  borderSoft: "1A2540",
  white: "FFFFFF",
  text: "E5ECF6",
  textMute: "8FA0BD",
  textDim: "5C6E8E",
  textDimmer: "3F4F6E",
  blue: "4F8CFF",
  blueSoft: "6C9CFF",
  blueDeep: "1F3A78",
  green: "22C55E",
  amber: "F2B650",
  teal: "2DD4BF",
};

const TOTAL = 7;
const OUT = path.join(__dirname, "Aurove-Horizon-Wave2.pptx");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
const SW = 13.3;
const SH = 7.5;
pres.title = "Aurove Horizon — Wave 2";
pres.author = "Aurove";
pres.subject = "Mezo Buildathon / AKINDO Wave 2 pitch deck";

function bg(slide) {
  slide.background = { color: COLOR.bg };
}

function footerChrome(slide, pageNum) {
  slide.addShape(pres.shapes.DIAMOND, {
    x: 0.55,
    y: 7.05,
    w: 0.22,
    h: 0.22,
    fill: { type: "none" },
    line: { color: COLOR.textDim, width: 1 },
  });
  slide.addText("AUROVE HORIZON", {
    x: 0.85,
    y: 6.97,
    w: 3.5,
    h: 0.36,
    fontFace: FONT_MONO,
    fontSize: 9,
    color: COLOR.textDim,
    charSpacing: 3,
    valign: "middle",
    margin: 0,
  });
  slide.addText(
    `${String(pageNum).padStart(2, "0")} / ${String(TOTAL).padStart(2, "0")}`,
    {
      x: SW - 1.6,
      y: 6.97,
      w: 1.1,
      h: 0.36,
      fontFace: FONT_MONO,
      fontSize: 9,
      color: COLOR.textDim,
      charSpacing: 3,
      align: "right",
      valign: "middle",
      margin: 0,
    }
  );
}

function eyebrow(slide, text, x = 0.6, y = 0.45, w = 8) {
  slide.addText(text, {
    x,
    y,
    w,
    h: 0.32,
    fontFace: FONT_MONO,
    fontSize: 10,
    color: COLOR.blue,
    charSpacing: 4,
    valign: "middle",
    margin: 0,
  });
}

function card(slide, x, y, w, h) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: COLOR.bgPanel },
    line: { color: COLOR.border, width: 1 },
    rectRadius: 0.08,
  });
}

function accentBar(slide, x, y, h, color = COLOR.blue) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x,
    y,
    w: 0.06,
    h,
    fill: { color },
    line: { color, width: 0 },
  });
}

// ============================================================
// SLIDE 1 — TITLE
// ============================================================
function slideTitle() {
  const s = pres.addSlide();
  bg(s);

  s.addText("AUROVE  \u00B7  MEZO BUILDATHON  \u00B7  WAVE 2", {
    x: 0.6,
    y: 0.45,
    w: 8,
    h: 0.32,
    fontFace: FONT_MONO,
    fontSize: 10,
    color: COLOR.textDim,
    charSpacing: 3,
    valign: "middle",
    margin: 0,
  });
  s.addText("AKINDO", {
    x: SW - 2.4,
    y: 0.45,
    w: 1.8,
    h: 0.32,
    fontFace: FONT_MONO,
    fontSize: 10,
    color: COLOR.textDim,
    charSpacing: 3,
    align: "right",
    valign: "middle",
    margin: 0,
  });

  s.addText("CROSS-CHAIN LIQUIDITY FOR LOCKED MEZO CAPITAL", {
    x: 0.6,
    y: 2.35,
    w: 12,
    h: 0.36,
    fontFace: FONT_MONO,
    fontSize: 12,
    color: COLOR.blue,
    charSpacing: 3,
    margin: 0,
  });

  s.addText("Aurove Horizon", {
    x: 0.6,
    y: 2.85,
    w: 12,
    h: 1.0,
    fontFace: FONT_SANS,
    fontSize: 54,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });

  s.addText("Locked on Mezo. Liquid everywhere.", {
    x: 0.6,
    y: 3.95,
    w: 12,
    h: 0.55,
    fontFace: FONT_SANS,
    fontSize: 26,
    color: COLOR.text,
    margin: 0,
  });

  s.addText(
    "ERC-4626 vault shares of Aurove liquid wrappers, bridged via Wormhole NTT\nto Aerodrome pools on Base — without unlocking Mezo Earn positions.",
    {
      x: 0.6,
      y: 4.75,
      w: 11,
      h: 0.8,
      fontFace: FONT_SANS,
      fontSize: 15,
      color: COLOR.textMute,
      margin: 0,
    }
  );

  footerChrome(s, 1);
}

// ============================================================
// SLIDE 2 — PROBLEM / SOLUTION
// ============================================================
function slideProblemSolution() {
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "PROBLEM  /  SOLUTION");
  s.addText("Locked yield vs. portable liquidity", {
    x: 0.6,
    y: 0.85,
    w: 12,
    h: 0.55,
    fontFace: FONT_SANS,
    fontSize: 28,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });

  // Problem card
  card(s, 0.6, 1.7, 5.8, 4.5);
  accentBar(s, 0.6, 1.7, 4.5, COLOR.amber);
  s.addText("THE TRADE-OFF", {
    x: 0.9,
    y: 1.95,
    w: 5.2,
    h: 0.3,
    fontFace: FONT_MONO,
    fontSize: 11,
    color: COLOR.amber,
    charSpacing: 3,
    margin: 0,
  });
  s.addText("Mezo Earn locks create real yield — and real friction.", {
    x: 0.9,
    y: 2.4,
    w: 5.2,
    h: 0.55,
    fontFace: FONT_SANS,
    fontSize: 16,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });
  s.addText(
    [
      {
        text: "veBTC / veMEZO earn incentives but capital is illiquid",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Single-chain liquidity caps secondary markets",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Users choose lock yield or Base/DeFi utility — not both",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Emissions stay siloed; LPs elsewhere cannot hold Mezo-backed exposure",
        options: { bullet: true },
      },
    ],
    {
      x: 0.9,
      y: 3.15,
      w: 5.2,
      h: 2.6,
      fontFace: FONT_SANS,
      fontSize: 14,
      color: COLOR.textMute,
      paraSpaceAfter: 10,
      margin: 0,
    }
  );

  // Solution card
  card(s, 6.9, 1.7, 5.8, 4.5);
  accentBar(s, 6.9, 1.7, 4.5, COLOR.green);
  s.addText("HORIZON", {
    x: 7.2,
    y: 1.95,
    w: 5.2,
    h: 0.3,
    fontFace: FONT_MONO,
    fontSize: 11,
    color: COLOR.green,
    charSpacing: 3,
    margin: 0,
  });
  s.addText("Keep the lock. Export the economics.", {
    x: 7.2,
    y: 2.4,
    w: 5.2,
    h: 0.55,
    fontFace: FONT_SANS,
    fontSize: 16,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });
  s.addText(
    [
      {
        text: "Aurove liquidizes veNFTs → Id20 ERC-20 wrappers",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Horizon wraps Id20 into ERC-4626 vault shares",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Wormhole NTT moves shares Mezo ↔ Base",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Aerodrome LPs trade / provide avMEZOv–MUSD liquidity",
        options: { bullet: true },
      },
    ],
    {
      x: 7.2,
      y: 3.15,
      w: 5.2,
      h: 2.6,
      fontFace: FONT_SANS,
      fontSize: 14,
      color: COLOR.textMute,
      paraSpaceAfter: 10,
      margin: 0,
    }
  );

  footerChrome(s, 2);
}

// ============================================================
// SLIDE 3 — ARCHITECTURE FLOW
// ============================================================
function slideArchitecture() {
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "ARCHITECTURE");
  s.addText("veNFT → Id20 → Vault → NTT → Aero", {
    x: 0.6,
    y: 0.85,
    w: 12,
    h: 0.5,
    fontFace: FONT_SANS,
    fontSize: 28,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });

  const steps = [
    { label: "01", title: "veNFT", sub: "Mezo Earn\nveBTC / veMEZO", c: COLOR.amber },
    { label: "02", title: "Aurove", sub: "ERC-1155 →\nId20 ERC-20", c: COLOR.blue },
    { label: "03", title: "Vault", sub: "Horizon\nERC-4626", c: COLOR.blueSoft },
    { label: "04", title: "NTT", sub: "Wormhole\nMezo ↔ Base", c: COLOR.teal },
    { label: "05", title: "Aero", sub: "av*v / MUSD\nSlipstream LP", c: COLOR.green },
  ];

  const cardW = 2.15;
  const gap = 0.3;
  const startX = 0.6;
  const y = 1.7;

  steps.forEach((step, i) => {
    const x = startX + i * (cardW + gap);
    card(s, x, y, cardW, 3.4);
    s.addText(step.label, {
      x: x + 0.15,
      y: y + 0.25,
      w: cardW - 0.3,
      h: 0.35,
      fontFace: FONT_MONO,
      fontSize: 12,
      color: step.c,
      charSpacing: 2,
      margin: 0,
    });
    s.addText(step.title, {
      x: x + 0.15,
      y: y + 0.75,
      w: cardW - 0.3,
      h: 0.55,
      fontFace: FONT_SANS,
      fontSize: 22,
      bold: true,
      color: COLOR.white,
      margin: 0,
    });
    s.addText(step.sub, {
      x: x + 0.15,
      y: y + 1.5,
      w: cardW - 0.3,
      h: 1.4,
      fontFace: FONT_SANS,
      fontSize: 14,
      color: COLOR.textMute,
      margin: 0,
    });
    if (i < steps.length - 1) {
      s.addText("→", {
        x: x + cardW - 0.05,
        y: y + 1.35,
        w: gap + 0.1,
        h: 0.4,
        fontFace: FONT_SANS,
        fontSize: 18,
        color: COLOR.textDim,
        align: "center",
        margin: 0,
      });
    }
  });

  s.addText(
    "Underlying veNFTs stay on Mezo. Horizon transports tokenized economics — not custody of the locks.",
    {
      x: 0.6,
      y: 5.4,
      w: 12,
      h: 0.45,
      fontFace: FONT_SANS,
      fontSize: 14,
      color: COLOR.textMute,
      margin: 0,
    }
  );

  footerChrome(s, 3);
}

// ============================================================
// SLIDE 4 — DEMO PATH WAVE 2
// ============================================================
function slideDemo() {
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "DEMO PATH  \u00B7  WAVE 2");
  s.addText("From vault share to Aerodrome LP", {
    x: 0.6,
    y: 0.85,
    w: 12,
    h: 0.5,
    fontFace: FONT_SANS,
    fontSize: 28,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });

  const rows = [
    {
      n: "1",
      title: "Deposit Id20 → Horizon vault (Mezo)",
      detail: "Mint avMEZOv / avBTCv ERC-4626 shares; yield compounds on Mezo",
    },
    {
      n: "2",
      title: "Bridge shares via Wormhole NTT",
      detail: "Mezo → Base Sepolia (testnet) or Base (mainnet); peer token receives",
    },
    {
      n: "3",
      title: "Swap / LP on Aerodrome Slipstream",
      detail: "avMEZOv–MUSD (and avBTCv–MUSD) CL pools; E2E script + mainnet runbook",
    },
    {
      n: "4",
      title: "Optional return leg",
      detail: "Remove LP → bridge shares back → redeem Id20 under Aurove rules",
    },
  ];

  rows.forEach((row, i) => {
    const y = 1.55 + i * 1.15;
    card(s, 0.6, y, 12.1, 1.0);
    s.addShape(pres.shapes.OVAL, {
      x: 0.85,
      y: y + 0.28,
      w: 0.45,
      h: 0.45,
      fill: { color: COLOR.blueDeep },
      line: { color: COLOR.blue, width: 1.25 },
    });
    s.addText(row.n, {
      x: 0.85,
      y: y + 0.28,
      w: 0.45,
      h: 0.45,
      fontFace: FONT_MONO,
      fontSize: 14,
      bold: true,
      color: COLOR.blue,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    s.addText(row.title, {
      x: 1.55,
      y: y + 0.15,
      w: 10.8,
      h: 0.35,
      fontFace: FONT_SANS,
      fontSize: 16,
      bold: true,
      color: COLOR.white,
      margin: 0,
    });
    s.addText(row.detail, {
      x: 1.55,
      y: y + 0.5,
      w: 10.8,
      h: 0.35,
      fontFace: FONT_SANS,
      fontSize: 13,
      color: COLOR.textMute,
      margin: 0,
    });
  });

  footerChrome(s, 4);
}

// ============================================================
// SLIDE 5 — BUSINESS MODEL FLYWHEEL (CRITICAL)
// ============================================================
function slideFlywheel() {
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "BUSINESS MODEL  \u00B7  FLYWHEEL");
  s.addText("Mezo yield exported. Aero liquidity earned.", {
    x: 0.6,
    y: 0.8,
    w: 12,
    h: 0.45,
    fontFace: FONT_SANS,
    fontSize: 26,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });

  const boxes = [
    {
      x: 0.5,
      y: 1.4,
      title: "SUPPLY",
      color: COLOR.blue,
      body:
        "Lock MEZO → veMEZO → Aurove → Horizon avMEZOv → bridge → LP avMEZOv/MUSD on Aerodrome",
    },
    {
      x: 4.55,
      y: 1.4,
      title: "MEZO YIELD",
      color: COLOR.amber,
      body:
        "Aurove-managed veMEZO voting directs Mezo emissions to liquid-wrapper gauges → Id20 rewards → vault compound → share appreciation",
    },
    {
      x: 8.6,
      y: 1.4,
      title: "BASE LIQUIDITY",
      color: COLOR.teal,
      body: "Pool fees on Aerodrome (+ AERO incentives later). LPs hold appreciating vault shares, not bare wrappers.",
    },
  ];

  boxes.forEach((b) => {
    card(s, b.x, b.y, 3.85, 2.55);
    accentBar(s, b.x, b.y, 2.55, b.color);
    s.addText(b.title, {
      x: b.x + 0.25,
      y: b.y + 0.2,
      w: 3.4,
      h: 0.3,
      fontFace: FONT_MONO,
      fontSize: 11,
      color: b.color,
      charSpacing: 2,
      margin: 0,
    });
    s.addText(b.body, {
      x: b.x + 0.25,
      y: b.y + 0.65,
      w: 3.4,
      h: 1.7,
      fontFace: FONT_SANS,
      fontSize: 13,
      color: COLOR.text,
      margin: 0,
    });
  });

  // Demand loop
  card(s, 0.5, 4.15, 5.9, 2.15);
  s.addText("DEMAND LOOP", {
    x: 0.75,
    y: 4.35,
    w: 5.4,
    h: 0.28,
    fontFace: FONT_MONO,
    fontSize: 11,
    color: COLOR.green,
    charSpacing: 2,
    margin: 0,
  });
  s.addText(
    "Deeper Aero LP → better exit for bridged shares → more locks / deposits → larger Aurove voting power → more emissions into wrappers → stronger share NAV → attracts more LP demand.",
    {
      x: 0.75,
      y: 4.75,
      w: 5.4,
      h: 1.3,
      fontFace: FONT_SANS,
      fontSize: 13,
      color: COLOR.textMute,
      margin: 0,
    }
  );

  // One-liner + caveat
  card(s, 6.65, 4.15, 6.05, 2.15);
  s.addText("ONE-LINER", {
    x: 6.9,
    y: 4.35,
    w: 5.55,
    h: 0.28,
    fontFace: FONT_MONO,
    fontSize: 11,
    color: COLOR.blue,
    charSpacing: 2,
    margin: 0,
  });
  s.addText(
    "Horizon exports Mezo-locked yield as ERC-4626 shares to Base, while Aurove’s veMEZO voting keeps directing Mezo emissions into the same liquid wrappers that back those shares—so Aero LPs hold an asset that grows with Mezo incentives.",
    {
      x: 6.9,
      y: 4.7,
      w: 5.55,
      h: 1.15,
      fontFace: FONT_SANS,
      fontSize: 12,
      color: COLOR.text,
      margin: 0,
    }
  );
  s.addText(
    "Do not claim Mezo emissions pay Aero LPs directly.",
    {
      x: 6.9,
      y: 5.9,
      w: 5.55,
      h: 0.28,
      fontFace: FONT_SANS,
      fontSize: 11,
      italic: true,
      color: COLOR.amber,
      margin: 0,
    }
  );

  footerChrome(s, 5);
}

// ============================================================
// SLIDE 6 — TEAM
// ============================================================
function slideTeam() {
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "TEAM");
  s.addText("Aurove core contributors", {
    x: 0.6,
    y: 0.85,
    w: 12,
    h: 0.5,
    fontFace: FONT_SANS,
    fontSize: 28,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });
  s.addText(
    "Names, roles, and contacts TBD — placeholders only until confirmed. No invented biographies.",
    {
      x: 0.6,
      y: 1.4,
      w: 12,
      h: 0.35,
      fontFace: FONT_SANS,
      fontSize: 14,
      color: COLOR.textMute,
      margin: 0,
    }
  );

  const people = [
    { name: "Aurove core contributors", role: "Protocol / product", contact: "TBD" },
    { name: "TBD", role: "Engineering", contact: "TBD" },
    { name: "TBD", role: "Design / GTM", contact: "TBD" },
  ];

  people.forEach((p, i) => {
    const x = 0.6 + i * 4.15;
    card(s, x, 2.1, 3.95, 3.5);
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.35,
      y: 2.45,
      w: 1.25,
      h: 1.25,
      fill: { color: COLOR.bgPanel2 },
      line: { color: COLOR.border, width: 1.5 },
    });
    s.addText("?", {
      x: x + 1.35,
      y: 2.45,
      w: 1.25,
      h: 1.25,
      fontFace: FONT_SANS,
      fontSize: 36,
      color: COLOR.textDim,
      align: "center",
      valign: "middle",
      margin: 0,
    });
    s.addText(p.name, {
      x: x + 0.2,
      y: 3.95,
      w: 3.55,
      h: 0.45,
      fontFace: FONT_SANS,
      fontSize: 15,
      bold: true,
      color: COLOR.white,
      align: "center",
      margin: 0,
    });
    s.addText(p.role, {
      x: x + 0.2,
      y: 4.45,
      w: 3.55,
      h: 0.35,
      fontFace: FONT_MONO,
      fontSize: 12,
      color: COLOR.blue,
      align: "center",
      margin: 0,
    });
    s.addText(p.contact, {
      x: x + 0.2,
      y: 4.95,
      w: 3.55,
      h: 0.3,
      fontFace: FONT_SANS,
      fontSize: 12,
      color: COLOR.textDim,
      align: "center",
      margin: 0,
    });
  });

  footerChrome(s, 6);
}

// ============================================================
// SLIDE 7 — LINKS / ASK
// ============================================================
function slideAsk() {
  const s = pres.addSlide();
  bg(s);
  eyebrow(s, "LINKS  /  ASK");
  s.addText("Ship Wave 2. Grow the flywheel.", {
    x: 0.6,
    y: 0.85,
    w: 12,
    h: 0.5,
    fontFace: FONT_SANS,
    fontSize: 28,
    bold: true,
    color: COLOR.white,
    margin: 0,
  });

  card(s, 0.6, 1.6, 7.4, 4.5);
  s.addText("PUBLIC SURFACES", {
    x: 0.9,
    y: 1.85,
    w: 6.8,
    h: 0.3,
    fontFace: FONT_MONO,
    fontSize: 11,
    color: COLOR.blue,
    charSpacing: 2,
    margin: 0,
  });

  const links = [
    ["dApp", "https://www.aurove.xyz  ·  testnet.aurove.xyz"],
    ["Horizon repo", "https://github.com/aurove/horizon  (public)"],
    ["dApp repo", "https://github.com/aurove/dapp  (public)"],
    ["Submission", "SUBMISSION.md — addresses, env, checklist"],
    ["Mainnet pools", "aero/docs/mainnet-pools.md"],
    ["This deck", "docs/pitch/Aurove-Horizon-Wave2.pptx"],
  ];
  links.forEach((row, i) => {
    const y = 2.35 + i * 0.52;
    s.addText(row[0], {
      x: 0.9,
      y,
      w: 2.2,
      h: 0.4,
      fontFace: FONT_SANS,
      fontSize: 14,
      bold: true,
      color: COLOR.white,
      margin: 0,
    });
    s.addText(row[1], {
      x: 3.1,
      y,
      w: 4.6,
      h: 0.4,
      fontFace: FONT_MONO,
      fontSize: 12,
      color: COLOR.textMute,
      margin: 0,
    });
  });

  card(s, 8.3, 1.6, 4.4, 4.5);
  accentBar(s, 8.3, 1.6, 4.5, COLOR.green);
  s.addText("THE ASK", {
    x: 8.6,
    y: 1.85,
    w: 3.9,
    h: 0.3,
    fontFace: FONT_MONO,
    fontSize: 11,
    color: COLOR.green,
    charSpacing: 2,
    margin: 0,
  });
  s.addText(
    [
      {
        text: "Judge review of public dApp + Horizon contracts",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Feedback on Wave 2 Aero LP path",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Partners for mainnet pool seeding / AERO gauges",
        options: { bullet: true, breakLine: true },
      },
      {
        text: "Demo txs TBD until live E2E broadcast",
        options: { bullet: true },
      },
    ],
    {
      x: 8.6,
      y: 2.4,
      w: 3.9,
      h: 3.2,
      fontFace: FONT_SANS,
      fontSize: 14,
      color: COLOR.text,
      paraSpaceAfter: 12,
      margin: 0,
    }
  );

  footerChrome(s, 7);
}

async function main() {
  slideTitle();
  slideProblemSolution();
  slideArchitecture();
  slideDemo();
  slideFlywheel();
  slideTeam();
  slideAsk();
  await pres.writeFile({ fileName: OUT });
  console.log("Wrote", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
