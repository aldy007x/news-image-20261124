// THE WORLD TODAY — Tuesday 24 November 2026, one-page newspaper front page.
//
// Render pipeline (all hand-written, Node stdlib only, no assets, no network):
//   1. A pixel canvas: Sheet paints a 1024x1024 RGB frame (PAPER background)
//      with fills, rules, frames, Bresenham lines and 5x7 dot-matrix type.
//   2. drawPage() lays out the front page on that canvas: dateline bar,
//      masthead, lead story with a chip illustration, six 3x2 story panels,
//      a news ticker and a sources footer.
//   3. toPNG() serializes the canvas as a minimal PNG (filter-0 rows,
//      zlib level 9, fixed CRC table) and main() writes /output/entry.png.
// Deterministic: no clock, no randomness — two runs write identical bytes.
// The canvas is fixed at 1024x1024 so the image fits the bounty frame.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1024;
const H = 1024;

// ---- 5x7 dot-matrix type: 7 rows of 5 dots per glyph ("#" = ink) ----
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
};

type RGB = [number, number, number];
const PAPER: RGB = [248, 244, 233];
const INK: RGB = [16, 16, 16];
const RED: RGB = [178, 34, 28];
const GREY: RGB = [96, 92, 84];
const FAINT: RGB = [233, 227, 211];
const NAVY: RGB = [18, 32, 58];
const GOLD: RGB = [198, 148, 44];
const GREEN: RGB = [24, 120, 60];

class Sheet {
  buf = new Uint8Array(W * H * 3);
  constructor() {
    this.paint(PAPER);
  }
  paint(c: RGB) {
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = c[0];
      this.buf[i * 3 + 1] = c[1];
      this.buf[i * 3 + 2] = c[2];
    }
  }
  dot(x: number, y: number, c: RGB) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  fill(x: number, y: number, w: number, h: number, c: RGB) {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.dot(xx, yy, c);
  }
  rule(x: number, y: number, w: number, t: number, c: RGB) {
    this.fill(x, y, w, t, c);
  }
  frame(x: number, y: number, w: number, h: number, c: RGB) {
    this.rule(x, y, w, 2, c);
    this.rule(x, y + h - 2, w, 2, c);
    this.fill(x, y, 2, h, c);
    this.fill(x + w - 2, y, 2, h, c);
  }
  // Bresenham line, for the chip traces.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.dot(x, y, c);
      this.dot(x + 1, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  glyphWidth(s: string, size: number) {
    return s.length * 6 * size - size;
  }
  drawText(s: string, x: number, y: number, size: number, c: RGB) {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = GLYPHS[ch] ?? GLYPHS["?"];
      for (let r = 0; r < 7; r++)
        for (let col = 0; col < 5; col++)
          if (g[r][col] === "1")
            this.fill(cx + col * size, y + r * size, size, size, c);
      cx += 6 * size;
    }
    return cx;
  }
  centred(s: string, y: number, size: number, c: RGB, x0 = 0, x1 = W) {
    const w = this.glyphWidth(s, size);
    this.drawText(s, x0 + Math.floor((x1 - x0 - w) / 2), y, size, c);
  }
  split(s: string, size: number, maxW: number): string[] {
    const out: string[] = [];
    let cur = "";
    for (const word of s.split(" ")) {
      const trial = cur ? cur + " " + word : word;
      if (this.glyphWidth(trial, size) <= maxW) cur = trial;
      else {
        if (cur) out.push(cur);
        cur = word;
      }
    }
    if (cur) out.push(cur);
    return out;
  }
  block(s: string, x: number, y: number, size: number, maxW: number, c: RGB, lead: number) {
    const lines = this.split(s, size, maxW);
    lines.forEach((ln, i) => this.drawText(ln, x, y + i * (7 * size + lead), size, c));
    return y + lines.length * (7 * size + lead);
  }
}

// ---- Minimal PNG writer: filter 0 rows, zlib level 9, fixed CRC table ----
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function toPNG(s: Sheet): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(s.buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Front page: Tuesday 24 November 2026 ----
const MX = 36;
const CW = W - MX * 2;

function drawChip(s: Sheet, x: number, y: number, w: number, h: number) {
  s.fill(x, y, w, h, NAVY);
  s.frame(x, y, w, h, GOLD);
  // Gold pins on all four sides.
  for (let i = 0; i < 7; i++) {
    const px = x + 24 + i * 38;
    s.fill(px, y - 8, 10, 8, GOLD);
    s.fill(px, y + h, 10, 8, GOLD);
  }
  for (let i = 0; i < 4; i++) {
    const py = y + 22 + i * 26;
    s.fill(x - 8, py, 8, 10, GOLD);
    s.fill(x + w, py, 8, 10, GOLD);
  }
  // Circuit traces from the die to the corners.
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  s.line(cx - 52, cy - 30, x + 18, y + 16, GOLD);
  s.line(cx + 52, cy - 30, x + w - 18, y + 16, GOLD);
  s.line(cx - 52, cy + 30, x + 18, y + h - 16, GOLD);
  s.line(cx + 52, cy + 30, x + w - 18, y + h - 16, GOLD);
  // Die.
  s.fill(cx - 62, cy - 40, 124, 80, INK);
  s.frame(cx - 62, cy - 40, 124, 80, GOLD);
  s.centred("NVDA", cy - 30, 4, PAPER, cx - 62, cx + 62);
  s.centred("+31%", cy + 6, 3, GREEN, cx - 62, cx + 62);
  s.centred("IN A DAY", y + h - 16, 1, GOLD, x, x + w);
}

function drawPage(): Sheet {
  const s = new Sheet();

  // Dateline bar.
  s.fill(0, 0, W, 10, INK);
  s.drawText("TUESDAY 24 NOVEMBER 2026", MX, 26, 2, INK);
  const tag = "WORLD NEWS IN ONE PAGE";
  s.drawText(tag, W - MX - s.glyphWidth(tag, 2), 26, 2, INK);
  s.rule(MX, 48, CW, 2, INK);

  // Masthead.
  s.centred("THE WORLD TODAY", 62, 8, INK);
  s.centred("EIGHT STORIES THAT DEFINED THE DAY", 140, 2, GREY);
  s.rule(MX, 168, CW, 5, RED);
  s.rule(MX, 178, CW, 2, INK);

  // ---- Lead story: Nvidia brings Huang back ----
  let y = 196;
  s.drawText("TECH  -  NVIDIA", MX, y, 2, RED);
  y += 24;
  y = s.block("HUANG RETURNS AS NVIDIA CHIEF", MX, y, 4, CW, INK, 6);
  y += 6;
  s.drawText("BOARD VOTE UNANIMOUS - 11 DAYS AFTER RESIGNATION AMID SPY SCANDAL", MX, y, 2, GREY);
  y += 26;
  s.rule(MX, y, CW, 2, INK);
  y += 12;
  const bodyTop = y;
  const bodyW = 600;
  const bodyEnd = s.block(
    "Nvidia's board unanimously reinstated Jensen Huang as chief executive on Monday, just 11 days after he resigned over revelations of extramarital affairs, one with a woman US authorities suspect of spying for China. Shares surged more than 31 percent. The US moved to blacklist Megaspeed, the Singapore chip firm at the centre of the scandal.",
    MX, bodyTop, 2, bodyW, INK, 4
  );
  const chipX = MX + bodyW + 24;
  const chipW = W - MX - chipX;
  const chipH = Math.max(bodyEnd - bodyTop, 118);
  drawChip(s, chipX, bodyTop, chipW, chipH);
  y = Math.max(bodyEnd, bodyTop + chipH) + 14;
  s.rule(MX, y, CW, 2, INK);
  y += 14;

  // ---- Six panels, 3 x 2 ----
  const gapX = 16;
  const gapY = 14;
  const pw = Math.floor((CW - gapX * 2) / 3);
  const ph = 212;
  const panels: { kick: string; head: string; body: string }[] = [
    {
      kick: "KOREA",
      head: "RUSSIAN JETS SPARK ULLEUNG ALERT",
      body: "Russian planes entered South Korea's air defence zone off Ulleung Island. Seoul scrambled jets and told residents to shelter.",
    },
    {
      kick: "LIBYA",
      head: "ZELENSKY: SEA DRONES SANK MERKURY",
      body: "Seven Ukrainian sea drones sank the corvette Merkury at Benghazi and hit the cargo ship MV Angara. A Ka-27 helicopter aboard was destroyed.",
    },
    {
      kick: "KYIV",
      head: "11 KILLED IN STRIKE ON KYIV FLATS",
      body: "A Russian strike on a five-storey block in Dymer, near Kyiv, killed 11 people. Three more died at a supermarket in Vyshneve.",
    },
    {
      kick: "GULF",
      head: "IRAN HITS GULF SITES AS US SQUEEZES",
      body: "Iran stepped up attacks on US bases and civilian sites in the Gulf and sued for $290bn as a US blockade and sanctions squeeze it.",
    },
    {
      kick: "EUROPE",
      head: "EU PROPOSES 22ND SANCTIONS PACKAGE",
      body: "The European Commission proposed a 22nd sanctions package on Russia, banning Russian teams under the Russian flag in EU events.",
    },
    {
      kick: "LAW",
      head: "STATES SUE SPACEX OVER GROK IMAGES",
      body: "Virginia and Oregon sued SpaceX over sexual imagery made by its Grok AI chatbot, in a widening legal fight over AI-generated abuse images.",
    },
  ];
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const px = MX + col * (pw + gapX);
    const py = y + row * (ph + gapY);
    s.rule(px, py, pw, 4, RED);
    s.frame(px, py, pw, ph, INK);
    let ty = py + 16;
    s.drawText(panels[i].kick, px + 12, ty, 2, RED);
    ty += 24;
    ty = s.block(panels[i].head, px + 12, ty, 2, pw - 24, INK, 3);
    ty += 6;
    s.rule(px + 12, ty, pw - 24, 2, FAINT);
    ty += 8;
    s.block(panels[i].body, px + 12, ty, 2, pw - 24, INK, 3);
  }
  y += ph * 2 + gapY + 12;

  // ---- Ticker ----
  s.rule(MX, y, CW, 4, RED);
  y += 12;
  y = s.block(
    "ALSO TODAY: MEXICO ARRESTS DRUG LORD EL CHAPO ISIDRO  -  ISRAELI STRIKES KILL 3 IN GAZA, INCLUDING UNRWA WORKER  -  O'HARE GROUND STOP AMID STAFFING SHORTAGE  -  SPAIN'S RIGHT LEADS POLLS AHEAD OF NOV 29 VOTE  -  TRUMP, XI AND PUTIN ISSUE JOINT STATEMENT AT APEC",
    MX, y, 1, CW, INK, 3
  );
  y += 4;
  s.rule(MX, y, CW, 2, INK);
  y += 10;

  // ---- Footer ----
  s.centred("SOURCES: REUTERS - AP - AFP - THE TIMES - CNN - KOREA JOONGANG DAILY", y, 1, GREY);
  y += 16;
  s.centred("THE WORLD TODAY  -  ONE PAGE, EIGHT STORIES  -  24 NOVEMBER 2026", y, 1, GREY);

  return s;
}

function main() {
  const png = toPNG(drawPage());
  // Fail fast on a corrupt render instead of writing a broken entry file:
  // a valid PNG is never empty and always starts with the 0x89 'PNG' magic.
  if (png.length === 0 || png[0] !== 0x89 || png[1] !== 0x50) {
    throw new Error("render produced an invalid PNG");
  }
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.png", png);
  console.log(`wrote /output/entry.png ${png.length} bytes`);
}

main();
