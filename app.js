/* Walking IT: the home of the -walk series. Created by Dean Baker. © 2026 Dean Baker. All rights reserved.
   The walks themselves are listed in data/walks.js. Icons and pixel sprites are shared with the walks' engine. */
(function () {
"use strict";
const WALKS = window.WALKS || [];
const ROLES = window.ROLES || [];
const THEMES = [["dark", "Simple · dark", "#0a1020"], ["light", "Simple · light", "#eef2f8"], ["pixel", "Pixel arcade", "#ff3ea5"]];
const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const store = {
  /* a saved value is only used if it's the same kind of thing as the default (number, text, list, object…),
     so an old, damaged or tampered save falls back to the default instead of breaking the page */
  get(k, d) {
    try {
      const v = localStorage.getItem(k); if (!v) return d;
      const x = JSON.parse(v), kind = y => y === null ? "null" : Array.isArray(y) ? "array" : typeof y;
      return d == null || kind(x) === kind(d) ? x : d;
    } catch (e) { return d; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const K = {theme: "walkingit:theme", role: "walkingit:role"};
const S = {theme: store.get(K.theme, "dark"), role: store.get(K.role, null), first: true};
if (!THEMES.some(t => t[0] === S.theme)) S.theme = "dark";
const isPixel = () => S.theme === "pixel";
const T = (simple, pixel) => isPixel() ? pixel : simple;

/* ============================================================
   ICONS: isometric line art (simple themes) + pixel sprites, shared with every -walk
   ============================================================ */
const P = (X, Y, Z) => [(X - Y) * 0.866, (X + Y) * 0.5 - Z];
const pts = a => a.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
function box(w, d, h, ox, oy, oz, extra) {
  ox = ox || 0; oy = oy || 0; oz = oz || 0;
  const o = (X, Y, Z) => P(X + ox, Y + oy, Z + oz);
  return `<polygon class="f-r" points="${pts([o(w, 0, 0), o(w, d, 0), o(w, d, h), o(w, 0, h)])}"/>` +
         `<polygon class="f-l" points="${pts([o(0, d, 0), o(w, d, 0), o(w, d, h), o(0, d, h)])}"/>` +
         `<polygon class="f-top" points="${pts([o(0, 0, h), o(w, 0, h), o(w, d, h), o(0, d, h)])}"/>` + (extra || "");
}
/* ---- isometric icons: shaded faces (gradients in buildStage's <defs>), hardware detail, glow ---- */
const q = (a, cls) => `<polygon class="${cls}" points="${pts(a)}"/>`;
const pathOf = quads => quads.map(a => "M" + a.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + "Z").join("");
function shadowFor(kind) {
  const r = {user: [22, 8], agent: [22, 8], caller: [22, 8], switch: [46, 15], printer: [36, 13], fw: [40, 12], laptop: [40, 13], attacker: [40, 13], router: [36, 12], vpn: [36, 12], ap: [32, 11], cloud: [44, 12], idp: [44, 12], db: [30, 11], mail: [30, 11], phone: [16, 6], usb: [16, 7]}[kind] || [30, 11];
  return `<ellipse class="cshadow" cx="0" cy="3" rx="${r[0]}" ry="${r[1]}"/>`;
}
function isoIcon(kind) {
  let s = shadowFor(kind);
  switch (kind) {
    case "server": case "web": case "dns": case "dc": case "build": {
      const h = kind === "dc" ? 72 : kind === "dns" ? 50 : 60, w = 30, d = 30, ox = -15, oy = -15;
      const o = (X, Y, Z) => P(X + ox, Y + oy, Z);
      s += box(w, d, h, ox, oy, 0);
      // drive bays on the right face, each with a status LED
      const bays = [], leds = [];
      for (let z = h - 10; z > 8; z -= 12) {
        bays.push([o(w, 4, z - 4), o(w, d - 9, z - 4), o(w, d - 9, z + 3), o(w, 4, z + 3)]);
        leds.push(o(w, d - 5, z - .5));
      }
      s += `<path class="bay" d="${pathOf(bays)}"/>`;
      leds.forEach((p, i) => s += `<circle class="led" style="animation-delay:-${(i * .37 + kind.length * .11).toFixed(2)}s" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.7"/>`);
      // vent slits on the left face
      const vents = [];
      for (let z = h - 9; z > 8; z -= 5) vents.push([o(6, d, z), o(w - 6, d, z)]);
      s += `<path class="vent" d="${vents.map(v => `M${v[0][0].toFixed(1)},${v[0][1].toFixed(1)}L${v[1][0].toFixed(1)},${v[1][1].toFixed(1)}`).join("")}"/>`;
      s += `<polyline class="rim" points="${pts([o(0, d, h), o(0, 0, h), o(w, 0, h)])}"/><polyline class="edge" points="${pts([o(0, d, h), o(w, d, h), o(w, 0, h)])}"/><line class="edge" x1="${o(w, d, h)[0].toFixed(1)}" y1="${o(w, d, h)[1].toFixed(1)}" x2="${o(w, d, 0)[0].toFixed(1)}" y2="${o(w, d, 0)[1].toFixed(1)}"/>`;
      const top = P(0, 0, h);
      if (kind === "web") s += `<g class="emb" transform="translate(${top[0]},${top[1] - 2})"><ellipse class="glyph" rx="9" ry="4.5"/><ellipse class="glyph" rx="3.5" ry="4.5"/><line class="glyph" x1="-9" y1="0" x2="9" y2="0"/></g>`;
      if (kind === "dc") s += `<path class="glyph emb crown" d="M${top[0] - 8},${top[1]} l3,-7 3,4 2,-6 2,6 3,-4 3,7z"/>`;
      if (kind === "dns") s += `<text class="emb" x="${top[0]}" y="${top[1] + 3}" text-anchor="middle" style="font:700 8px var(--mono);fill:var(--node)">DNS</text>`;
      if (kind === "build") s += `<g class="emb" transform="translate(${top[0]},${top[1]})"><circle class="glyph" r="5"/><circle class="glyph" r="1.5"/><path class="glyph" d="M0,-7v2M0,5v2M-7,0h2M5,0h2"/></g>`;
      return s;
    }
    case "db": {
      const rx = 24, ry = 12, h = 46;
      s += `<path class="cyl" d="M${-rx},${-h} L${-rx},0 A${rx},${ry} 0 0 0 ${rx},0 L${rx},${-h}"/>`;
      s += `<path class="band" d="M${-rx},${-h + 16} A${rx},${ry} 0 0 0 ${rx},${-h + 16}"/><path class="band" d="M${-rx},${-h + 31} A${rx},${ry} 0 0 0 ${rx},${-h + 31}"/>`;
      s += `<path class="cyledge" d="M${-rx},${-h} L${-rx},0 A${rx},${ry} 0 0 0 ${rx},0 L${rx},${-h}"/>`;
      s += `<ellipse class="f-top" cx="0" cy="${-h}" rx="${rx}" ry="${ry}"/><ellipse class="rimring" cx="0" cy="${-h}" rx="${rx - 5}" ry="${ry - 2.5}"/>`;
      [[-h + 23, -.2], [-h + 38, -.9]].forEach(([y, dl], i) => s += `<circle class="led" style="animation-delay:${dl}s" cx="${10 - i}" cy="${y + 9}" r="1.7"/>`);
      return s;
    }
    case "laptop": case "attacker": {
      const w = 46, d = 32, ox = -23, oy = -16;
      const o = (X, Y, Z) => P(X + ox, Y + oy, Z);
      s += box(w, d, 3, ox, oy, 0);
      // keyboard and trackpad on the base
      const keys = [];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) { const x = 4.5 + i * 4.2, y = 4 + j * 4; keys.push([o(x, y, 3), o(x + 3.2, y, 3), o(x + 3.2, y + 3, 3), o(x, y + 3, 3)]); }
      s += `<path class="keys" d="${pathOf(keys)}"/>`;
      s += q([o(17, 21.5, 3), o(29, 21.5, 3), o(29, 29, 3), o(17, 29, 3)], "pad");
      // lid with a glowing screen
      s += q([o(0, 0, 3), o(w, 0, 3), o(w, -9, 36), o(0, -9, 36)], "f-s lid");
      s += q([o(3, -.6, 7), o(w - 3, -.6, 7), o(w - 3, -8.2, 33), o(3, -8.2, 33)], "screen");
      const line = (x0, x1, z) => `M${o(x0, -.6 - (z - 7) * .29, z)[0].toFixed(1)},${o(x0, -.6 - (z - 7) * .29, z)[1].toFixed(1)}L${o(x1, -.6 - (z - 7) * .29, z)[0].toFixed(1)},${o(x1, -.6 - (z - 7) * .29, z)[1].toFixed(1)}`;
      s += `<path class="code" d="${[line(7, 30, 28), line(7, 22, 24), line(11, 36, 20), line(11, 27, 16), line(7, 18, 12)].join("")}"/>`;
      s += q([o(3, -.6, 7), o(14, -.6, 7), o(30, -8.2, 33), o(19, -8.2, 33)], "sheen");
      s += `<polyline class="rim" points="${pts([o(0, -9, 36), o(w, -9, 36)])}"/>`;
      if (kind === "attacker") { const t = o(w / 2, -9, 36); s += `<g class="warn"><path class="glyph" d="M${t[0] - 7},${t[1] - 6} l7,-12 7,12z"/><line class="glyph" x1="${t[0]}" y1="${t[1] - 14}" x2="${t[0]}" y2="${t[1] - 10}"/><circle class="wdot" cx="${t[0]}" cy="${t[1] - 8}" r=".9"/></g>`; }
      return s;
    }
    case "phone": {
      const ox = -8, oy = -3;
      const o = (X, Y, Z) => P(X + ox, Y + oy, Z);
      s += box(16, 6, 34, ox, oy, 0);
      s += q([o(2, 6, 5), o(14, 6, 5), o(14, 6, 30), o(2, 6, 30)], "screen");
      s += q([o(2, 6, 5), o(6, 6, 5), o(12, 6, 30), o(8, 6, 30)], "sheen");
      const c = o(8, 6, 2.6); s += `<circle class="led" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="1.1"/>`;
      return s;
    }
    case "router": case "vpn": {
      const w = 46, d = 30, ox = -23, oy = -15;
      const o = (X, Y, Z) => P(X + ox, Y + oy, Z);
      s += box(w, d, 12, ox, oy, 0);
      const a1 = [P(8 + ox, 4 + oy, 12), P(8 + ox, 4 + oy, 34)], a2 = [P(38 + ox, 4 + oy, 12), P(38 + ox, 4 + oy, 30)];
      s += `<path class="ant" d="M${a1[0][0]},${a1[0][1]}L${a1[1][0]},${a1[1][1]}M${a2[0][0]},${a2[0][1]}L${a2[1][0]},${a2[1][1]}"/>`;
      s += `<circle class="tip" cx="${a1[1][0].toFixed(1)}" cy="${a1[1][1].toFixed(1)}" r="1.8"/><circle class="tip" cx="${a2[1][0].toFixed(1)}" cy="${a2[1][1].toFixed(1)}" r="1.8"/>`;
      // port strip on the front-left face
      s += q([o(5, d, 3), o(w - 5, d, 3), o(w - 5, d, 9), o(5, d, 9)], "bay");
      for (let i = 0; i < 5; i++) { const p = o(9 + i * 7, d, 6); s += `<circle class="led" style="animation-delay:-${(i * .29).toFixed(2)}s" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.6"/>`; }
      s += `<polyline class="rim" points="${pts([o(0, d, 12), o(0, 0, 12), o(w, 0, 12)])}"/>`;
      if (kind === "vpn") { const t = P(0, 0, 14); s += `<g class="emb" transform="translate(${t[0]},${t[1] - 12})"><rect class="f-s" x="-6" y="-2" width="12" height="9" rx="1.5"/><path class="glyph" d="M-3.5,-2 v-3 a3.5,3.5 0 0 1 7,0 v3"/><circle class="wdot" cx="0" cy="2.4" r="1.3"/></g>`; }
      return s;
    }
    case "ap": {
      s += box(40, 26, 10, -20, -13, 0);
      const t = P(0, 0, 12);
      s += `<g class="emb waves" transform="translate(${t[0]},${t[1] - 8})"><path class="glyph w3" d="M-14,-8 a20,20 0 0 1 28,0"/><path class="glyph w2" d="M-8,-2 a11,11 0 0 1 16,0"/><circle class="tip" cx="0" cy="4" r="2.4"/></g>`;
      const p = P(-20 + 20, -13 + 26, 5); s += `<circle class="led" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.6"/>`;
      return s;
    }
    case "usb": {
      s += box(16, 30, 8, -8, -12, 0) + `<g class="metal">${box(10, 9, 5, -5, -21, 1.5)}</g>`;
      const p = P(0, 16, 4); s += `<circle class="led" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.4"/>`;
      return s;
    }
    case "switch": {
      const w = 66, d = 26, ox = -33, oy = -13;
      const o = (X, Y, Z) => P(X + ox, Y + oy, Z);
      s += box(w, d, 9, ox, oy, 0);
      const ports = [];
      for (let i = 0; i < 8; i++) { const x = 5 + i * 7.5; ports.push([o(x, d, 2), o(x + 5, d, 2), o(x + 5, d, 6.5), o(x, d, 6.5)]); }
      s += `<path class="bay" d="${pathOf(ports)}"/>`;
      for (let i = 0; i < 8; i++) { const p = o(7.5 + i * 7.5, d, 7.6); s += `<circle class="led sm" style="animation-delay:-${(i * .21).toFixed(2)}s" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1"/>`; }
      s += `<polyline class="rim" points="${pts([o(0, d, 9), o(0, 0, 9), o(w, 0, 9)])}"/>`;
      return s;
    }
    case "printer": {
      const w = 44, d = 32, ox = -22, oy = -16;
      const o = (X, Y, Z) => P(X + ox, Y + oy, Z);
      s += box(w, d, 22, ox, oy, 0);
      // paper feeding out of the top, output slot and status LED on the front
      s += q([o(9, 5, 22), o(w - 9, 5, 22), o(w - 9, 5, 36), o(9, 5, 36)], "paper");
      s += `<path class="code" d="M${o(13, 5, 32)[0].toFixed(1)},${o(13, 5, 32)[1].toFixed(1)}L${o(29, 5, 32)[0].toFixed(1)},${o(29, 5, 32)[1].toFixed(1)}M${o(13, 5, 28.5)[0].toFixed(1)},${o(13, 5, 28.5)[1].toFixed(1)}L${o(24, 5, 28.5)[0].toFixed(1)},${o(24, 5, 28.5)[1].toFixed(1)}"/>`;
      s += q([o(8, d, 7), o(w - 8, d, 7), o(w - 8, d, 13), o(8, d, 13)], "bay");
      s += `<polyline class="rim" points="${pts([o(0, d, 22), o(0, 0, 22), o(w, 0, 22)])}"/>`;
      const l = o(w - 5, d, 18); s += `<circle class="led" cx="${l[0].toFixed(1)}" cy="${l[1].toFixed(1)}" r="1.6"/>`;
      return s;
    }
    case "fw": {
      const w = 52, d = 18, h = 36, ox = -26, oy = -9;
      const o = (X, Y, Z) => P(X + ox, Y + oy, Z);
      s += box(w, d, h, ox, oy, 0);
      // brick courses on the front face
      let mortar = "";
      for (let z = 9; z < h; z += 9) mortar += `M${o(0, d, z)[0].toFixed(1)},${o(0, d, z)[1].toFixed(1)}L${o(w, d, z)[0].toFixed(1)},${o(w, d, z)[1].toFixed(1)}`;
      for (let r = 0; r < 4; r++) { const zb = r * 9; for (let x = r % 2 ? 7 : 13; x < w; x += 13) mortar += `M${o(x, d, zb)[0].toFixed(1)},${o(x, d, zb)[1].toFixed(1)}L${o(x, d, zb + 9)[0].toFixed(1)},${o(x, d, zb + 9)[1].toFixed(1)}`; }
      s += `<path class="mortar" d="${mortar}"/>`;
      s += `<polyline class="rim" points="${pts([o(0, d, h), o(0, 0, h), o(w, 0, h)])}"/>`;
      const t = P(0, 0, h); s += `<g class="emb" transform="translate(${t[0]},${t[1] - 1})"><path class="glyph flame" d="M0,-8 c4,4 5,7 2,10 c1,-3 -2,-4 -2,-6 c-2,3 -5,4 -3,7 c-4,-3 -2,-8 3,-11z"/></g>`;
      return s;
    }
    case "user": case "agent": case "caller": {
      // a person: shaded shoulders and head, with a lanyard (user), a headset (agent) or a warning sign (caller)
      s += `<path class="f-l body" d="M-17,0 L-17,-20 Q-17,-33 0,-34 Q17,-33 17,-20 L17,0 Z"/>`;
      s += `<path class="f-r body" d="M0,-34 Q17,-33 17,-20 L17,0 L0,0 Z"/>`;
      s += `<path class="rim" d="M-14,-24 Q-12,-31 -2,-32.5"/>`;
      s += `<ellipse class="f-top head" cx="0" cy="-46" rx="10" ry="10.5"/><path class="cloudhl" d="M-7,-51 a8,8 0 0 1 7,-4.5"/>`;
      if (kind === "user") s += `<path class="glyph" d="M-6,-33 L0,-21 L6,-33"/><rect class="tag" x="-3.5" y="-21" width="7" height="9" rx="1.5"/>`;
      if (kind === "agent") s += `<path class="glyph" d="M-11.5,-47 a11.5,12 0 0 1 23,0"/><rect class="hsp" x="-14.5" y="-51" width="5" height="10" rx="2"/><rect class="hsp" x="9.5" y="-51" width="5" height="10" rx="2"/><path class="glyph" d="M12,-41 q0,8 -9,8.5"/><circle class="tip" cx="-2" cy="-32.5" r="1.8"/>`;
      if (kind === "caller") s += `<rect class="hsp" x="8" y="-54" width="6" height="13" rx="2"/><g class="warn"><path class="glyph" d="M-7,-62 l7,-12 7,12z"/><line class="glyph" x1="0" y1="-70" x2="0" y2="-66"/><circle class="wdot" cx="0" cy="-64" r=".9"/></g>`;
      return `<g transform="scale(1.2)">${s}</g>`;
    }
    case "mail": {
      const w = 36, d = 28, ox = -18, oy = -14;
      const o = (X, Y, Z) => P(X + ox, Y + oy, Z);
      s += box(w, d, 40, ox, oy, 0);
      s += q([o(5, d, 10), o(w - 5, d, 10), o(w - 5, d, 30), o(5, d, 30)], "screen");
      s += `<polyline class="glyph" points="${pts([o(5, d, 30), o(w / 2, d, 20), o(w - 5, d, 30)])}"/>`;
      s += `<polyline class="rim" points="${pts([o(0, d, 40), o(0, 0, 40), o(w, 0, 40)])}"/>`;
      const p = o(w - 4, d, 35); s += `<circle class="led" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="1.6"/>`;
      return s;
    }
    case "cloud": case "idp": {
      const d = "M-38,-6 a14,14 0 0 1 4,-27 a19,19 0 0 1 34,-10 a16,16 0 0 1 30,8 a13,13 0 0 1 8,29 z";
      s += `<path class="cloudback" transform="translate(4,5)" d="${d}"/><path class="cloud" d="${d}"/><path class="cloudhl" d="M-31,-22 a19,19 0 0 1 31,-17"/>`;
      if (kind === "idp") s += `<g class="emb" transform="translate(-2,-22)"><circle class="glyph" cx="-7" cy="0" r="5"/><path class="glyph" d="M-2,0 h14 m-4,0 v4 m-4,-4 v3"/></g>`;
      else s += `<g class="emb" transform="translate(0,-21)"><circle class="glyph" r="9"/><ellipse class="glyph" rx="3.6" ry="9"/><line class="glyph" x1="-9" y1="0" x2="9" y2="0"/></g>`;
      return s;
    }
  }
  return s + box(30, 30, 30, -15, -15, 0);
}
/* Shared <defs> for the shaded icons: one gradient set per colour family (b = normal, r = hostile/compromised) */
function stageDefs() {
  const fam = (k, c) => `
    <linearGradient id="g-top-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${c};stop-opacity:.62"/><stop offset="1" style="stop-color:${c};stop-opacity:.34"/></linearGradient>
    <linearGradient id="g-l-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${c};stop-opacity:.4"/><stop offset="1" style="stop-color:${c};stop-opacity:.12"/></linearGradient>
    <linearGradient id="g-r-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${c};stop-opacity:.24"/><stop offset="1" style="stop-color:${c};stop-opacity:.05"/></linearGradient>
    <linearGradient id="g-scr-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${c};stop-opacity:.85"/><stop offset="1" style="stop-color:${c};stop-opacity:.35"/></linearGradient>
    <linearGradient id="g-cyl-${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${c};stop-opacity:.16"/><stop offset=".38" style="stop-color:${c};stop-opacity:.46"/><stop offset=".62" style="stop-color:${c};stop-opacity:.3"/><stop offset="1" style="stop-color:${c};stop-opacity:.08"/></linearGradient>
    <linearGradient id="g-cloud-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${c};stop-opacity:.6"/><stop offset="1" style="stop-color:${c};stop-opacity:.18"/></linearGradient>
    <radialGradient id="g-halo-${k}"><stop offset="0" style="stop-color:${c};stop-opacity:.5"/><stop offset=".55" style="stop-color:${c};stop-opacity:.16"/><stop offset="1" style="stop-color:${c};stop-opacity:0"/></radialGradient>`;
  return `<defs>${fam("b", "var(--node)")}${fam("r", "var(--red)")}
    <linearGradient id="g-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dffc4"/><stop offset="1" stop-color="#16a86b"/></linearGradient>
    <linearGradient id="g-lost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8c9a"/><stop offset="1" stop-color="#d9324a"/></linearGradient>
    <linearGradient id="g-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="g-shadow"><stop offset="0" style="stop-color:var(--shadowC)" stop-opacity=".55"/><stop offset=".6" style="stop-color:var(--shadowC)" stop-opacity=".18"/><stop offset="1" style="stop-color:var(--shadowC)" stop-opacity="0"/></radialGradient>
    ${[["bad", "var(--red)"], ["normal", "var(--node)"], ["data", "var(--amber)"], ["fix", "var(--green)"]].map(([k, c]) => `<radialGradient id="g-pkt-${k}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".22" style="stop-color:${c}" stop-opacity=".85"/><stop offset=".5" style="stop-color:${c}" stop-opacity=".28"/><stop offset="1" style="stop-color:${c}" stop-opacity="0"/></radialGradient>`).join("")}
  </defs>`;
}
/* ---- pixel sprites (16×16, original art). Palette keys below; 'g' cells blink like LEDs. ---- */
const SPR = {
  laptop: ["................", "..kkkkkkkkkkkk..", "..kCCCCCCCCCCk..", "..kCbbbbbbbbCk..", "..kCbcccbbbbCk..", "..kCbbbbbbbbCk..", "..kCbccccbbbCk..", "..kCbbbbbbbbCk..", "..kCbccbbbbbCk..", "..kCCCCCCCCCCk..", "..kkkkkkkkkkkk..", ".kccccccccccccck", "kcwcwcwcwcwcwcck", "kcccccccccccccck", ".kkkkkkkkkkkkkk.", "................"],
  server: ["....kkkkkkkk....", "....kCCCCCCk....", "....kbbbbbbk....", "....kbgbbbck....", "....kCCCCCCk....", "....kbbbbbbk....", "....kbgbbbck....", "....kCCCCCCk....", "....kbbbbbbk....", "....kbgbbbck....", "....kCCCCCCk....", "....kbbbbbbk....", "....kbgbbbck....", "....kCCCCCCk....", "....kkkkkkkk....", "................"],
  db: ["................", "....kkkkkkkk....", "..kkCCCCCCCCkk..", "..kCCCCCCCCCCk..", "..kkCCCCCCCCkk..", "..kckkkkkkkkck..", "..kcccccccccck..", "..kcbbbgbbbbck..", "..kkcccccccckk..", "..kckkkkkkkkck..", "..kcccccccccck..", "..kcbbbgbbbbck..", "..kkcccccccckk..", "....kkkkkkkk....", "................", "................"],
  router: ["................", "..k.........k...", "..k.........k...", "..k.........k...", "..k.........k...", ".kkkkkkkkkkkkkk.", ".kCCCCCCCCCCCCk.", ".kcbbbbbbbbbbck.", ".kcgbgbgbbbbbck.", ".kcbbbbbbbbbbck.", ".kcccccccccccck.", ".kkkkkkkkkkkkkk.", "..kk.......kk...", "................", "................", "................"],
  ap: ["................", "...gggggggggg...", "..g..........g..", "....gggggggg....", "...g........g...", ".....gggggg.....", "................", ".......kk.......", ".......kk.......", ".kkkkkkkkkkkkkk.", ".kCCCCCCCCCCCCk.", ".kcbbbbbbbbbbck.", ".kcgbgbgbbbbbck.", ".kkkkkkkkkkkkkk.", "..kk........kk..", "................"],
  switch: ["................", "................", "................", "................", "kkkkkkkkkkkkkkkk", "kCCCCCCCCCCCCCCk", "kcbbbbbbbbbbbbck", "kcwbwbwbwbwbwbck", "kcgbgbgbgbgbgbck", "kcbbbbbbbbbbbbck", "kcccccccccccccck", "kkkkkkkkkkkkkkkk", "................", "................", "................", "................"],
  phone: ["................", ".....kkkkkk.....", "....kCCCCCCk....", "....kCbbbbCk....", "....kCbccbCk....", "....kCbbbbCk....", "....kCbcbbCk....", "....kCbbbbCk....", "....kCbccbCk....", "....kCbbbbCk....", "....kCCCCCCk....", "....kCCwwCCk....", "....kCCCCCCk....", ".....kkkkkk.....", "................", "................"],
  usb: ["................", "................", "......kkkk......", "......kwwk......", "......kwwk......", ".....kkkkkk.....", ".....kCCCCk.....", ".....kcccck.....", ".....kcbbck.....", ".....kcgbck.....", ".....kcbbck.....", ".....kcccck.....", ".....kcccck.....", ".....kkkkkk.....", "................", "................"],
  cloud: ["................", "................", "......kkkk......", ".....kCCCCk.....", "..kkkCCCCCCkk...", ".kCCCCCCCCCCCk..", "kCCCCCCCCCCCCCk.", "kCccccccccccCCCk", "kcccccccccccccck", ".kkkkkkkkkkkkkk.", "................", "................", "................", "................", "................", "................"],
  idp: ["................", "................", "......kkkk......", ".....kCCCCk.....", "..kkkCCCCCCkk...", ".kCCCCCCCCCCCk..", "kCCCCyyyCCCCCCk.", "kCcccyccycccCCCk", "kccccyyyyyycccck", ".kkkkkkkkkkkkkk.", "................", "................", "................", "................", "................", "................"],
  printer: ["................", "....kkkkkkkk....", "....kwwwwwwk....", "....kwccccwk....", "..kkkwwwwwwkkk..", ".kCCCCCCCCCCCCk.", ".kCCCCCCCCCCgCk.", ".kcccccccccccck.", ".kcbbbbbbbbbbck.", ".kckkkkkkkkkkck.", ".kcckwwwwwwkcck.", ".kkkkwccccwkkkk.", "....kwwwwwwk....", "....kkkkkkkk....", "................", "................"],
  fw: ["................", "................", "kkkkkkkkkkkkkkkk", "koooooookooooooo", "kkkkkkkkkkkkkkkk", "koookoooooookooo", "kkkkkkkkkkkkkkkk", "koooooookooooooo", "kkkkkkkkkkkkkkkk", "koookoooooookooo", "kkkkkkkkkkkkkkkk", "koooooookooooooo", "kkkkkkkkkkkkkkkk", "......kgk.......", "................", "................"],
  user: ["................", "......kkkk......", ".....kCCCCk.....", "....kCCCCCCk....", "....kCkCCkCk....", "....kCCCCCCk....", ".....kCCCCk.....", "......kkkk......", "....kkkkkkkk....", "...kcccwwccck...", "..kccccwwcccck..", "..kccccyycccck..", "..kccccyycccck..", "..kcccccccccck..", "..kkkkkkkkkkkk..", "................"],
  agent: ["................", ".....yyyyyy.....", "....ykCCCCky....", "...ykCCCCCCky...", "...ykCkCCkCky...", "....kCCCCCCky...", ".....kCCCCk.y...", "......kkkkyy....", "....kkkkkkkk....", "...kcccccccck...", "..kcccccccccck..", "..kcccccccccck..", "..kcccccccccck..", "..kcccccccccck..", "..kkkkkkkkkkkk..", "................"],
  mail: ["................", "................", "................", "kkkkkkkkkkkkkkkk", "kCkCCCCCCCCCCkCk", "kCCkCCCCCCCCkCCk", "kCCCkCCCCCCkCCCk", "kCCCCkCCCCkCCCCk", "kCCCCCkCCkCCCCCk", "kCCCCCCkkCCCCCCk", "kCCCCCCCCCCCCCCk", "kcccccccccccccck", "kkkkkkkkkkkkkkkk", "................", "................", "................"],
  /* the attacker: an original glitch-bug with bright legs, in four moods */
  bugA: ["................", "...C........C...", "....C......C....", ".....kkkkkk.....", "....krrrrrrk....", "...krwkrrwkrk...", "...krrrrrrrrk...", "CC.kkrrrrrrkk.CC", "..CkrrbrrbrrkC..", "...krrrrrrrrk...", "CC.krrbrrbrrk.CC", "..CkrrrrrrrrkC..", "....krrrrrrk....", "...C.kkkkkk.C...", "..C..........C..", "................"],
  bugB: ["................", "...C........C...", "....C......C....", ".....kkkkkk.....", "....krrrrrrk....", "...krwkrrwkrk...", "...krrrrrrrrk...", "..CkkrrrrrrkkC..", "CC.krrbrrbrrk.CC", "...krrrrrrrrk...", "..CkrrbrrbrrkC..", "CC.krrrrrrrrk.CC", "....krrrrrrk....", "....CkkkkkkC....", "...C........C...", "................"],
  bugHappy: ["................", "..C..........C..", "...C........C...", ".....kkkkkk.....", "....krrrrrrk....", "...krkkrrkkrk...", "...krkwwwwkrk...", "CC.kkrkkkkrkk.CC", "..CkrrbrrbrrkC..", "...krrrrrrrrk...", "CC.krrbrrbrrk.CC", "..CkrrrrrrrrkC..", "....krrrrrrk....", "...C.kkkkkk.C...", "..C..........C..", "................"],
  bugDizzy: ["................", "................", "...CC......CC...", ".....kkkkkk.....", "....krrrrrrk....", "...kryrrrryrk...", "...krrrkkrrrk...", "...kkrrrrrrkk...", "...krrbrrbrrk...", "...krrrrrrrrk...", "...krrbrrbrrk...", "...krrrrrrrrk...", "....krrrrrrk....", ".....kkkkkk.....", "....C......C....", "................"]
};
const PXPAL = {
  normal: {k: "#0b0620", c: "#29e7ff", C: "#b8fbff", b: "#163a5c", w: "#ffffff", g: "#7dff3a", y: "#ffe14a", m: "#ff3ea5", r: "#ff3b4e", o: "#ff9a2e"},
  hostile: {k: "#0b0620", c: "#ff3b4e", C: "#ffc2c8", b: "#5c1622", w: "#ffffff", g: "#ffe14a", y: "#ffe14a", m: "#ff3ea5", r: "#ff3b4e", o: "#ff9a2e"}
};
const ACCENT = {web: "y", dns: "m", dc: "o", build: "o", vpn: "y"};
const SPRMAP = {user: "user", agent: "agent", caller: "user", server: "server", web: "server", dns: "server", dc: "server", build: "server", db: "db", laptop: "laptop", phone: "phone", router: "router", vpn: "router", ap: "ap", usb: "usb", switch: "switch", mail: "mail", cloud: "cloud", idp: "idp", printer: "printer", fw: "fw"};
function sprite(grid, pal) {
  const px = 4, ox = -32, oy = -60, byCol = {}, leds = [];
  grid.forEach((row, y) => { for (let x = 0; x < 16; x++) { const ch = row[x]; if (ch === "." || !pal[ch]) continue; const d = `M${ox + x * px},${oy + y * px}h${px}v${px}h-${px}z`; if (ch === "g") leds.push(d); else (byCol[pal[ch]] = byCol[pal[ch]] || []).push(d); } });
  return Object.entries(byCol).map(([c, ds]) => `<path d="${ds.join("")}" fill="${c}"/>`).join("") +
    (leds.length ? `<path class="led" d="${leds.join("")}" fill="${pal.g}" style="animation-delay:-${(Math.random() * 1.4).toFixed(2)}s"/>` : "");
}
function pixelIcon(kind, hostile) {
  if (kind === "attacker") {
    const pal = PXPAL.hostile;
    return `<g class="px bug"><g class="fr fa">${sprite(SPR.bugA, pal)}</g><g class="fr fb">${sprite(SPR.bugB, pal)}</g><g class="fr fh">${sprite(SPR.bugHappy, pal)}</g><g class="fr fd">${sprite(SPR.bugDizzy, pal)}</g>` +
      `<g transform="translate(0,-68)"><g class="stars"><rect x="14" y="-2" width="4" height="4"/><rect x="-18" y="-2" width="4" height="4"/><rect x="-2" y="-9" width="4" height="4"/></g></g></g>`;
  }
  const grid = SPR[SPRMAP[kind] || "server"];
  const mk = h => { const pal = Object.assign({}, PXPAL[h ? "hostile" : "normal"]); if (ACCENT[kind]) pal.g = pal[ACCENT[kind]]; return sprite(grid, pal); };
  return hostile ? `<g class="px">${mk(true)}</g>` : `<g class="px"><g class="pxn">${mk(false)}</g><g class="pxh">${mk(true)}</g></g>`;
}
/* Highest point of each icon above the node's base, so badges and callouts sit just above it */
const ISO_TOP = {user: -70, agent: -71, caller: -91, server: -75, web: -75, dns: -65, dc: -87, build: -75, db: -58, laptop: -60, attacker: -67, phone: -40, router: -47, vpn: -47, ap: -34, usb: -20, switch: -32, mail: -56, cloud: -52, idp: -52, printer: -48, fw: -53};
function iconTop(n) {
  if (!isPixel()) return ISO_TOP[n.kind] || -60;
  const grid = n.kind === "attacker" ? SPR.bugA : SPR[SPRMAP[n.kind] || "server"];
  const row = grid.findIndex(r => /[^.]/.test(r));
  return -60 + Math.max(0, row) * 4;
}
function icon(n) {
  const hostile = n.kind === "attacker" || n.kind === "caller" || n.hostile;
  return isPixel() ? pixelIcon(n.kind, hostile) : isoIcon(n.kind);
}

/* ============================================================
   SOUND (pixel theme, opt-in)
   ============================================================ */


/* ============================================================
   RENDER
   ============================================================ */
function walkIcon(w) {
  const hostile = w.icon === "attacker" || w.icon === "caller";
  const cls = "node" + (hostile ? " hostile" : "") + (w.icon === "attacker" ? " atk" : "");
  return `<svg class="w-ico" viewBox="-58 -98 116 108" aria-hidden="true" focusable="false"><g class="${cls}"><g class="ico">${icon({kind: w.icon})}</g></g></svg>`;
}
function renderHero() {
  $("#kick").textContent = T("Real IT problems, one step at a time", "SELECT YOUR GAME");
  $("#h1").innerHTML = T("Real <i>IT</i>. The way it actually happens.", "REAL <i>IT</i>. ONE LEVEL AT A TIME.");
  $("#lede").innerHTML = T(
    `${WALKS.length === 4 ? "Four" : WALKS.length} free, interactive walks for IT new starters. Pick an area, press play and watch a real problem unfold step by step, with the <b>logs, tickets and admin screens you'd really see</b>. Plain English first, technical detail one click away.`,
    `${WALKS.length} FREE GAMES FOR IT NEW STARTERS. PICK ONE, PRESS START AND WATCH A REAL PROBLEM PLAY OUT, WITH THE <b>LOGS, TICKETS AND SCREENS</b> YOU'D REALLY SEE.`);
  $("#pickH").textContent = T("Where do you sit?", "CHOOSE YOUR PLAYER");
  $("#chips").innerHTML = ROLES.map(r => `<button class="chip" data-role="${r.id}" aria-pressed="${S.role === r.id}">${esc(T(r.label, r.px))}</button>`).join("");
  renderTip();
  $("#walksH").textContent = T("The walks", "SELECT GAME");
  $("#walksSub").textContent = T("Suggested order: start at the top", "LEVEL 1 TO " + WALKS.length);
  $("#howH").textContent = T("How every walk works", "HOW TO PLAY");
  const how = [
    ["var(--cyan)", T("1 · Pick a scenario", "1 · PICK A STAGE"), T("A ticket, a fault or an attack, each one based on a real-world problem.", "A TICKET, A FAULT OR AN ATTACK.")],
    ["var(--amber)", T("2 · Watch it play", "2 · PRESS START"), T("Step by step, with the evidence a professional would actually see.", "WATCH IT PLAY OUT, CLUE BY CLUE.")],
    ["var(--green)", T("3 · Switch on the fix", "3 · USE A POWER-UP"), T("Replay with a fix or defence on and see exactly what changes.", "REPLAY WITH A FIX AND SEE WHAT CHANGES.")]
  ];
  $("#how").innerHTML = how.map(([c, h, p]) => `<div style="--c:${c}"><b>${esc(h)}</b><p>${esc(p)}</p></div>`).join("");
  $("#who").innerHTML = `<b>${T("Built for", "PLAYERS")}</b>${esc(T("IT new starters · apprentices · career changers · service desk staff moving up", "NEW STARTERS · APPRENTICES · CAREER CHANGERS · HELP DESK HEROES"))}`;
  $("#aboutLbl").textContent = T("About", "INFO");
  $("#themeLbl").textContent = T("Theme", "THEME");
}
/* Hump Day Hack: this week's case, from shared/hdh-schedule.js (titles only, never answers).
   Hump Day Hack itself lives on its own site: https://deanobaker3-alt.github.io/hump-day-hack/ */
function renderHdh() {
  const box = $("#hdh"), SCH = window.HDH_SCHEDULE, TM = window.HDH_TIME;
  if (!box || !SCH || !TM) { if (box) box.hidden = true; return; }
  const now = Date.now(), max = SCH.cases.length, cur = Math.min(TM.current(now), max);
  const live = cur && !TM.isOut(cur + 1, now) ? cur : 0;
  const area = n => (SCH.areas[SCH.cases[n - 1].area] || {}).name || "";
  let rec = null; try { rec = (JSON.parse(localStorage.getItem("hdh:v1") || "null") || {cases: {}}).cases || {}; } catch (e) { rec = {}; }
  const wm = `<div class="wm">HUMP DAY <i>HACK</i></div>`;
  let n, h, p, cta, href = "https://deanobaker3-alt.github.io/hump-day-hack/";
  if (!cur) {
    n = 1; h = T("A new IT case to crack, every Wednesday", "NEW CASE EVERY WEDNESDAY");
    p = `${T("Case #1 drops", "CASE #1 DROPS")} <b>${esc(TM.niceRelease(1))}</b>. ${T("Read the ticket, open the evidence, find the cause, pick the fix.", "")}`;
    cta = T("How it works", "INFO");
  } else if (live) {
    n = live; const r = rec[live] || {};
    const you = r.at ? (r.won ? `<span class="won">${T("You cracked it", "CRACKED!")}</span>` : `<span class="lost">${T("Gone cold this week", "GAME OVER")}</span>`) : T("Not played yet", "NEW CASE");
    h = `#${live} · ${esc(SCH.cases[live - 1].title)}`;
    p = `<span class="live">${T("Live now", "LIVE")}</span> · ${esc(area(live))} · ${you}`;
    cta = r.at ? T("See your result", "RESULT") : T("Crack this week's case", "PLAY");
  } else {
    n = max; h = T("Season 1 is a wrap", "SEASON 1 CLEAR!");
    p = T(`All ${max} cases are in the archive, each with a full walkthrough.`, `ALL ${max} CASES IN THE ARCHIVE.`);
    cta = T("Open the archive", "ARCHIVE"); href = "https://deanobaker3-alt.github.io/hump-day-hack/#archive";
  }
  box.hidden = false;
  box.innerHTML = `<div class="cal" aria-hidden="true">${T("Case", "CASE")}<b>${n}</b></div>
    <div class="t">${wm}<h2 id="hdhH">${h}</h2><p>${p}</p></div>
    <a class="btn pri" href="${href}">${cta} <span class="arr" aria-hidden="true">›</span></a>`;
}
function renderTip() {
  const r = ROLES.find(x => x.id === S.role);
  $("#tip").innerHTML = r ? esc(r.tip).replace(/(Ticketwalk|Cloudwalk|Packetwalk|Breachwalk)/g, "<b>$1</b>")
    : esc(T("Pick one and we'll point you at the right walk. Not sure? Start with Ticketwalk.", "PICK A PLAYER TO SEE WHERE TO START."));
}
function renderWalks() {
  $("#walks").innerHTML = WALKS.map((w, i) => {
    const n = String(i + 1).padStart(2, "0");
    const full = w.name.charAt(0) + w.name.slice(1).toLowerCase() + "walk";
    const tiles = w.stages.map((s, j) => `<span class="tile" style="--t:${j}" title="${j + 1}. ${esc(s)}" data-stage="${j}">${j + 1}</span>`).join("");
    return `<article class="walk" data-id="${w.id}" style="--i:${i}" aria-labelledby="wn-${w.id}">
      <div class="w-top"><span class="w-n">${T(n, "LV " + n)}</span><span>${esc(T(w.area, w.area.toUpperCase()))}</span><span class="sp"></span>${w.start ? `<span class="badge">${T("Start here", "START")}</span>` : ""}</div>
      <div class="w-body">${walkIcon(w)}<div><h3 class="w-name" id="wn-${w.id}">${esc(w.name)}<i>WALK</i></h3><p class="w-tag">${esc(w.tagline)}</p></div></div>
      <p class="w-what">${esc(w.what)}</p>
      <div class="w-chain"><div class="w-cl"><span>${esc(w.chainName)}</span><b class="w-st" data-def="${esc(w.stages[0] + " → " + w.stages[w.stages.length - 1])}">${esc(w.stages[0] + " → " + w.stages[w.stages.length - 1])}</b></div><div class="tiles" aria-label="${esc(w.chainName)}: ${esc(w.stages.join(", "))}">${tiles}</div></div>
      <div class="w-tags">${w.topics.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <div class="w-foot"><span class="w-count">${esc(w.count)}</span><span class="sp" style="flex:1"></span><a class="btn pri" href="${esc(w.url)}" data-walk="${w.id}" >${T("Open " + full, "PLAY<span class=\"sr\"> " + full + "</span>")} <span class="arr" aria-hidden="true">›</span></a></div>
    </article>`;
  }).join("");
  if (!S.first) document.querySelectorAll(".walk").forEach(c => c.style.animation = "none");
  S.first = false;
  markPick();
}
function markPick() {
  const picked = WALKS.filter(w => S.role && w.roles.includes(S.role)).map(w => w.id);
  document.querySelectorAll(".walk").forEach(c => {
    c.classList.toggle("pick", picked.includes(c.dataset.id));
    c.classList.toggle("mute", picked.length > 0 && !picked.includes(c.dataset.id));
  });
}
function renderTheme() {
  document.body.setAttribute("data-theme", S.theme);
  document.querySelector('meta[name="theme-color"]').setAttribute("content", S.theme === "light" ? "#eef2f8" : S.theme === "pixel" ? "#0d0620" : "#0a1020");
  $("#defs").innerHTML = stageDefs();
  renderHero(); renderHdh(); renderWalks();
}
function render() { renderTheme(); }

/* ============================================================
   CONTROLS: role picker, theme menu, about, shortcuts
   ============================================================ */
function toast(msg) { const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = msg; $("#toasts").appendChild(d); setTimeout(() => d.remove(), 2700); }
function setRole(id) {
  S.role = S.role === id ? null : id; store.set(K.role, S.role);
  document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.role === S.role)));
  renderTip(); markPick();
  if (S.role && window.innerWidth <= 860) { const c = document.querySelector(".walk.pick"); if (c) c.scrollIntoView({behavior: RM ? "auto" : "smooth", block: "center"}); }
}
function closeMenus() { if ($("#themeMenu").innerHTML) { $("#themeMenu").innerHTML = ""; $("#themeBtn").setAttribute("aria-expanded", "false"); } }
function themeMenu() {
  if ($("#themeMenu").innerHTML) return closeMenus();
  $("#themeMenu").innerHTML = `<div class="menu" role="menu">${THEMES.map(([k, l, c]) => `<button role="menuitemradio" aria-checked="${S.theme === k}" data-theme-set="${k}"><span class="sw" style="background:${c}"></span>${l}${S.theme === k ? " ✓" : ""}</button>`).join("")}</div>`;
  $("#themeBtn").setAttribute("aria-expanded", "true");
  const on = $('#themeMenu [aria-checked="true"]'); if (on) on.focus();
}
function setTheme(k) {
  S.theme = k; store.set(K.theme, k); closeMenus(); render();
  if (k === "pixel") toast("INSERT COIN · PIXEL MODE");
  $("#themeBtn").focus();
}
function openAbout() {
  const list = WALKS.map(w => `<li><b>${esc(w.name.charAt(0) + w.name.slice(1).toLowerCase())}walk</b>: ${esc(w.tagline)} <span class="small">(${esc(w.count)})</span></li>`).join("");
  $("#modal").innerHTML = `<div class="scrim" data-act="close"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="abT"><div class="mh"><span id="abT">${T("About", "INFO")}</span><button class="iconbtn" data-act="close" aria-label="Close">✕</button></div>
    <div class="about"><div class="ab-brand">WALKING <i>IT</i></div><div class="ab-by">Made by Dean Baker</div>
      <p>Walking <i class="itr">IT</i> is a family of free, interactive training sites for people starting out in IT. Each one walks you through real-world problems step by step, in plain English, and shows you what a real engineer or analyst would see along the way.</p>
      <ul>${list}</ul>
      <p>Every walk follows the same pattern: plain English first, the technical detail one click away, the real evidence (logs, tickets, command output, admin screens), and a fix or defence you can switch on to see how the story changes. Each walk has three looks: simple dark, simple light and pixel arcade.</p>
      <p class="small">Every company, person, IP address and domain in the scenarios is made up, using documentation IP ranges and example domains. Commands and queries are examples to learn from, not production scripts. Not affiliated with Microsoft, CrowdStrike, MITRE or any other vendor mentioned. © 2026 Dean Baker. All rights reserved.</p>
      <div class="row"><button class="btn pri" data-act="close">${T("Got it", "OK!")}</button></div></div></div></div>`;
  const b = $("#modal .modal .btn.pri"); if (b) b.focus();
}
function closeModal() { if (!$("#modal").innerHTML) return; $("#modal").innerHTML = ""; $("#aboutBtn").focus(); }

document.addEventListener("click", e => {
  if (!e.target.closest(".dd")) closeMenus();
  const t = e.target.closest("[data-role],[data-theme-set],[data-act]");
  if (!t) return;
  if (t.dataset.role) return setRole(t.dataset.role);
  if (t.dataset.themeSet) return setTheme(t.dataset.themeSet);
  if (t.dataset.act === "close" && (e.target === t || t.tagName === "BUTTON")) return closeModal();
});
$("#themeBtn").onclick = themeMenu;
$("#aboutBtn").onclick = openAbout;
/* stage tiles: hovering or focusing one names that stage */
document.addEventListener("mouseover", e => {
  const tile = e.target.closest(".tile"), card = e.target.closest(".walk");
  document.querySelectorAll(".tile.cur").forEach(x => { if (x !== tile) x.classList.remove("cur"); });
  document.querySelectorAll(".w-st").forEach(st => {
    const own = card && card.contains(st);
    st.textContent = own && tile ? `${+tile.dataset.stage + 1}. ${WALKS.find(w => w.id === card.dataset.id).stages[+tile.dataset.stage]}` : st.dataset.def;
  });
  if (tile) tile.classList.add("cur");
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closeMenus(); closeModal(); return; }
  if ($("#themeMenu").innerHTML && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault();
    const items = [...document.querySelectorAll("#themeMenu button")], i = items.indexOf(document.activeElement);
    items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus();
    return;
  }
  if ($("#modal").innerHTML) {
    if (e.key === "Tab") { const f = [...document.querySelectorAll("#modal button")]; if (f.length) { const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } }
    return;
  }
  const tg = (e.target.tagName || "").toUpperCase();
  if (tg === "INPUT" || tg === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.toLowerCase() === "t") { const i = THEMES.findIndex(x => x[0] === S.theme); setTheme(THEMES[(i + 1) % THEMES.length][0]); }
});

/* ============================================================
   BOOT
   ============================================================ */
setInterval(() => { if (!document.hidden) renderHdh(); }, 60000);
window.WALKINGIT = Object.freeze({name: "Walking IT", author: "Dean Baker", copyright: "© 2026 Dean Baker. All rights reserved."});
try { console.log("%cWALKING %cIT%c  by Dean Baker · © 2026", "font:700 14px monospace;color:#6ea8ff", "font:italic 700 14px monospace;color:#ff5a6e", "font:12px monospace;color:#8193b2"); } catch (e) {}
window.__wi = {S, WALKS, ROLES, setTheme, setRole, openAbout};
render();
})();
