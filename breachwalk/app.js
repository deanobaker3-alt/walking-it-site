/* Breachwalk — engine. Created by Dean Baker. © 2026 Dean Baker. All rights reserved.
   Scenarios live in data/attacks*.js, detection queries in data/queries.js. */
(function () {
"use strict";
/* ============================================================
   CONSTANTS + STATE
   ============================================================ */
const ATT = window.ATTACKS || [];
/* failover: if the scenario files didn't arrive (offline, blocked, half-deployed), say so with a Refresh
   button instead of leaving a blank screen */
if (!ATT.length) {
  const d = document.createElement("div");
  d.setAttribute("role", "alert");
  d.style.cssText = "position:fixed;inset:auto 16px 16px;margin:0 auto;max-width:440px;z-index:999;padding:18px 20px;border-radius:14px;" +
    "background:var(--panel,#111a30);color:var(--text,#d9e4f5);border:1px solid var(--line,#2e3f66);font:500 15px/1.5 'IBM Plex Sans',system-ui,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.5)";
  d.innerHTML = "<b style='display:block;font-size:17px;margin-bottom:4px'>This walk didn't load properly.</b>" +
    "Check your connection, then try again.<br><button type='button' style='margin-top:12px;font:inherit;font-weight:600;padding:9px 16px;border-radius:9px;border:0;background:#6ea8ff;color:#061226;cursor:pointer'>Refresh</button>";
  d.querySelector("button").addEventListener("click", () => location.reload());
  document.body.appendChild(d);
  return;
}
const QUERIES = window.QUERIES || {};
const PLAIN = window.PLAIN || {};
const PPH = window.PLAIN_PHASE || [];
/* one bad glossary pattern shouldn't take the whole walk down: skip it instead */
const GLOSS = (window.GLOSSARY || []).flatMap(g => { try { return [[g[0], new RegExp(g[1], "i"), g[2]]]; } catch (e) { return []; } });
const PH = ["Recon", "Initial access", "Execution & persistence", "Credential access", "Escalation & movement", "Collection & exfiltration", "Impact"];
const CATS = [["all", "All"], ["access", "Access"], ["creds", "Creds"], ["network", "Network"], ["web", "Web"], ["malware", "Malware"], ["insider", "Insider"]];
const SPEEDS = [0.5, 1, 1.5, 2];
const THEMES = [["dark", "Simple · dark", "#0a1020"], ["light", "Simple · light", "#eef2f8"], ["pixel", "Pixel arcade", "#ff3ea5"]];
const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const FRAMED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
const SVGNS = "http://www.w3.org/2000/svg";
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
const K = {theme: "attackx:theme", prog: "attackx:progress:v1", defs: "attackx:defs:v1", xp: "attackx:xp", view: "attackx:view", speed: "attackx:speed", sound: "attackx:sound", last: "attackx:last", ana: "attackx:analyst", tech: "attackx:tech"};
ATT.forEach(a => { a.nodeMap = {}; a.nodes.forEach(n => a.nodeMap[n.id] = n); });

const S = {
  theme: store.get(K.theme, "dark"), view: store.get(K.view, "net"), speed: store.get(K.speed, 1), sound: store.get(K.sound, false),
  cat: "all", A: null, step: -1, msgI: 0, phase: "overview", playing: false, token: 0, busy: false,
  blocked: null, evRows: [], seqRows: [], comp: new Set(), insp: -1, timers: [],
  defs: store.get(K.defs, {}), prog: store.get(K.prog, {}), xp: store.get(K.xp, 0), hudXp: store.get(K.xp, 0), vb: null, camTok: 0,
  mode: "explore", kase: null, lastExplore: null, curHash: "", qtab: "kql", qopen: false, techOpen: store.get(K.tech, false)
};
if (!THEMES.some(t => t[0] === S.theme)) S.theme = "dark";
if (!SPEEDS.includes(S.speed)) S.speed = 1;
if (S.view !== "net" && S.view !== "seq") S.view = "net";
if (!Number.isFinite(S.xp) || S.xp < 0) S.xp = S.hudXp = 0;
const isPixel = () => S.theme === "pixel";
const T = (simple, pixel) => isPixel() ? pixel : simple;
const later = (fn, ms) => { const id = setTimeout(fn, ms); S.timers.push(id); return id; };
const dur = ms => RM ? 0 : ms / S.speed;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ============================================================
   ICONS — isometric line art (simple themes) + pixel sprites
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
  const r = {switch: [46, 15], laptop: [40, 13], attacker: [40, 13], router: [36, 12], vpn: [36, 12], ap: [32, 11], cloud: [44, 12], idp: [44, 12], db: [30, 11], mail: [30, 11], phone: [16, 6], usb: [16, 7]}[kind] || [30, 11];
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
    <linearGradient id="g-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="g-shadow"><stop offset="0" style="stop-color:var(--shadowC)" stop-opacity=".55"/><stop offset=".6" style="stop-color:var(--shadowC)" stop-opacity=".18"/><stop offset="1" style="stop-color:var(--shadowC)" stop-opacity="0"/></radialGradient>
    ${[["attack", "var(--red)"], ["normal", "var(--node)"], ["data", "var(--amber)"], ["defence", "var(--green)"]].map(([k, c]) => `<radialGradient id="g-pkt-${k}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".22" style="stop-color:${c}" stop-opacity=".85"/><stop offset=".5" style="stop-color:${c}" stop-opacity=".28"/><stop offset="1" style="stop-color:${c}" stop-opacity="0"/></radialGradient>`).join("")}
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
const SPRMAP = {server: "server", web: "server", dns: "server", dc: "server", build: "server", db: "db", laptop: "laptop", phone: "phone", router: "router", vpn: "router", ap: "ap", usb: "usb", switch: "switch", mail: "mail", cloud: "cloud", idp: "idp"};
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
const ISO_TOP = {server: -75, web: -75, dns: -65, dc: -87, build: -75, db: -58, laptop: -60, attacker: -67, phone: -40, router: -47, vpn: -47, ap: -34, usb: -20, switch: -32, mail: -56, cloud: -52, idp: -52};
function iconTop(n) {
  if (!isPixel()) return ISO_TOP[n.kind] || -60;
  const grid = n.kind === "attacker" ? SPR.bugA : SPR[SPRMAP[n.kind] || "server"];
  const row = grid.findIndex(r => /[^.]/.test(r));
  return -60 + Math.max(0, row) * 4;
}
function icon(n) {
  const hostile = n.kind === "attacker" || n.hostile;
  return isPixel() ? pixelIcon(n.kind, hostile) : isoIcon(n.kind);
}

/* ============================================================
   SOUND (pixel theme, opt-in)
   ============================================================ */
let AC = null;
function sfx(type) {
  if (!S.sound || !isPixel()) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const seq = {send: [[660, .05]], arrive: [[440, .05]], block: [[880, .07], [660, .07], [990, .12]], win: [[523, .08], [659, .08], [784, .08], [1047, .16]], lose: [[392, .12], [330, .12], [262, .22]], comp: [[180, .12], [140, .14]], clue: [[740, .04], [988, .06]]}[type] || [[440, .05]];
    let t = AC.currentTime;
    seq.forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = "square"; o.frequency.value = f; g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); t += d * .9; });
  } catch (e) {}
}

/* ============================================================
   HELPERS
   ============================================================ */
function el(tag, attrs, html) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e; }
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function tween(ms, step, done, tok) {
  if (ms <= 0) { step(1, 0); done && done(); return; }
  const t0 = performance.now();
  const f = now => { if (tok !== undefined && tok !== S.token) return; const t = Math.min(1, (now - t0) / ms); step(t, now); if (t < 1) requestAnimationFrame(f); else done && done(); };
  requestAnimationFrame(f);
}
function toast(msg) { const d = document.createElement("div"); d.className = "toast"; d.textContent = msg; $("#toasts").appendChild(d); setTimeout(() => d.remove(), 2700); }
function award(n, why, at) {
  S.xp += n; store.set(K.xp, S.xp); renderHud();
  if (!isPixel()) return;
  if (at && S.mode === "explore") floatText(at[0], at[1], `+${n} ${why}`, "var(--amber)");
  else toast(`+${n} ${why}`);
}
function prog(a) {
  const p = S.prog[a.id];
  if (p && typeof p === "object" && !Array.isArray(p)) { if (!p.blocks || typeof p.blocks !== "object") p.blocks = {}; return p; }
  return (S.prog[a.id] = {max: 0, done: false, blocks: {}});
}
function saveProg() { store.set(K.prog, S.prog); }
const defsOn = a => a.defences.filter(d => S.defs[a.id] && S.defs[a.id][d.id]);
const stopper = a => defsOn(a).filter(d => d.stops !== false).sort((x, y) => x.at - y.at)[0] || null;
const nonstopAt = (a, i) => defsOn(a).filter(d => d.stops === false && d.at === i + 1);
const nodePos = id => { const n = S.A && S.A.nodeMap[id]; return n ? [n.x, n.y + iconTop(n)] : null; };
const copyText = (txt, ok) => { try { navigator.clipboard.writeText(txt).then(() => toast(ok || "Copied"), () => toast("Copying isn't available here")); } catch (e) { toast("Copying isn't available here"); } };

/* ---- fun: particles, floating text, flashes, attacker moods ---- */
function burst(x, y, n, cols, spread) {
  if (RM || !G.fx) return;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 2 * i / n + Math.random() * .7, d = spread * (.45 + Math.random() * .75);
    const s = isPixel() ? (Math.random() < .5 ? 6 : 4) : 2 + Math.random() * 2.5;
    const p = isPixel() ? el("rect", {x: (x - s / 2).toFixed(1), y: (y - s / 2).toFixed(1), width: s, height: s}) : el("circle", {cx: x, cy: y, r: s.toFixed(1)});
    p.setAttribute("class", "part"); p.style.fill = cols[i % cols.length];
    p.style.setProperty("--dx", (Math.cos(a) * d).toFixed(1) + "px"); p.style.setProperty("--dy", (Math.sin(a) * d).toFixed(1) + "px");
    p.style.animationDuration = (650 + Math.random() * 450) + "ms";
    G.fx.appendChild(p); setTimeout(() => p.remove(), 1200);
  }
}
function confetti() {
  if (RM || !G.fx || !S.vb) return;
  const [vx, vy, vw, vh] = S.vb, cols = ["#7dff3a", "#29e7ff", "#ffe14a", "#ff3ea5", "#ffffff"], n = isPixel() ? 46 : 34;
  for (let i = 0; i < n; i++) {
    const x = vx + Math.random() * vw, y = vy + Math.random() * vh * .25, s = isPixel() ? 6 : 5;
    const p = el("rect", {x: x.toFixed(1), y: y.toFixed(1), width: s, height: isPixel() ? s : s * 1.8, rx: isPixel() ? 0 : 1});
    p.setAttribute("class", "conf"); p.style.fill = cols[i % cols.length];
    p.style.setProperty("--dx", ((Math.random() - .5) * 120).toFixed(1) + "px"); p.style.setProperty("--dy", (vh * (.55 + Math.random() * .4)).toFixed(1) + "px");
    p.style.setProperty("--r", ((Math.random() - .5) * 720).toFixed(0) + "deg"); p.style.setProperty("--t", (1.3 + Math.random() * 1.1).toFixed(2) + "s");
    p.style.animationDelay = (Math.random() * .4).toFixed(2) + "s";
    G.fx.appendChild(p); setTimeout(() => p.remove(), 3000);
  }
}
function floatText(x, y, text, color) {
  if (!G.fx) return;
  const t = el("text", {x: x.toFixed(1), y: y.toFixed(1), class: "floaty"}); t.textContent = text; t.style.fill = color || "var(--amber)";
  G.fx.appendChild(t); setTimeout(() => t.remove(), 1300);
}
function flash() {
  if (RM) return;
  const f = document.createElement("div"); f.className = "flash"; $("#canvas").appendChild(f); setTimeout(() => f.remove(), 1200);
  const c = $("#canvas"); c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
}
let moodTimer = null;
function setMood(mood, ms) {
  clearTimeout(moodTimer);
  document.querySelectorAll("#net .node.atk").forEach(g => { g.classList.remove("happy", "dizzy"); if (mood) g.classList.add(mood); });
  if (mood && ms) moodTimer = setTimeout(() => setMood(null), ms);
}

/* ============================================================
   RENDER: top bar, sidebar, kill chain, hud
   ============================================================ */
function renderTheme() {
  document.body.setAttribute("data-theme", S.theme);
  $("#sndBtn").style.display = isPixel() ? "" : "none";
  $("#sndBtn").classList.toggle("on", S.sound);
  $("#sndBtn").innerHTML = `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6h2.6L8.5 3v10L5.1 10H2.5z" class="fill"/>${S.sound
    ? '<path d="M10.6 5.7a3.2 3.2 0 0 1 0 4.6M12.4 3.9a5.8 5.8 0 0 1 0 8.2"/>'
    : '<path d="M10.5 6l3.5 4M14 6l-3.5 4"/>'}</svg>`;
  $("#sndBtn").title = S.sound ? T("Sound on (click to mute)", "SOUND ON") : T("Sound off (click to unmute)", "SOUND OFF");
  $("#sideTitle").textContent = T("Attacks", "SELECT STAGE");
  $("#evTitle").textContent = T("Evidence timeline", "LOOT LOG");
  $("#defLbl").textContent = T("Defences", "POWER-UPS");
  $("#anaLbl").textContent = S.mode === "analyst" ? T("Exit analyst", "EXIT CASE") : T("Analyst mode", "DETECTIVE");
  $("#anaBtn").classList.toggle("on", S.mode === "analyst");
  renderHud();
}
let hudRaf = 0;
function renderHud() {
  const a = S.A, n = a ? a.steps.length : 0;
  const done = ATT.filter(x => S.prog[x.id] && S.prog[x.id].done).length;
  const stage = S.mode === "analyst" && S.kase ? `CASE <b>#${String(S.kase.n).padStart(3, "0")}</b>` : `STAGE <b>${a && S.step >= 0 ? Math.min(S.step + 1, n) : 0}/${n}</b>`;
  $("#hud").innerHTML = `<span>SCORE <b id="hudScore">${String(Math.round(S.hudXp)).padStart(6, "0")}</b></span><span>${stage}</span><span>CLEARED <b>${done}/${ATT.length}</b></span>`;
  if (S.hudXp !== S.xp) {
    cancelAnimationFrame(hudRaf);
    const from = S.hudXp, to = S.xp, t0 = performance.now(), ms = RM ? 0 : 700;
    const f = now => { const t = ms ? Math.min(1, (now - t0) / ms) : 1; S.hudXp = from + (to - from) * t; const b = document.getElementById("hudScore"); if (b) { b.textContent = String(Math.round(S.hudXp)).padStart(6, "0"); b.classList.add("bump"); } if (t < 1) hudRaf = requestAnimationFrame(f); else if (b) setTimeout(() => b.classList.remove("bump"), 200); };
    hudRaf = requestAnimationFrame(f);
  }
}
function renderTiles() {
  const a = S.A; const seen = new Set();
  let cur = 0;
  if (S.mode === "analyst") {
    $("#tiles").innerHTML = PH.map((p, i) => `<div class="tile" title="${i + 1}. ${p}">?</div>`).join("");
    $("#kcName").textContent = T("Unknown", "???");
    return;
  }
  if (a && S.phase !== "overview") {
    const last = S.phase === "done" ? (S.blocked ? S.blocked.at - 1 : a.steps.length - 1) : S.step;
    for (let i = 0; i <= Math.min(last, a.steps.length - 1); i++) seen.add(a.steps[i].ph);
    if (S.phase !== "done") cur = a.steps[S.step].ph;
  }
  $("#tiles").innerHTML = PH.map((p, i) => `<div class="tile ${cur === i + 1 ? "on" : seen.has(i + 1) ? "seen" : ""}" title="${i + 1}. ${p}">${i + 1}</div>`).join("");
  $("#kcName").textContent = cur ? PH[cur - 1] : (S.phase === "done" ? T("Complete", "FINISHED") : "—");
}
function renderSide() {
  const counts = {}; ATT.forEach(a => counts[a.cat] = (counts[a.cat] || 0) + 1);
  $("#ctabs").innerHTML = CATS.filter(([k]) => k === "all" || counts[k]).map(([k, l]) => `<button class="ctab ${S.cat === k ? "on" : ""}" data-cat="${k}">${l}<b>${k === "all" ? ATT.length : counts[k] || 0}</b></button>`).join("");
  const list = ATT.filter(a => S.cat === "all" || a.cat === S.cat);
  const explore = S.mode === "explore";
  const st = S.A && explore ? stopper(S.A) : null;
  const anim = explore && S.A && S.sideAnim !== S.A.id; if (explore && S.A) S.sideAnim = S.A.id;
  $("#alist").innerHTML = list.map(a => {
    const p = S.prog[a.id], sel = explore && S.A && S.A.id === a.id;
    const dot = p && p.done ? "done" : p && p.max > 0 ? "part" : "";
    let steps = "";
    if (sel) {
      steps = `<ul class="steps${anim ? " anim" : ""}">${a.steps.map((s, i) => {
        let cls = "";
        const blockAt = st ? st.at - 1 : 99;
        if (S.phase === "done") cls = i < blockAt ? "done" : i === blockAt ? "blk" : "off";
        else if (S.phase === "step") cls = i < S.step ? "done" : i === S.step ? (S.blocked && i === blockAt ? "blk" : "cur") : i > blockAt ? "off" : "";
        else if (i > blockAt) cls = "off";
        const n = cls === "done" ? "✓" : cls === "blk" ? "🛡" : i + 1;
        if (cls === "done" && S.phase === "step" && i === S.step - 1) cls += " just";
        return `<li class="${cls}" data-step="${i}"><span class="n">${n}</span><span><span class="t">${esc(s.title)}</span><span class="s">${esc(s.sub)}</span></span></li>`;
      }).join("")}</ul>`;
    }
    return `<div class="aitem ${sel ? "sel" : ""}"><button class="ahead" data-a="${a.id}"><span class="dot ${dot}"></span><span><span class="nm">${esc(a.name)}</span><span class="sb">${esc(a.sub)}</span></span><span class="chev">›</span></button>${steps}</div>`;
  }).join("");
}

/* ============================================================
   STAGE: network view
   ============================================================ */
const svg = $("#net");
let G = {};
function buildStage() {
  const a = S.A;
  svg.innerHTML = stageDefs();
  G.links = el("g", {}); G.trails = el("g", {}); G.nodes = el("g", {}); G.fx = el("g", {}); G.call = el("g", {});
  [G.links, G.trails, G.nodes, G.fx, G.call].forEach(g => svg.appendChild(g));
  a.links.forEach(([x, y]) => {
    const A1 = a.nodeMap[x], B1 = a.nodeMap[y];
    const at = {x1: A1.x, y1: A1.y - 22, x2: B1.x, y2: B1.y - 22};
    G.links.appendChild(el("line", Object.assign({class: "linkglow", "data-l": x + "|" + y}, at)));
    G.links.appendChild(el("line", Object.assign({class: "link", "data-l": x + "|" + y}, at)));
  });
  const px = isPixel();
  a.nodes.forEach((n, i) => {
    const hostile = n.kind === "attacker" || n.hostile;
    const g = el("g", {class: "node" + (hostile ? " hostile" : "") + (n.kind === "attacker" ? " atk" : ""), id: "n-" + n.id, transform: `translate(${n.x},${n.y})`});
    const halo = px ? `<path d="M-30,-2h60v4h8v4h-8v4h-60v-4h-8v-4h8z"/>` : `<ellipse class="pool" rx="70" ry="25" cy="4"/><ellipse class="ring" rx="54" ry="18" cy="4"/><ellipse class="ring r2" rx="64" ry="22" cy="4"/>`;
    g.innerHTML = `<g class="nin" style="animation-delay:${RM ? 0 : i * 70}ms">
      <g class="halo">${halo}</g>${px ? `<rect class="pshadow" x="-22" y="1" width="44" height="4"/>` : ""}
      <g class="ico">${icon(n)}</g>
      <g class="compbadge" transform="translate(0,${iconTop(n) - (px ? 14 : 15)})">${px ? `<rect x="-34" y="-9" width="68" height="16" rx="0"/><text y="3">PWNED</text>` : `<rect x="-46" y="-9.5" width="92" height="17" rx="8.5"/><circle class="bdot" cx="-36" cy="-1" r="2.2"/><text x="6" y="2.6">COMPROMISED</text>`}</g>
      <text class="nl" y="${px ? 22 : 36}">${esc(n.label)}</text><text class="ns" y="${px ? 38 : 52}">${esc(n.sub)}</text></g>`;
    G.nodes.appendChild(g);
  });
  S.vb = null;
}
function nodeStates(focus) {
  const a = S.A;
  a.nodes.forEach(n => {
    const g = document.getElementById("n-" + n.id); if (!g) return;
    g.classList.toggle("comp", S.comp.has(n.id));
    g.classList.toggle("focus", !!focus && focus.has(n.id));
    g.classList.toggle("dim", !!focus && focus.size > 0 && !focus.has(n.id) && !S.comp.has(n.id) && S.phase === "step");
  });
  svg.querySelectorAll(".link,.linkglow").forEach(l => {
    const [x, y] = l.dataset.l.split("|");
    const live = focus && focus.has(x) && focus.has(y) && S.phase === "step";
    l.classList.toggle("live", !!live);
    l.classList.toggle("hot", !!live && (S.comp.has(x) || S.comp.has(y) || a.nodeMap[x].kind === "attacker" || a.nodeMap[y].kind === "attacker"));
  });
}
function focusSet(step) {
  const f = new Set();
  if (!step) return f;
  (step.msgs || []).forEach(m => { f.add(m.from); f.add(m.to); });
  (step.compromise || []).forEach(id => f.add(id));
  (step.focus || []).forEach(id => f.add(id));
  return f;
}
function fitBox(ids) {
  const a = S.A, ns = ids.length ? ids.map(id => a.nodeMap[id]) : a.nodes;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  ns.forEach(n => { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); });
  // extra headroom above the top row so the result banner never sits on a node's badge
  let w = Math.max(x1 - x0 + 300, 700), h = Math.max(y1 - y0 + 330, 500);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - 36;
  const r = svg.getBoundingClientRect(); const ar = r.width > 10 && r.height > 10 ? r.width / r.height : 1.6;
  if (w / h < ar) w = h * ar; else h = w / ar;
  return [cx - w / 2, cy - h / 2, w, h];
}
function camera(ids, instant) {
  if (!S.A) return;
  const target = fitBox(ids), from = S.vb || target, tok = ++S.camTok;
  const set = v => { S.vb = v; svg.setAttribute("viewBox", v.map(x => x.toFixed(1)).join(" ")); };
  if (S.camAnim) { try { S.camAnim.cancel(); } catch (e) {} S.camAnim = null; if (S.camTo) set(S.camTo); }
  const box = svg.getBoundingClientRect();
  if (instant || !S.vb || RM || box.width < 10 || !svg.animate) return set(target);
  // Smooth pan: animate a GPU transform from the old view to the new one, then commit the new viewBox once.
  const W = box.width, H = box.height, sc = v => Math.min(W / v[2], H / v[3]);
  const cur = S.vb, sF = sc(cur), sT = sc(target), k = sT / sF;
  const oF = [(W - cur[2] * sF) / 2 - cur[0] * sF, (H - cur[3] * sF) / 2 - cur[1] * sF];
  const oT = [(W - target[2] * sT) / 2 - target[0] * sT, (H - target[3] * sT) / 2 - target[1] * sT];
  const e = oT[0] - k * oF[0], f = oT[1] - k * oF[1];
  if (Math.abs(k - 1) < 1e-3 && Math.abs(e) < .5 && Math.abs(f) < .5) return set(target);
  S.camTo = target;
  const anim = svg.animate([{transform: "matrix(1,0,0,1,0,0)"}, {transform: `matrix(${k},0,0,${k},${e},${f})`}], {duration: 750, easing: "cubic-bezier(.65,0,.35,1)"});
  S.camAnim = anim;
  // commit the new view as soon as the pan finishes; anything waiting on the camera waits on this
  const commit = () => { if (S.camAnim !== anim) return; S.camAnim = null; S.camTo = null; S.camCommit = null; set(target); anim.cancel(); };
  S.camCommit = commit;
  anim.finished.then(commit, () => {});
}
function clearFx() { document.querySelectorAll(".wi-pk").forEach(e => e.remove()); if (G.fx) { G.fx.innerHTML = ""; G.trails.innerHTML = ""; G.call.innerHTML = ""; } }
function anchor(id) { const n = S.A.nodeMap[id]; return [n.x, n.y - 34]; }
/* ============================================================
   WALKING IT: smooth messages. In the simple themes each message is an HTML layer above the map,
   moved by the browser's compositor (Web Animations API), so it glides even when the page is busy.
   ============================================================ */
function wiPkLayer() {
  let l = document.getElementById("wiPk");
  if (!l) { l = document.createElement("div"); l.id = "wiPk"; l.className = "wi-pk-layer"; l.setAttribute("aria-hidden", "true"); $("#canvas").appendChild(l); }
  return l;
}
function wiFly(ms, step, done, tok, o) {
  const box = svg.getBoundingClientRect();
  if (ms <= 0 || box.width < 10 || !document.body.animate) return tween(ms, step, done, tok);
  if (S.camAnim) {
    // wait for the camera to finish its pan first; never loop (the camera commits before we retry)
    const a = S.camAnim, again = () => { if (tok !== S.token) return; if (S.camAnim === a && S.camCommit) S.camCommit(); if ((o.tries = (o.tries || 0) + 1) > 3) return tween(ms, step, done, tok); wiFly(ms, step, done, tok, o); };
    if (a.playState === "finished") again(); else a.finished.then(again, again);
    return;
  }
  o.g.style.display = "none";
  const vb = S.vb, W = box.width, H = box.height, s = Math.min(W / vb[2], H / vb[3]);
  const ox = (W - vb[2] * s) / 2 - vb[0] * s, oy = (H - vb[3] * s) / 2 - vb[1] * s;
  const el = document.createElement("div");
  el.className = "wi-pk k-" + o.m.kind;
  el.innerHTML = `<i class="gl"></i><i class="dt"></i><i class="co"></i><span class="lb"></span>`;
  el.querySelector(".lb").textContent = o.m.label;
  wiPkLayer().appendChild(el);
  const N = 72, kf = [], lk = [], tk = [], stopEarly = o.stopAt < 1;
  for (let i = 0; i <= N; i++) {
    const t = i / N, e = ease(t) * o.stopAt, p = o.bez(e);
    kf.push({transform: `translate(${(ox + p[0] * s).toFixed(2)}px,${(oy + p[1] * s).toFixed(2)}px) scale(${s.toFixed(4)})`});
    lk.push({opacity: Math.max(0, Math.min(1, (t - .06) / .12, stopEarly ? 1 : (.8 - t) / .12))});
    tk.push({strokeDashoffset: (1 - e).toFixed(4)});
  }
  const run = el.animate(kf, {duration: ms, fill: "forwards"});
  el.querySelector(".lb").animate(lk, {duration: ms, fill: "forwards"});
  o.trail.querySelectorAll("path").forEach(p => p.animate(tk, {duration: ms, fill: "forwards"}));
  const end = () => {
    if (tok !== undefined && tok !== S.token) { el.remove(); return; }
    done && done();
    el.style.transition = `opacity ${stopEarly ? .5 : .45}s`; el.style.opacity = "0";
    setTimeout(() => el.remove(), 560);
  };
  run.finished.then(end, () => el.remove());
}
function animateMsg(m, cb) {
  const tok = S.token, px = isPixel();
  const p0 = anchor(m.from), p1 = anchor(m.to);
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L, bend = Math.min(70, L * .16) * (m.kind === "attack" ? 1 : -1);
  const c = [(p0[0] + p1[0]) / 2 + nx * bend, (p0[1] + p1[1]) / 2 + ny * bend];
  const bez = t => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
  const trailD = `M${p0[0]},${p0[1]} Q${c[0]},${c[1]} ${p1[0]},${p1[1]}`;
  const trail = el("g", {class: "trailg"});
  trail.innerHTML = `<path class="trail glow k-${m.kind}" d="${trailD}" pathLength="1"/><path class="trail k-${m.kind}" d="${trailD}" pathLength="1"/>`;
  G.trails.appendChild(trail);
  const g = el("g", {class: "pkt k-" + m.kind});
  g.innerHTML = (px ? `<g class="cube"><rect class="dotp" x="-6" y="-6" width="12" height="12"/><rect class="shine" x="-6" y="-6" width="4" height="4"/></g>` : `<circle class="pglow" r="16" fill="url(#g-pkt-${m.kind})"/><circle class="dotp" r="4"/><circle class="pcore" r="1.8"/>`) + `<g class="lbl"><rect class="card"/><text></text></g>`;
  G.fx.appendChild(g);
  const txt = g.querySelector("text"), lbl = g.querySelector(".lbl"); txt.textContent = m.label; lbl.style.opacity = 0;
  let tw = 120; try { tw = txt.getComputedTextLength(); } catch (e) {}
  const rw = tw + 18, rh = px ? 20 : 22;
  const rect = g.querySelector("rect.card");
  rect.setAttribute("x", -rw / 2); rect.setAttribute("y", -rh - 12); rect.setAttribute("width", rw); rect.setAttribute("height", rh);
  txt.setAttribute("y", -12 - rh / 2 + 1);
  const stopAt = m.blocked ? .74 : 1;
  let lastDust = 0;
  sfx("send");
  $("#stage").classList.add("flying");
  (px || RM ? tween : wiFly)(dur(1950), (t, now) => {
    const e = ease(t) * stopAt;
    let [x, y] = bez(e);
    if (px) {
      y -= Math.abs(Math.sin(e * Math.PI * 3)) * 6; x = Math.round(x / 2) * 2; y = Math.round(y / 2) * 2;
      if (now - lastDust > 60 && t < .98 && !RM) {
        lastDust = now;
        const d = el("rect", {class: "dust k-" + m.kind, x: x - 2, y: y - 2, width: 4, height: 4}); G.trails.appendChild(d); setTimeout(() => d.remove(), 520);
      }
    }
    g.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    // label fades in once the packet has left its node, and out just before it lands, so it never sits on an icon
    lbl.style.opacity = Math.max(0, Math.min(1, (t - .06) / .12, m.blocked ? 1 : (.8 - t) / .12)).toFixed(2);
    trail.querySelectorAll("path").forEach(pa => pa.style.strokeDashoffset = (1 - e).toFixed(3));
  }, () => {
    $("#stage").classList.remove("flying");
    if (tok !== S.token) return;
    const end = bez(stopAt);
    if (m.blocked) {
      const sh = el("g", {transform: `translate(${end[0].toFixed(1)},${end[1].toFixed(1)})`});
      sh.innerHTML = `<g class="shield"><circle class="burst" r="16"/>${px ? "" : `<circle class="sglow" r="26"/>`}<path class="sbody" d="M0,-16 L13,-10 V0 C13,9 7,15 0,18 C-7,15 -13,9 -13,0 V-10 Z"/><path d="M-5,0 l4,4 7,-8" fill="none" stroke="#04130c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><text y="34">${px ? "BLOCKED!" : "BLOCKED"}</text></g>`;
      G.fx.appendChild(sh);
      burst(end[0], end[1], px ? 16 : 12, ["#3ddc97", "#7dff3a", "#29e7ff", "#ffffff"], px ? 70 : 52);
      g.style.transition = "opacity .5s"; g.style.opacity = "0";
      setMood("dizzy", 2800);
      sfx("block");
    } else {
      const n = S.A.nodeMap[m.to];
      const rp = px ? el("rect", {class: "ripple k-" + m.kind, x: n.x - 26, y: n.y - 60, width: 52, height: 52}) : el("g", {class: "rippleg"});
      if (!px) rp.innerHTML = `<ellipse class="ripple k-${m.kind}" cx="${n.x}" cy="${n.y + 4}" rx="46" ry="16"/><ellipse class="ripple r2 k-${m.kind}" cx="${n.x}" cy="${n.y + 4}" rx="46" ry="16"/><circle class="ripple r3 k-${m.kind}" cx="${n.x}" cy="${n.y - 30}" r="30"/>`;
      G.fx.appendChild(rp); setTimeout(() => rp.remove(), 1300);
      const ng = document.getElementById("n-" + m.to); if (ng) { ng.classList.remove("bump"); void ng.getBBox(); ng.classList.add("bump"); }
      g.style.transition = "opacity .45s"; g.style.opacity = "0";
      setTimeout(() => g.remove(), 500);
      sfx("arrive");
    }
    setTimeout(() => trail.classList.add("fade"), 350);
    cb && cb();
  }, tok, {g, trail, bez, stopAt, m});
}
function showCallout(text, nodeId, good) {
  const n = S.A.nodeMap[nodeId] || S.A.nodes[0];
  const g = el("g", {transform: `translate(${n.x},${n.y + iconTop(n) - 50})`});
  const px = isPixel();
  g.innerHTML = `<g class="callout${good ? " good" : ""}"><rect class="cbg"/>${px ? "" : `<path class="cptr" d="M-6,13.4 L0,20 L6,13.4"/><circle class="cbar" r="3.2"/>`}<text></text></g>`;
  G.call.appendChild(g);
  const t = g.querySelector("text"); t.textContent = text;
  let w = 140; try { w = t.getComputedTextLength() + (px ? 22 : 34); } catch (e) {}
  const r = g.querySelector("rect.cbg"); r.setAttribute("x", -w / 2); r.setAttribute("y", -14); r.setAttribute("width", w); r.setAttribute("height", 28);
  if (!px) { const b = g.querySelector(".cbar"); b.setAttribute("cx", -w / 2 + 13); b.setAttribute("cy", 0); t.setAttribute("x", 6); }
}

/* ============================================================
   STAGE: sequence view
   ============================================================ */
function renderSeq(animateLast) {
  if (S.mode !== "explore") return;
  const a = S.A, box2 = $("#seq"), px = isPixel();
  const lanes = a.lanes, pad = 10, minLw = px ? 94 : 90;
  const W = Math.max(box2.clientWidth || 800, lanes.length * minLw + pad * 2);
  const lw = (W - pad * 2) / lanes.length;
  const lx = id => pad + (lanes.indexOf(id) + .5) * lw;
  const cw = px ? 7.6 : 6.7;                       // rough character width for wrapping
  const cut = (t, n) => (t = t || "", t.length > n ? t.slice(0, Math.max(3, n - 1)) + "…" : t);
  const wrap2 = (t, n) => {                         // word-wrap into at most two lines
    const w = String(t || "").split(" "), L = [""];
    w.forEach(x => { const cur = L[L.length - 1]; if (!cur.length || (cur + " " + x).length <= n) L[L.length - 1] = cur ? cur + " " + x : x; else L.push(x); });
    return L.length > 2 ? [L[0], cut(L.slice(1).join(" "), n)] : L.map(l => cut(l, n));
  };
  const hn = Math.max(6, Math.floor((lw - 18) / cw));

  /* header: one card per lane (sticky) */
  const HH = 58;
  const head = lanes.map(id => {
    const n = a.nodeMap[id], bad = n.kind === "attacker" || n.hostile, x = lx(id), bw = lw - 12;
    const L = wrap2(n.label, hn), lh = px ? 14 : 13, y0 = L.length > 1 ? 21 : 27;
    return `<g class="lhead ${bad ? "bad" : ""}"><title>${esc(n.label)} · ${esc(n.sub)}</title>
      <rect x="${x - bw / 2}" y="6" width="${bw}" height="${HH - 10}" rx="8"/>
      ${L.map((l, i) => `<text class="lanehd" x="${x}" y="${y0 + i * lh}">${esc(l)}</text>`).join("")}
      <text class="lanesub" x="${x}" y="${y0 + L.length * lh + 1}">${esc(cut(n.sub, hn + 2))}</text></g>`;
  }).join("");

  /* body */
  let y = 8, body = "", lastStep = -1;
  const span = (x1, x2) => Math.abs(x2 - x1);
  S.seqRows.forEach((r, i) => {
    const isLast = animateLast && i === S.seqRows.length - 1, dr = isLast ? "draw" : "";
    if (r.step !== lastStep) {
      if (lastStep >= 0) y += 8;
      const cur = r.step === S.step, st = a.steps[r.step];
      const tt = `${T("Step", "STAGE")} ${r.step + 1}`, sub = st.title;
      body += `<g class="sband ${cur ? "cur" : ""}"><rect x="${pad}" y="${y}" width="${W - pad * 2}" height="26" rx="6"/>
        <text class="sstep" x="${pad + 12}" y="${y + 17}">${esc(tt.toUpperCase())}</text>
        <text class="sstitle" x="${pad + 12 + (px ? 74 : 62)}" y="${y + 17}">${esc(cut(sub, Math.floor((W - 110) / cw)))}</text></g>`;
      y += 26 + 12; lastStep = r.step;
    }
    if (r.type === "msg") {
      const m = r.m, x1 = lx(m.from), x2 = lx(m.to);
      const ay = y + 22;
      if (m.from === m.to) {                         // message to itself: small loop
        const d = `M${x1},${ay - 8} h28 v14 h-24`;
        body += isLast ? `<path class="sarrow s-${m.kind} draw" style="--d:${(dur(1560) / 1000).toFixed(2)}s" pathLength="1" d="${d}"/><path class="sarrow s-${m.kind} headin" style="--d:${(dur(1560) / 1000).toFixed(2)}s" d="${d}" marker-end="url(#ar-${m.kind})"/>`
                       : `<path class="sarrow s-${m.kind}" d="${d}" marker-end="url(#ar-${m.kind})"/>`;
        body += `<text class="slabel s-${m.kind} ${dr}" x="${x1 + 36}" y="${ay}" style="text-anchor:start">${esc(m.label)}</text>`;
        y += 40;
      } else {
        const dir = x2 > x1 ? 1 : -1, xs = x1 + dir * 4, xe = m.blocked ? x1 + (x2 - x1) * .55 : x2 - dir * 6;
        body += `<circle class="sdot s-${m.kind}" cx="${x1}" cy="${ay}" r="3.2"/>`;
        const dd = (dur(1720) / 1000).toFixed(2), pth = `M${xs},${ay} L${xe},${ay}`, mk = `marker-end="url(#ar-${m.blocked ? "blk" : m.kind})"`;
        // while drawing, the arrowhead waits until the line arrives so it never floats ahead of it
        body += isLast ? `<path class="sarrow s-${m.kind} draw" style="--d:${dd}s" pathLength="1" d="${pth}"/><path class="sarrow s-${m.kind} headin" style="--d:${dd}s" d="${pth}" ${mk}/>`
                       : `<path class="sarrow s-${m.kind}" d="${pth}" ${mk}/>`;
        // label sits above the arrow, centred on it, kept inside the canvas
        const room = Math.max(span(x1, xe) + lw * .5, lw * 1.8), lab = cut(m.label, Math.floor(room / cw));
        let lxp = (x1 + xe) / 2; const half = lab.length * cw / 2 + 6;
        if (m.blocked) lxp = dir > 0 ? Math.min(lxp, xe - half) : Math.max(lxp, xe + half);
        lxp = Math.min(Math.max(lxp, pad + half), W - pad - half);
        body += `<text class="slabel s-${m.kind} ${dr}" x="${lxp}" y="${ay - 7}"><title>${esc(m.label)}</title>${esc(lab)}</text>`;
        if (m.blocked) body += `<g class="sblock ${dr}"><circle cx="${xe + dir * 11}" cy="${ay}" r="8"/><text x="${xe + dir * 11}" y="${ay + 4}">✕</text></g><text class="slabel s-defence ${dr}" x="${xe + dir * 11}" y="${ay + 24}">${T("BLOCKED", "BLOCKED!")}</text>`;
        y += m.blocked ? 54 : 42;
      }
    } else if (r.type === "call") {
      const cx = W / 2, w = Math.min(r.text.length * cw + 32, W - pad * 2 - 20);
      body += `<g class="scall ${r.good ? "good" : ""} ${isLast ? "callout" : ""}"><rect x="${cx - w / 2}" y="${y + 6}" width="${w}" height="26" rx="13"/><text x="${cx}" y="${y + 19.5}">${esc(cut(r.text, Math.floor((w - 24) / cw)))}</text></g>`;
      y += 42;
    }
  });
  const H = Math.max(y + 24, (box2.clientHeight || 300) - HH);
  const lanesSvg = lanes.map(id => `<line class="lane ${a.nodeMap[id].kind === "attacker" || a.nodeMap[id].hostile ? "bad" : ""}" x1="${lx(id)}" y1="0" x2="${lx(id)}" y2="${H}"/>`).join("");
  const markers = ["attack", "normal", "data", "defence", "blk"].map(k => `<marker id="ar-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="s-${k === "blk" ? "defence" : k}"/></marker>`).join("");
  const sdefs = `<defs><linearGradient id="seqCard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2a4a"/><stop offset="1" stop-color="#131d36"/></linearGradient><linearGradient id="seqCardBad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a2a"/><stop offset="1" stop-color="#1c1526"/></linearGradient><linearGradient id="seqBand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#52d6ff" stop-opacity=".18"/><stop offset="1" stop-color="#52d6ff" stop-opacity=".03"/></linearGradient></defs>`;
  box2.innerHTML = `<div class="seqhead"><svg width="${W}" height="${HH}" viewBox="0 0 ${W} ${HH}">${sdefs}${lanes.map(id => `<line class="lane" x1="${lx(id)}" y1="${HH - 4}" x2="${lx(id)}" y2="${HH}"/>`).join("")}${head}</svg></div>
    <svg class="seqbody" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${markers}</defs>${lanesSvg}${body}</svg>`;
  if (!S.seqRows.length) box2.insertAdjacentHTML("beforeend", `<div class="empty seqempty">${T("Press Play and each message will appear here, top to bottom, in the order it happens.", "PRESS START")}</div>`);
  if (animateLast) box2.scrollTo({top: box2.scrollHeight, behavior: RM ? "auto" : "smooth"});
}

/* ============================================================
   INFO PANEL
   ============================================================ */
function sevChip(a) { return `<span class="chip ${a.severity === "Critical" ? "crit" : "high"}">${esc(a.severity)}</span>`; }
function defsHTML(a) {
  return `<div class="defs">${a.defences.map(d => { const on = S.defs[a.id] && S.defs[a.id][d.id];
    return `<button class="def ${on ? "on" : ""}" data-def="${d.id}"><span class="tg"></span><span><span class="dn">${esc(d.name)}</span><span class="dd2">${esc(d.desc)}</span><span class="dat">${d.stops === false ? T("Reduces impact at step ", "SHIELDS STEP ") : T("Blocks at step ", "BLOCKS STEP ")}${d.at}</span></span></button>`; }).join("")}</div>`;
}
function linkBtn() { return FRAMED ? "" : `<button class="back" data-act="copylink" title="Copy a link to this exact view">🔗 ${T("Link", "LINK")}</button>`; }
function queriesHTML(a, i) {
  const q = (QUERIES[a.id] || {})[i + 1]; if (!q) return "";
  const tab = q[S.qtab] ? S.qtab : (q.kql ? "kql" : "cql");
  return `<details class="qbox"${S.qopen ? " open" : ""}><summary>🔎 ${T("Detection queries", "HUNT CODES")} <span class="muted">${T("(examples)", "(EXAMPLES)")}</span></summary>
    <div class="qtabs">${["kql", "cql"].filter(k => q[k]).map(k => `<button class="qtab ${k === tab ? "on" : ""}" data-qtab="${k}">${k === "kql" ? "Microsoft KQL" : "CrowdStrike CQL"}</button>`).join("")}<button class="qcopy" data-act="qcopy">Copy</button></div>
    <pre class="q" id="qtext">${esc(q[tab])}</pre>
    <div class="qnote">${tab === "kql" ? "Microsoft Sentinel / Defender XDR advanced hunting." : "CrowdStrike Falcon Next-Gen SIEM."} Example only: table, event and field names vary by tenant, connector and parser, so test it before you rely on it.</div></details>`;
}
const plainStep = (a, i) => ((PLAIN[a.id] || {}).steps || [])[i] || {what: a.steps[i].text, spot: a.steps[i].defender};
function glossHTML(text, max) {
  const hits = GLOSS.filter(g => g[1].test(text)).slice(0, max || 4);
  if (!hits.length) return "";
  return `<div class="gloss"><b class="h2">📖 ${T("Words to know", "WORD LIST")}</b><dl>${hits.map(g => `<dt>${esc(g[0])}</dt><dd>${esc(g[2])}</dd>`).join("")}</dl></div>`;
}
function techHTML(inner) {
  return `<details class="tech"${S.techOpen ? " open" : ""}><summary>🛠 ${T("Technical detail", "TECH SPECS")} <span class="muted">${T("(for analysts)", "(ADVANCED)")}</span></summary><div class="tech-in">${inner}</div></details>`;
}
function refreshQ() { const b = document.querySelector("#info .qbox"); if (b && S.phase === "step") b.outerHTML = queriesHTML(S.A, S.step); }
function renderInfo() {
  queueMicrotask(() => wiN("render"));
  if (S.mode === "analyst") return renderCaseInfo();
  const a = S.A, box2 = $("#info");
  let head = "", body = "";
  if (S.phase === "overview") {
    head = `<span class="h">${T("Attack overview", "MISSION BRIEF")}</span><span style="display:flex;gap:6px;align-items:center">${linkBtn()}${sevChip(a)}</span>`;
    body = `<div class="kick">${esc(CATS.find(c => c[0] === a.cat)[1])} · ${a.steps.length} ${T("steps", "STAGES")}</div>
      <div class="ttl">${esc(a.name)}</div><div class="subt">${esc(a.sub)}</div>
      <div class="row" style="margin:12px 0 4px"><button class="btn pri" data-act="play">▶ ${T("Play attack", "START")}</button><button class="btn" data-act="card">📄 ${T("Revision card", "CHEAT SHEET")}</button></div>
      ${techHTML(`<p class="para">${esc(a.summary)}</p>
        <div class="kv">${a.facts.map(f => `<span>${esc(f[0])}</span><span>${esc(f[1])}</span>`).join("")}</div>
        <div class="box see"><b class="h2">MITRE ATT&amp;CK</b><ul class="mitre">${a.mitre.map(m => { const [id, ...rest] = m.split(" "); return `<li><b>${esc(id)}</b>${esc(rest.join(" "))}</li>`; }).join("")}</ul></div>`)}
      <div class="kick" style="margin-top:14px">${T("Try a defence: switch one on, then press Play", "POWER-UPS: EQUIP, THEN PRESS START")}</div>
      ${defsHTML(a)}`;
  } else if (S.phase === "step") {
    const s = a.steps[S.step], blk = S.blocked;
    head = `<span class="h">${blk ? T("Blocked", "BLOCKED!") : T("Step details", "STAGE INFO")}</span><span style="display:flex;gap:6px">${linkBtn()}<button class="back" data-act="overview">‹ ${T("Overview", "BRIEF")}</button></span>`;
    const msgs = blk ? stepMsgs() : s.msgs;
    const mcards = msgs.map((m, i) => `<div class="mcard ${i >= S.msgI ? "pending" : ""}"><span class="mt k-${blk ? "defence" : m.kind}">${blk ? "Blocked" : m.kind === "normal" ? "Normal" : m.kind === "data" ? "Data" : "Attack"}</span><span class="ml">${esc(m.label)}<small>${esc(a.nodeMap[m.from].label)} → ${esc(a.nodeMap[m.to].label)}</small></span></div>`).join("");
    const ns = nonstopAt(a, S.step), pl = plainStep(a, S.step);
    body = `<div class="kick">${T("Step", "STAGE")} ${S.step + 1} ${T("of", "/")} ${a.steps.length} · ${esc(PPH[s.ph - 1] || s.tactic)}</div>
      <div class="ttl">${esc(blk ? T("Stopped", "STAGE CLEAR!") : s.title)}</div><div class="subt">${esc(blk ? blk.name : s.sub)}</div>
      ${blk ? `<div class="box good"><b class="h2">🛡 ${esc(blk.name)}</b>${esc(blk.result)}</div><p class="para muted">${T("Without it", "WITHOUT THIS POWER-UP")}: ${esc(pl.what)}</p>`
            : ""}
      ${msgs.length ? `<div class="kick" style="margin:12px 0 6px">${T("What moves", "ON THE WIRE")}</div>${mcards}` : ""}
      ${!blk ? `<div class="box see"><b class="h2">👁 ${T("How you'd spot it", "HOW TO SPOT IT")}</b>${esc(pl.spot)}</div>` : ""}
      ${ns.map(d => `<div class="box good"><b class="h2">🛡 ${esc(d.name)}</b>${esc(d.result)}</div>`).join("")}
      ${!blk ? glossHTML(pl.what + " " + pl.spot) : ""}
      ${!blk ? techHTML(`<div class="kick">${T("Attack technique", "TECHNIQUE")}</div><p class="para mono-s">${esc(s.tactic)}</p>
        ${s.facts ? `<div class="kv">${s.facts.map(f => `<span>${esc(f[0])}</span><span>${esc(f[1])}</span>`).join("")}</div>` : ""}
        <div class="box see"><b class="h2">👁 ${T("What the analyst sees", "WHAT THE SOC SEES")}</b>${esc(s.defender)}</div>
        ${queriesHTML(a, S.step)}`) : ""}
      ${blk ? `<div class="row"><button class="btn pri" data-act="next">${T("See the debrief", "CONTINUE")} ▶</button></div>` : ""}`;
  } else {
    const st = S.blocked;
    head = `<span class="h">${T("Debrief", "RESULTS")}</span><span style="display:flex;gap:6px">${linkBtn()}<button class="back" data-act="overview">‹ ${T("Overview", "BRIEF")}</button></span>`;
    const outcome = st
      ? `<div class="box good"><b class="h2">${T("Attack stopped", "STAGE CLEAR!")}</b>${T("Stopped at step", "BLOCKED AT STAGE")} ${st.at}: <b>${esc(a.steps[st.at - 1].title)}</b> by <b>${esc(st.name)}</b>.</div>`
      : `<div class="box bad"><b class="h2">${T("The attacker succeeded", "GAME OVER")}</b>${T("All", "")} ${a.steps.length} ${T("steps completed", "STAGES LOST")}. ${T("Switch on a defence and press Replay to see where it breaks the chain.", "EQUIP A POWER-UP AND TRY AGAIN.")}</div>`;
    const tried = Object.keys(prog(a).blocks || {}).length;
    body = `<div class="kick">${esc(a.name)}</div><div class="ttl">${T("Debrief", "RESULTS")}</div>
      ${outcome}
      <div class="kick" style="margin-top:12px">${T("How to detect it", "SPOT IT")}</div><ul class="ul">${a.debrief.detect.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="kick" style="margin-top:12px">${T("How to stop it", "STOP IT")}</div><ul class="ul">${a.debrief.prevent.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="kick" style="margin-top:14px">${T("Defences", "POWER-UPS")} (${tried}/${a.defences.length} ${T("seen working", "FOUND")})</div>
      ${defsHTML(a)}
      <div class="row"><button class="btn pri" data-act="replay">↺ ${T("Replay", "RETRY")}</button><button class="btn" data-act="card">📄 ${T("Revision card", "CHEAT SHEET")}</button><button class="btn" data-act="nextAttack">${T("Next attack", "NEXT STAGE")} ▶</button></div>`;
  }
  box2.innerHTML = `<div class="ph">${head}</div><div class="ib2 fx-in">${body}</div>`;
  box2.scrollTop = 0;
}
function updateMsgCards() {
  document.querySelectorAll("#info .mcard").forEach((c, i) => c.classList.toggle("pending", i >= S.msgI));
}

/* ============================================================
   EVIDENCE TABLE + INSPECTOR
   ============================================================ */
const SEVL = {high: "High", med: "Medium", low: "Low", info: "Info", block: "Blocked"};
function renderEv(newFrom) {
  const rows = S.evRows;
  if (!rows.length) {
    const msg = S.mode === "analyst" ? T("Waiting for the first clue…", "SCANNING…") : S.phase === "overview" ? T("Evidence appears here as the attack plays: log lines, alerts and packets, just as your SOC would see them.", "NO LOOT YET. PRESS START!") : T("No evidence yet. Some steps leave no trace in your logs.", "NOTHING YET…");
    $("#etable").innerHTML = `<div class="empty">${msg}</div>`; return;
  }
  $("#etable").innerHTML = `<table class="et"><thead><tr><th>#</th><th>Time</th><th>Source</th><th>Event</th><th>Severity</th></tr></thead><tbody>${rows.map((r, i) => {
    const isNew = newFrom !== undefined && i >= newFrom;
    return `<tr class="sev-${r.sev} ${isNew ? "new" : ""}" data-ev="${i}" style="${isNew ? `animation-delay:${(i - newFrom) * 120}ms` : ""}"><td class="sn">${i + 1}</td><td>${esc(r.t)}</td><td>${esc(r.src)}</td><td class="ev-t">${esc(r.title)}</td><td><span class="badge">${SEVL[r.sev] || r.sev}</span></td></tr>`; }).join("")}</tbody></table>`;
  if (newFrom !== undefined) { const t = $("#etable"); t.scrollTo({top: t.scrollHeight, behavior: RM ? "auto" : "smooth"}); }
}
function openInsp(i) {
  if (i < 0 || i >= S.evRows.length) return;
  S.insp = i;
  const r = S.evRows[i];
  let left = "", right = "";
  if (r.kind === "packet") {
    const total = r.layers.reduce((s, l) => s + l[1], 0);
    const cols = ["var(--node)", "var(--violet)", "var(--amber)", "var(--green)"];
    left += `<div class="layers">${r.layers.map((l, j) => `<div style="width:${l[1] / total * 100}%;background:${cols[j % 4]}"><span>${esc(l[0])}</span><span>${l[1]}</span></div>`).join("")}</div>`;
    left += r.groups.map(gp => `<div class="grp"><div class="gh">${esc(gp.name)}<span>${esc(gp.sum)}</span></div>${gp.fields.map(f => fieldHTML(f)).join("")}</div>`).join("");
    const bytes = r.hex.split(" ");
    let hx = "";
    for (let o = 0; o < bytes.length; o += 8) {
      const ch = bytes.slice(o, o + 8);
      hx += `<span class="o">${o.toString(16).padStart(4, "0")}</span><span>${ch.join(" ")}</span><span class="a">${ch.map(b => { const c = parseInt(b, 16); return c >= 32 && c < 127 ? esc(String.fromCharCode(c)) : "."; }).join("")}</span>`;
    }
    right = `<div class="where">BYTES · ${bytes.length} ${T("in this frame", "IN THIS FRAME")}</div><div class="hex">${hx}</div>`;
  } else {
    left = `<div class="where">${T("Where you'd see this", "FOUND IN")}: ${esc(r.src)}</div><div class="grp">${r.fields.map(f => fieldHTML(f)).join("")}</div>`;
    right = `<div class="where">${T("Raw", "RAW DATA")}</div><pre class="raw">${esc(r.raw)}</pre>`;
  }
  $("#insp").innerHTML = `<div class="insp sev-${r.sev}"><div class="ih"><span class="badge">${T("Evidence", "LOOT")} ${i + 1} · ${SEVL[r.sev]}</span><div class="it"><b title="${esc(r.title)}">${esc(r.title)}</b><span>${esc(r.t)} · ${esc(r.src)}</span></div>
    <button class="iconbtn" data-act="ip" title="Previous (←)" ${i === 0 ? "disabled" : ""}>‹</button><button class="iconbtn" data-act="in" title="Next (→)" ${i === S.evRows.length - 1 ? "disabled" : ""}>›</button><button class="iconbtn" data-act="ix" title="Close (Esc)">✕</button></div>
    <div class="ib"><div>${left}</div><div>${right}</div></div></div>`;
}
function fieldHTML(f) { return `<div class="fld"><span class="fn">${esc(f[0])}</span><span class="fv">${esc(f[1])}</span>${f[2] ? `<span class="fm">${esc(f[2])}</span>` : ""}</div>`; }
function closeInsp() { S.insp = -1; $("#insp").innerHTML = ""; }

/* ============================================================
   PLAYBACK ENGINE
   ============================================================ */
function stepMsgs() {
  const a = S.A, s = a.steps[S.step];
  if (S.blocked) { const m = (s.msgs.find(x => x.kind === "attack") || s.msgs[0]); return m ? [Object.assign({}, m, {blocked: true})] : []; }
  return s.msgs;
}
function cancelAnim() { $("#stage").classList.remove("flying"); S.token++; S.busy = false; S.timers.forEach(clearTimeout); S.timers = []; clearFx(); }
function rowsForStep(j, stop) {
  const a = S.A, s = a.steps[j], rows = {seq: [], ev: []};
  if (stop && stop.at - 1 === j) {
    const m = (s.msgs.find(x => x.kind === "attack") || s.msgs[0]);
    if (m) rows.seq.push({type: "msg", step: j, m: Object.assign({}, m, {blocked: true})});
    rows.seq.push({type: "call", step: j, text: "🛡 " + stop.short + " " + T("blocked it", "BLOCKED IT!"), good: true});
    rows.ev.push(stop.ev);
    return rows;
  }
  s.msgs.forEach(m => rows.seq.push({type: "msg", step: j, m}));
  if (s.callout) rows.seq.push({type: "call", step: j, text: s.callout});
  (s.evidence || []).forEach(e => rows.ev.push(e));
  nonstopAt(a, j).forEach(d => { rows.seq.push({type: "call", step: j, text: "🛡 " + d.short + " " + T("reduced the impact", "SHIELD UP!"), good: true}); rows.ev.push(d.ev); });
  return rows;
}
function compAfter(j) {
  const a = S.A, st = stopper(a), set = new Set();
  for (let i = 0; i <= j; i++) { if (st && i >= st.at - 1) break; (a.steps[i].compromise || []).forEach(id => set.add(id)); }
  return set;
}
function setHash(h) {
  S.curHash = h;
  try { if (location.hash !== "#" + h) location.replace("#" + h); } catch (e) {}
}
function toOverview(keepPlaying) {
  cancelAnim(); closeInsp(); setMood(null);
  S.phase = "overview"; S.step = -1; S.msgI = 0; S.blocked = null; S.evRows = []; S.seqRows = []; S.comp = new Set();
  if (!keepPlaying) S.playing = false;
  $("#banner").innerHTML = "";
  setHash(S.A.id);
  renderSide(); renderTiles(); renderInfo(); renderEv(); renderSeq(false); renderHud(); nodeStates(null); updateControls();
  camera([], false);
}
function goStep(i, opts) {
  opts = opts || {};
  if (S.mode !== "explore") return;
  const a = S.A; cancelAnim(); closeInsp(); setMood(null);
  $("#banner").innerHTML = "";
  const st = stopper(a);
  if (i < 0) return toOverview(true);
  if (i >= a.steps.length || (st && i > st.at - 1)) return finish();
  S.step = i; S.phase = "step"; S.msgI = 0;
  S.blocked = st && i === st.at - 1 ? st : null;
  S.evRows = []; S.seqRows = [];
  for (let j = 0; j < i; j++) { const r = rowsForStep(j, st); S.seqRows.push(...r.seq); S.evRows.push(...r.ev); }
  S.comp = i > 0 ? compAfter(i - 1) : new Set();
  setHash(a.id + "-" + (i + 1));
  const f = focusSet(a.steps[i]);
  renderSide(); renderTiles(); renderInfo(); renderEv(); renderSeq(false); renderHud(); nodeStates(f); updateControls();
  camera([...f], false);
  const p = prog(a); if (i + 1 > p.max) { const gained = i + 1 - p.max; p.max = i + 1; saveProg(); later(() => award(10 * gained, "XP", nodePos([...f][0])), dur(500)); }
  if (opts.animate === false) { S.msgI = stepMsgs().length; stepDone(S.token, true); return; }
  later(() => runMsgs(!!opts.single), Math.max(dur(450), RM ? 0 : 800));  // let the camera settle first
}
function runMsgs(single) {
  const tok = S.token; S.busy = true; updateControls();
  const list = stepMsgs(), a = S.A, s = a.steps[S.step];
  if (!list.length) {
    const where = (s.focus || [])[0] || (s.compromise || [])[0] || a.lanes[0];
    if (S.blocked) { showCallout("🛡 " + S.blocked.short + " " + T("blocked it", "BLOCKED IT!"), where, true); const p = nodePos(where); if (p) burst(p[0], p[1] - 40, 14, ["#3ddc97", "#7dff3a", "#29e7ff"], 60); setMood("dizzy", 2800); sfx("block"); }
    else if (s.callout) { showCallout(s.callout, where); S.seqRows.push({type: "call", step: S.step, text: s.callout}); renderSeq(true); }
    later(() => { if (tok === S.token) stepDone(tok); }, dur(1300));
    return;
  }
  const next = () => {
    if (tok !== S.token) return;
    if (S.msgI >= list.length) { stepDone(tok); return; }
    const m = list[S.msgI];
    wiN("msg");
    S.seqRows.push({type: "msg", step: S.step, m}); renderSeq(true);
    animateMsg(m, () => {
      if (tok !== S.token) return;
      S.msgI++; updateMsgCards(); wiN("msgDone");
      if (single && S.msgI < list.length) { S.busy = false; updateControls(); return; }
      later(next, dur(280));
    });
  };
  next();
}
function stepDone(tok, instant) {
  if (tok !== S.token) return;
  const a = S.A, s = a.steps[S.step], before = S.evRows.length;
  S.busy = false;
  if (S.blocked) {
    const d = S.blocked;
    if (instant) { const m = stepMsgs()[0]; if (m) S.seqRows.push({type: "msg", step: S.step, m}); }
    S.seqRows.push({type: "call", step: S.step, text: "🛡 " + d.short + " " + T("blocked it", "BLOCKED IT!"), good: true});
    S.evRows.push(d.ev);
    const p = prog(a); if (!p.blocks[d.id]) { p.blocks[d.id] = 1; saveProg(); const m = stepMsgs()[0]; award(150, "BLOCK", nodePos(m ? m.to : (s.focus || [])[0])); }
    $("#banner").innerHTML = `<div class="banner good">🛡 ${isPixel() ? "BLOCKED! " + esc(d.short.toUpperCase()) : "Blocked at step " + d.at + " by " + esc(d.short)}</div>`;
    renderEv(before); renderSeq(true); renderSide(); updateControls();
    if (S.playing) { if (window.WIG && WIG.guided()) { S.playing = false; updateControls(); } else later(() => { if (tok === S.token && S.playing) finish(); }, dur(2600)); }
    wiN("stepDone");
    return;
  }
  if (instant) { s.msgs.forEach(m => S.seqRows.push({type: "msg", step: S.step, m})); if (s.callout) S.seqRows.push({type: "call", step: S.step, text: s.callout}); }
  else if (s.callout && s.msgs.length) { S.seqRows.push({type: "call", step: S.step, text: s.callout}); }
  if (s.callout && s.msgs.length) showCallout(s.callout, (s.focus || [])[0] || (s.compromise || [])[0] || s.msgs[s.msgs.length - 1].to);
  (s.evidence || []).forEach(e => S.evRows.push(e));
  nonstopAt(a, S.step).forEach(d => {
    S.seqRows.push({type: "call", step: S.step, text: "🛡 " + d.short + " " + T("reduced the impact", "SHIELD UP!"), good: true});
    S.evRows.push(d.ev);
    const where = (s.compromise || [])[0] || (s.focus || [])[0] || a.lanes[0];
    showCallout("🛡 " + d.short, where, true);
    const pp = nodePos(where); if (pp && !instant) burst(pp[0], pp[1] - 30, 10, ["#3ddc97", "#29e7ff"], 50);
    const p = prog(a); if (!p.blocks[d.id]) { p.blocks[d.id] = 1; saveProg(); award(100, "SHIELD", pp); }
  });
  const newComp = (s.compromise || []).filter(id => !S.comp.has(id));
  (s.compromise || []).forEach(id => S.comp.add(id));
  if (newComp.length && !instant) {
    sfx("comp"); setMood("happy", 1800);
    newComp.forEach(id => { const p = nodePos(id); if (!p) return; burst(p[0], p[1] + 20, isPixel() ? 18 : 12, ["#ff3b4e", "#ff9a2e", "#ffe14a"], isPixel() ? 64 : 48); if (isPixel()) floatText(p[0], p[1] - 34, "PWNED!", "#ff3b4e"); });
  }
  nodeStates(focusSet(s));
  renderEv(before); renderSeq(!instant); renderSide(); updateControls();
  if (S.playing) { if (window.WIG && WIG.guided()) { S.playing = false; updateControls(); } else later(() => { if (tok === S.token && S.playing) goStep(S.step + 1); }, dur(2400)); }
  wiN("stepDone");
}
function finish() {
  const a = S.A; cancelAnim(); closeInsp();
  const st = stopper(a);
  S.phase = "done"; S.playing = false; S.blocked = st;
  S.evRows = []; S.seqRows = [];
  const last = st ? st.at - 1 : a.steps.length - 1;
  for (let j = 0; j <= last; j++) { const r = rowsForStep(j, st); S.seqRows.push(...r.seq); S.evRows.push(...r.ev); }
  S.comp = compAfter(a.steps.length - 1);
  setHash(a.id);
  const p = prog(a);
  $("#banner").innerHTML = st
    ? `<div class="banner good">${isPixel() ? "★ STAGE CLEAR ★" : "🛡 Attack stopped at step " + st.at}</div>`
    : `<div class="banner bad">${isPixel() ? "GAME OVER · TRY A POWER-UP" : "⚠ Attack succeeded: try switching on a defence"}</div>`;
  sfx(st ? "win" : "lose");
  renderSide(); renderTiles(); renderInfo(); renderEv(); renderSeq(false); renderHud(); nodeStates(null); updateControls();
  camera([], false);
  if (!p.done) { p.done = true; p.max = a.steps.length; saveProg(); award(100, "CLEAR", S.vb ? [S.vb[0] + S.vb[2] / 2, S.vb[1] + S.vb[3] / 2] : null); }
  later(() => { if (st) { confetti(); setMood("dizzy"); } else { flash(); setMood("happy"); } }, RM ? 0 : 450);
}
function updateControls() {
  queueMicrotask(() => wiN("controls"));
  const pb = $("#playBtn");
  if (S.mode === "analyst") {
    const k = S.kase, all = k && k.shown >= k.rows.length;
    pb.innerHTML = all ? `↺ ${T("New case", "NEW CASE")}` : S.playing ? `❚❚ ${T("Pause clues", "PAUSE")}` : `▶ ${T("Resume clues", "RESUME")}`;
    $("#prevBtn").disabled = true; $("#nextBtn").disabled = !!all; $("#stepBtn").disabled = !!all;
    $("#spdBtn").textContent = S.speed + "×";
    return;
  }
  pb.innerHTML = S.phase === "done" ? `↺ ${T("Replay", "RETRY")}` : S.playing ? `❚❚ ${T("Pause", "PAUSE")}` : `▶ ${S.phase === "overview" ? T("Play", "START") : T("Play", "PLAY")}`;
  $("#prevBtn").disabled = S.phase === "overview";
  $("#nextBtn").disabled = S.phase === "done";
  $("#stepBtn").disabled = S.phase === "done" || S.busy;
  $("#spdBtn").textContent = S.speed + "×";
  $("#defCount").textContent = S.A ? defsOn(S.A).length : 0;
}
/* controls */
function playPause() {
  if (S.mode === "analyst") { const k = S.kase; if (k && k.shown >= k.rows.length) return startCase(); S.playing = !S.playing; updateControls(); if (S.playing) later(nextClue, dur(300)); else { S.timers.forEach(clearTimeout); S.timers = []; } return; }
  if (S.phase === "done") { S.playing = true; toOverview(true); later(() => goStep(0), dur(400)); updateControls(); return; }
  if (S.playing) { S.playing = false; updateControls(); return; }
  S.playing = true; updateControls();
  if (S.phase === "overview") return goStep(0);
  if (S.busy) return;
  if (S.msgI < stepMsgs().length) runMsgs(false);
  else if (S.blocked) finish();
  else goStep(S.step + 1);
}
function nextStep() {
  if (S.mode === "analyst") return nextClue(true);
  if (S.phase === "overview") return goStep(0);
  if (S.phase === "done") return;
  if (S.blocked) return finish();
  goStep(S.step + 1);
}
function prevStep() {
  if (S.mode === "analyst") return;
  if (S.phase === "overview") return;
  if (S.phase === "done") { const st = stopper(S.A); return goStep(st ? st.at - 1 : S.A.steps.length - 1); }
  if (S.step <= 0) return toOverview(false);
  goStep(S.step - 1);
}
function singleStep() {
  if (S.mode === "analyst") return nextClue(true);
  S.playing = false; updateControls();
  if (S.busy || S.phase === "done") return;
  if (S.phase === "overview") return goStep(0, {single: true});
  if (S.msgI < stepMsgs().length) return runMsgs(true);
  if (S.blocked) return finish();
  goStep(S.step + 1, {single: true});
}
function loadAttack(id, opts) {
  opts = opts || {};
  if (S.mode === "analyst") leaveAnalyst();
  const a = ATT.find(x => x.id === id) || ATT[0];
  S.A = a; store.set(K.last, a.id);
  cancelAnim(); buildStage();
  toOverview(false);
  camera([], true);
  if (opts.closeDrawer) $("#side").classList.remove("open");
  if (opts.step !== undefined) goStep(opts.step);
}

/* ============================================================
   ANALYST MODE — solve a mystery case from the evidence alone
   ============================================================ */
const GENERIC = new Set(["T1078", "T1557"]);
const tBase = m => m.split(" ")[0].split(".")[0];
function buildQuestions(a) {
  const q1 = shuffle([a, ...shuffle(ATT.filter(x => x.id !== a.id)).slice(0, 3)]).map(x => ({id: x.id, label: x.name, sub: x.sub, ok: x.id === a.id}));
  const mine = a.mitre.filter(m => !GENERIC.has(tBase(m)));
  const pick = mine.length ? mine : a.mitre;
  const right = pick[Math.floor(Math.random() * pick.length)];
  const myBases = new Set(a.mitre.map(tBase));
  const pool = [...new Set(ATT.filter(x => x.id !== a.id).flatMap(x => x.mitre))].filter(m => !myBases.has(tBase(m)) && !GENERIC.has(tBase(m)));
  const q2 = shuffle([right, ...shuffle(pool).slice(0, 3)]).map(m => ({id: m, label: m, ok: m === right}));
  const minAt = Math.min(...a.defences.filter(d => d.stops !== false).map(d => d.at));
  const q3 = shuffle(a.defences).map(d => ({id: d.id, label: d.name, ok: d.stops !== false && d.at === minAt, d}));
  return [q1, q2, q3];
}
function startCase() {
  if (S.mode === "explore") S.lastExplore = S.A ? S.A.id : null;
  cancelAnim(); closeInsp(); closeMenus(); setMood(null);
  const prev = S.kase ? S.kase.a.id : (S.A ? S.A.id : "");
  // deal cases from a shuffled deck so every attack comes up before any repeats
  if (!S.caseBag || !S.caseBag.length) { S.caseBag = shuffle(ATT.map(x => x.id)); if (S.caseBag.length > 1 && S.caseBag[S.caseBag.length - 1] === prev) S.caseBag.unshift(S.caseBag.pop()); }
  const nextId = S.caseBag.pop(), a = ATT.find(x => x.id === nextId) || ATT[0];
  const rows = a.steps.flatMap(s => s.evidence || []);
  const stats = store.get(K.ana, {played: 0, solved: 0, best: 0});
  S.mode = "analyst"; S.A = a; S.playing = true; S.phase = "case"; S.step = -1;
  S.kase = {a, rows, shown: 0, n: stats.played + 1, ans: {}, pts: 0, q: buildQuestions(a), done: false, blips: []};
  S.evRows = [];
  $("#app").classList.add("ana"); $("#banner").innerHTML = "";
  renderTheme(); renderSide(); renderTiles(); renderHud(); renderInfo(); renderEv(); updateControls(); renderCase();
  later(() => nextClue(false), dur(700));
}
function nextClue(manual) {
  const k = S.kase; if (!k || S.mode !== "analyst") return;
  if (manual) { S.timers.forEach(clearTimeout); S.timers = []; }
  if (k.shown >= k.rows.length) return;
  const before = k.shown; k.shown++;
  k.blips.push([18 + Math.random() * 64, 18 + Math.random() * 64]);
  S.evRows = k.rows.slice(0, k.shown);
  renderEv(before); renderCase(true); sfx("clue"); updateControls(); refreshCaseHeader();
  if (S.playing && k.shown < k.rows.length && k.ans[0] === undefined) later(() => nextClue(false), dur(4200));
}
function revealAll() {
  const k = S.kase; const before = k.shown;
  while (k.shown < k.rows.length) { k.shown++; k.blips.push([18 + Math.random() * 64, 18 + Math.random() * 64]); }
  S.evRows = k.rows.slice(); if (k.shown > before) { renderEv(before); renderCase(true); }
  S.timers.forEach(clearTimeout); S.timers = []; updateControls();
}
function answer(qi, id) {
  const k = S.kase; if (!k || k.ans[qi] !== undefined || (qi > 0 && k.ans[0] === undefined)) return;
  const opt = k.q[qi].find(o => o.id === id); if (!opt) return;
  k.ans[qi] = id;
  let pts = 0;
  if (opt.ok) pts = qi === 0 ? 100 + 40 * (k.rows.length - k.shown) : 100;
  k.pts += pts;
  if (pts) award(pts, qi === 0 ? "SOLVED" : "CORRECT");
  sfx(opt.ok ? "win" : "lose");
  if (qi === 0) { k.ansShown0 = k.shown; revealAll(); }
  if (Object.keys(k.ans).length === 3 && !k.done) {
    k.done = true;
    const stats = store.get(K.ana, {played: 0, solved: 0, best: 0});
    stats.played++; if (k.q[0].find(o => o.id === k.ans[0]).ok) stats.solved++; stats.best = Math.max(stats.best, k.pts);
    store.set(K.ana, stats); updateControls();
  }
  renderCaseInfo(true); refreshCaseHeader();
}
function leaveAnalyst() {
  cancelAnim(); closeInsp();
  S.mode = "explore"; S.kase = null; S.playing = false;
  $("#app").classList.remove("ana"); $("#case").innerHTML = "";
  renderTheme();
}
function exitAnalyst(toId) {
  const id = toId || S.lastExplore || store.get(K.last, ATT[0].id);
  leaveAnalyst();
  loadAttack(id);
}
function caseHeader() {
  const k = S.kase, stats = store.get(K.ana, {played: 0, solved: 0, best: 0});
  return `<span class="h">${T("Case", "CASE")} #${String(k.n).padStart(3, "0")}</span><span class="tag">${T("Unknown activity · Contoso", "INTRUDER ALERT")}</span><span class="sp"></span><span class="tag">${T("Solved", "SOLVED")} ${stats.solved}/${stats.played} · ${T("best", "BEST")} ${stats.best}</span><button class="back" data-act="exitAna">✕ ${T("Exit", "EXIT")}</button>`;
}
function refreshCaseHeader() { const h = document.querySelector("#case .case-h"); if (h) h.innerHTML = caseHeader(); const f = document.querySelector("#case .case-f"); if (f) f.innerHTML = caseFooter(); }
function caseFooter() {
  const k = S.kase, all = k.shown >= k.rows.length;
  return `<span>${T("Clues", "CLUES")} <b>${k.shown}/${k.rows.length}</b></span><span class="sp"></span>${k.ans[0] === undefined ? `<span class="muted">${T("Answer early for bonus points", "EARLY ANSWER = BONUS")}: +${40 * (k.rows.length - k.shown)}</span>` : ""}${all ? "" : `<button class="btn" data-act="clue">${T("Next clue now", "NEXT CLUE")} ▶</button>`}`;
}
function renderCase(newClue) {
  const k = S.kase; if (!k) return;
  const feed = k.rows.slice(0, k.shown).map((r, i) => ({r, i})).reverse().map(({r, i}) => `<button class="clue sev-${r.sev} ${newClue && i === k.shown - 1 ? "new" : ""}" data-ev="${i}"><span class="badge">${SEVL[r.sev]}</span><span class="ct">${esc(r.title)}</span><span class="cs">${esc(r.t)} · ${esc(r.src)}</span></button>`).join("");
  const blips = k.blips.map((b, i) => { const r = k.rows[i]; return `<span class="blip sev-${r ? r.sev : "info"}" style="left:${b[0]}%;top:${b[1]}%"></span>`; }).join("");
  $("#case").innerHTML = `<div class="case">
    <div class="case-h">${caseHeader()}</div>
    <div class="case-b"><div class="radar-wrap"><div class="radar">${blips}</div><div class="radar-cap">${T("Click a clue to inspect it", "CLICK A CLUE TO INSPECT")}</div></div>
      <div class="feed">${feed || `<div class="empty">${T("Listening for the first alert…", "SCANNING…")}</div>`}</div></div>
    <div class="case-f">${caseFooter()}</div></div>`;
}
/* plain-English feedback for analyst answers */
function anaExplain(k, qi, ans, ok) {
  const a = k.a, X = window.TELLS || {}, TX = window.TECHS || {};
  const code = m => m.split(" ")[0];
  const why = (h, body) => `<div class="why"><b>${h}</b> ${body}</div>`;
  if (qi === 0) {
    let h = `<b class="h2">${ok ? T("Correct", "NAILED IT") : T("Not this time", "MISSED")}${ok ? ` · +${100 + 40 * (k.rows.length - k.ansShown0)}` : ""}</b>${T("It was", "IT WAS")} <b>${esc(a.name)}</b>: ${esc(a.summary)}`;
    if (X[a.id]) h += why(T("The giveaways:", "THE GIVEAWAYS:"), esc(X[a.id]));
    if (!ok) { const p = ATT.find(x => x.id === ans); if (p && X[p.id]) h += why(`${T("If it had been", "IF IT WAS")} ${esc(p.name)}${T(", you'd expect:", ":")}`, esc(X[p.id])); }
    return h;
  }
  if (qi === 1) {
    const right = k.q[1].find(o => o.ok).id, owners = m => ATT.filter(x => x.mitre.includes(m)).map(x => x.name);
    let h = `<b class="h2">${ok ? T("Correct · +100", "CORRECT · +100") : T("Not quite", "MISSED")}</b><b>${esc(right)}</b> ${T("is part of this attack.", "BELONGS TO THIS ATTACK.")}`;
    if (TX[code(right)]) h += why(T("What it means:", "MEANING:"), esc(TX[code(right)]));
    if (!ok) {
      const own = owners(ans);
      h += why(`${T("You picked", "YOU PICKED")} ${esc(ans)}:`, esc(TX[code(ans)] || "") + (own.length ? ` ${T("You'd see that in", "SEEN IN")} ${esc(own.join(" and "))}, ${T("not this attack.", "NOT HERE.")}` : ""));
    }
    return h;
  }
  const best = k.q[2].filter(o => o.ok), pick = k.q[2].find(o => o.id === ans).d;
  const st = n => a.steps[n - 1] ? a.steps[n - 1].title : "";
  let h = `<b class="h2">${ok ? T("Correct · +100", "CORRECT · +100") : T("Not quite", "MISSED")}</b>${T("Earliest stop", "EARLIEST STOP")}: <b>${esc(best.map(o => o.label).join(" or "))}</b>, ${T("at step", "STEP")} ${best[0].d.at} (${esc(st(best[0].d.at))}).`;
  h += why(T("How it works:", "HOW:"), esc(best[0].d.desc));
  if (!ok) {
    if (pick.stops === false) h += why(`${T("Why not", "WHY NOT")} ${esc(pick.name)}?`, `${T("It doesn't break the chain. It only reduces the damage:", "IT ONLY SHIELDS YOU:")} ${esc(pick.result)}`);
    else h += why(`${T("Why not", "WHY NOT")} ${esc(pick.name)}?`, `${T("It does stop the attack, but later, at step", "IT STOPS IT LATER, AT STEP")} ${pick.at} (${esc(st(pick.at))}). ${T("By then the attacker has already got further, so there's more to clean up. Earliest wins.", "EARLIEST WINS.")}`);
  }
  return h;
}
function renderCaseInfo(keepScroll) {
  const k = S.kase, box2 = $("#info"), top = box2.scrollTop;
  const qs = [
    [T("What's the attack?", "WHAT'S THE ATTACK?"), T("Answer before all the clues are in for bonus points.", "FASTER = MORE POINTS.")],
    [T("Which ATT&CK technique is part of it?", "WHICH ATT&CK TECHNIQUE?"), T("All the clues are in now.", "ALL CLUES IN.")],
    [T("Which defence stops it earliest?", "WHICH POWER-UP STOPS IT FIRST?"), T("Some defences only reduce the damage.", "SOME ONLY SHIELD YOU.")]
  ];
  const qHTML = (qi) => {
    const ans = k.ans[qi], locked = qi > 0 && k.ans[0] === undefined;
    const opts = k.q[qi].map(o => {
      let cls = "", tag = "";
      if (ans !== undefined) {
        if (o.ok) cls = "ok"; else if (o.id === ans) cls = "bad";
        if (qi === 2) tag = `<span class="qx">${o.d.stops === false ? T("reduces impact only", "SHIELD ONLY") : T("acts at step ", "STEP ") + o.d.at}</span>`;
      }
      return `<button class="qopt ${cls}" data-ans="${qi}|${esc(o.id)}" ${ans !== undefined || locked ? "disabled" : ""}>${tag}${esc(o.label)}${qi === 0 && o.sub ? `<small>${esc(o.sub)}</small>` : ""}</button>`;
    }).join("");
    let after = "";
    if (ans !== undefined) {
      const ok = k.q[qi].find(o => o.id === ans).ok;
      after = `<div class="box ${ok ? "good" : "bad"}">${anaExplain(k, qi, ans, ok)}</div>`;
    }
    return `<div class="qsec ${locked ? "locked" : ""}"><div class="kick">${qi + 1}. ${qs[qi][0]}</div><div class="muted qhint">${qs[qi][1]}</div>${opts}${after}</div>`;
  };
  const done = k.done ? `<div class="box good"><b class="h2">${T("Case closed", "CASE CLOSED")}</b>${T("You scored", "SCORE")} <b>${k.pts}</b> ${T("points on this case.", "POINTS")}</div>
      <div class="row"><button class="btn pri" data-act="watch">▶ ${T("Watch the replay", "WATCH REPLAY")}</button><button class="btn" data-act="newcase">${T("Next case", "NEXT CASE")} ▶</button></div>` : "";
  box2.innerHTML = `<div class="ph"><span class="h">${T("Analyst mode", "DETECTIVE MODE")}</span><button class="back" data-act="exitAna">✕ ${T("Exit", "EXIT")}</button></div>
    <div class="ib2 ${keepScroll ? "" : "fx-in"}"><p class="para">${T("Something is happening at Contoso. Alerts and logs are arriving one at a time. Work out what's going on from the evidence alone.", "SOMETHING IS ATTACKING CONTOSO. READ THE CLUES. NAME THE ATTACK.")}</p>
    ${qHTML(0)}${qHTML(1)}${qHTML(2)}${done}</div>`;
  box2.scrollTop = keepScroll ? top : 0;
}

/* ============================================================
   REVISION CARD + ABOUT
   ============================================================ */
function cardData(a) {
  const stops = a.defences.filter(d => d.stops !== false).sort((x, y) => x.at - y.at);
  const keyEv = a.steps.flatMap(s => s.evidence || []).filter(e => e.sev === "high").slice(0, 4);
  return {stops, keyEv};
}
function openCard() {
  const a = S.A; if (!a) return;
  const {stops, keyEv} = cardData(a);
  const softs = a.defences.filter(d => d.stops === false);
  $("#modal").innerHTML = `<div class="scrim" data-act="closeModal"><div class="modal wide"><div class="mh"><span class="h">${T("Revision card", "CHEAT SHEET")}</span><button class="iconbtn" data-act="closeModal">✕</button></div>
    <div class="rcard" id="rcard">
      <div class="rc-top"><div><div class="rc-kick">${esc(CATS.find(c => c[0] === a.cat)[1])} · ${esc(a.severity)}</div><div class="rc-title">${esc(a.name)}</div><div class="rc-sub">${esc(a.sub)}</div></div><div class="rc-brand">BREACHWALK · BY DEAN BAKER</div></div>
      <p class="rc-sum">${esc(a.summary)}</p>
      <div class="rc-grid">
        <div><h4>The chain</h4><ol>${a.steps.map(s => `<li><b>${esc(s.title)}</b> <span>${esc(PH[s.ph - 1])}</span></li>`).join("")}</ol></div>
        <div><h4>Evidence to look for</h4><ul>${keyEv.map(e => `<li>${esc(e.title)} <span>(${esc(e.src)})</span></li>`).join("")}</ul></div>
        <div><h4>How to detect it</h4><ul>${a.debrief.detect.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div><h4>Defences that stop it</h4><ul>${stops.map(d => `<li><b>${esc(d.name)}</b> <span>step ${d.at}</span></li>`).join("")}${softs.map(d => `<li>${esc(d.name)} <span>reduces impact</span></li>`).join("")}</ul></div>
      </div>
      <div class="rc-foot"><span><b>ATT&amp;CK:</b> ${a.mitre.map(m => esc(m.split(" ")[0])).join(", ")}</span></div>
    </div>
    <div class="rc-actions"><button class="btn pri" data-act="print" ${FRAMED ? "disabled" : ""}>🖨 ${T("Print / save as PDF", "PRINT")}</button><button class="btn" data-act="copycard">📋 ${T("Copy as text", "COPY TEXT")}</button>${FRAMED ? `<span class="muted small">${T("Printing works on your hosted copy; copying works everywhere.", "PRINT WORKS ON YOUR HOSTED COPY.")}</span>` : ""}</div>
  </div></div>`;
}
function cardText(a) {
  const {stops, keyEv} = cardData(a);
  const L = [`${a.name.toUpperCase()}: ${a.sub}`, `${a.severity} · ${CATS.find(c => c[0] === a.cat)[1]}`, "", a.summary, "", "THE CHAIN"];
  a.steps.forEach((s, i) => L.push(`${i + 1}. ${s.title} (${PH[s.ph - 1]})`));
  L.push("", "EVIDENCE TO LOOK FOR"); keyEv.forEach(e => L.push(`- ${e.title} (${e.src})`));
  L.push("", "HOW TO DETECT IT"); a.debrief.detect.forEach(x => L.push(`- ${x}`));
  L.push("", "DEFENCES THAT STOP IT"); stops.forEach(d => L.push(`- ${d.name} (step ${d.at})`)); a.defences.filter(d => d.stops === false).forEach(d => L.push(`- ${d.name} (reduces impact)`));
  L.push("", `ATT&CK: ${a.mitre.join("; ")}`, "", "Breachwalk by Dean Baker · © 2026 Dean Baker");
  return L.join("\n");
}
function printCard() {
  if (FRAMED) return toast("Printing works on your hosted copy");
  document.body.classList.add("printing");
  const off = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", off); };
  window.addEventListener("afterprint", off);
  try { window.print(); } catch (e) { toast("Printing isn't available here"); }
  setTimeout(off, 1500);
}
function openAbout() {
  const nD = ATT.reduce((s, a) => s + a.defences.length, 0), nQ = Object.values(QUERIES).reduce((s, o) => s + Object.keys(o).length, 0);
  $("#modal").innerHTML = `<div class="scrim" data-act="closeModal"><div class="modal"><div class="mh"><span class="h">${T("About", "ABOUT")}</span><button class="iconbtn" data-act="closeModal">✕</button></div>
    <div class="about"><div class="ab-brand">BREACH<i>WALK</i></div><div class="ab-by">Made by Dean Baker</div>
      <p>Watch real-world attacks play out step by step, see the evidence a SOC analyst would see, and switch on defences to find exactly where each one breaks the chain.</p>
      <ul><li><b>${ATT.length}</b> attacks, <b>${nD}</b> defences and <b>${nQ}</b> example detection queries (Microsoft KQL and CrowdStrike CQL)</li>
        <li><b>Analyst mode:</b> solve mystery cases from the evidence alone</li>
        <li>Plain-English explanations for every step, with the technical detail one click away</li>
        <li>MITRE ATT&amp;CK techniques for every attack</li>
        <li>Three looks: simple dark, simple light and pixel arcade</li></ul>
      <p class="muted small">Part of Walking <i class="itr">IT</i>, alongside Ticketwalk, Cloudwalk and Packetwalk. Every company, person, IP address and domain in the scenarios is made up, using documentation IP ranges and example domains. Detection queries are examples to adapt and test, not production rules. © 2026 Dean Baker. All rights reserved. Not affiliated with MITRE, Microsoft, CrowdStrike or any other vendor mentioned.</p>
      <div class="row"><button class="btn pri" data-act="closeModal">${T("Got it", "OK!")}</button><button class="btn" data-act="keysFromAbout">⌨ ${T("Shortcuts", "CONTROLS")}</button></div></div></div></div>`;
}

/* ============================================================
   MENUS, PALETTE, SHORTCUTS
   ============================================================ */
function closeMenus() { ["#themeMenu", "#defMenu", "#spdMenu"].forEach(s => $(s).innerHTML = ""); }
function themeMenu() {
  if ($("#themeMenu").innerHTML) return closeMenus();
  closeMenus();
  $("#themeMenu").innerHTML = `<div class="menu">${THEMES.map(([k, l, c]) => `<button data-theme-set="${k}" class="${S.theme === k ? "on" : ""}"><span class="sw" style="background:${c}"></span>${l}${S.theme === k ? " ✓" : ""}</button>`).join("")}</div>`;
}
function setTheme(k) {
  S.theme = k; store.set(K.theme, k); closeMenus(); renderTheme();
  if (k === "pixel") toast("INSERT COIN · PIXEL MODE");
  if (S.mode === "analyst") { renderCase(); renderInfo(); renderEv(); renderSide(); renderTiles(); updateControls(); return; }
  const keep = {phase: S.phase, step: S.step};
  buildStage();
  if (keep.phase === "overview") toOverview(false);
  else if (keep.phase === "done") finish();
  else goStep(keep.step, {animate: false});
  camera(keep.phase === "step" ? [...focusSet(S.A.steps[S.step])] : [], true);
}
function defMenu() {
  if (S.mode !== "explore") return;
  if ($("#defMenu").innerHTML) return closeMenus();
  closeMenus();
  $("#defMenu").innerHTML = `<div class="menu" style="width:340px;left:auto;right:0"><div class="kick" style="padding:4px 6px 0">${T("Switch on, then replay", "EQUIP, THEN RETRY")}</div>${defsHTML(S.A)}</div>`;
}
function spdMenu() {
  if ($("#spdMenu").innerHTML) return closeMenus();
  closeMenus();
  $("#spdMenu").innerHTML = `<div class="menu" style="min-width:120px;bottom:calc(100% + 6px);top:auto">${SPEEDS.map(s => `<button data-spd="${s}" class="${S.speed === s ? "on" : ""}">${s}×</button>`).join("")}</div>`;
}
function toggleDef(id) {
  const a = S.A; if (!S.defs[a.id] || typeof S.defs[a.id] !== "object") S.defs[a.id] = {};
  S.defs[a.id][id] = !S.defs[a.id][id]; store.set(K.defs, S.defs);
  const d = a.defences.find(x => x.id === id);
  const on = S.defs[a.id][id];
  toast(on ? T(`${d.short} on. Press Play to replay`, `${d.short.toUpperCase()} EQUIPPED!`) : T(`${d.short} off`, `${d.short.toUpperCase()} REMOVED`));
  const menuOpen = !!$("#defMenu").innerHTML;
  toOverview(false);
  if (menuOpen) { $("#defMenu").innerHTML = ""; defMenu(); }
}
function setSpeed(s) { S.speed = s; store.set(K.speed, s); closeMenus(); updateControls(); }
function cycleSpeed(dir) { const i = SPEEDS.indexOf(S.speed); setSpeed(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i + dir))]); }
function setView(v) {
  S.view = v; store.set(K.view, v);
  $("#stage").classList.toggle("seqv", v === "seq");
  $("#vNet").classList.toggle("on", v === "net"); $("#vSeq").classList.toggle("on", v === "seq");
  if (!S.A || S.mode !== "explore") return;
  if (v === "seq") renderSeq(false); else camera(S.phase === "step" ? [...focusSet(S.A.steps[S.step])] : [], true);
}
let palSel = 0, palItems = [];
function openPalette() {
  $("#modal").innerHTML = `<div class="scrim" data-act="closeModal"><div class="modal pal"><input id="palIn" placeholder="${T("Search attacks, steps or ATT&CK IDs…", "SEARCH STAGES…")}" autocomplete="off"><div class="pres" id="pres"></div></div></div>`;
  const inp = $("#palIn"); inp.focus(); palSel = 0; palSearch("");
  inp.oninput = () => { palSel = 0; palSearch(inp.value); };
}
function palSearch(q) {
  q = q.trim().toLowerCase(); palItems = [];
  if (!q || "analyst mode detective case".includes(q)) palItems.push({ana: true, k: T("Analyst mode", "DETECTIVE"), t: T("Solve a mystery case", "SOLVE A CASE"), d: T("Evidence only", "CLUES ONLY")});
  ATT.forEach(a => {
    const hay = (a.name + " " + a.sub + " " + a.mitre.join(" ") + " " + a.summary).toLowerCase();
    if (!q || hay.includes(q)) palItems.push({a: a.id, step: -1, k: a.name, t: a.sub, d: CATS.find(c => c[0] === a.cat)[1]});
    if (q) a.steps.forEach((s, i) => { if ((s.title + " " + s.sub + " " + s.tactic + " " + s.text).toLowerCase().includes(q)) palItems.push({a: a.id, step: i, k: a.name + " · " + (i + 1), t: s.title, d: s.sub}); });
  });
  palItems = palItems.slice(0, 40);
  $("#pres").innerHTML = palItems.length ? palItems.map((p, i) => `<button class="${i === palSel ? "on" : ""}" data-pi="${i}"><span class="pk">${esc(p.k)}</span><span><span class="pt">${esc(p.t)}</span> <span class="pd">— ${esc(p.d)}</span></span></button>`).join("") : `<div class="empty">${T("No matches.", "NOTHING FOUND")}</div>`;
  const on = $("#pres .on"); if (on) on.scrollIntoView({block: "nearest"});
}
function palGo(i) {
  const p = palItems[i]; if (!p) return;
  closeModal();
  if (p.ana) return startCase();
  if (S.mode !== "explore" || !S.A || S.A.id !== p.a) loadAttack(p.a, {closeDrawer: true});
  if (p.step >= 0) goStep(p.step);
}
function openKeys() {
  const rows = (h, list) => `<h4>${h}</h4>` + list.map(([k, d]) => `<div><span>${d}</span><span>${k.split(" ").map(x => `<kbd>${x}</kbd>`).join(" ")}</span></div>`).join("");
  $("#modal").innerHTML = `<div class="scrim" data-act="closeModal"><div class="modal"><div class="mh"><span class="h">${T("Keyboard shortcuts", "CONTROLS")}</span><button class="iconbtn" data-act="closeModal">✕</button></div><div class="keys">
    <div style="display:block">${rows("Playback", [["Space", "Play or pause"], ["→", "Next step / next clue"], ["←", "Previous step"], ["S", "One message at a time"], ["1 – 9", "Go to step"], ["[ ]", "Slower / faster"], ["Esc", "Back to overview"]])}${rows("Modes", [["A", "Analyst mode"], ["B", "Defences"]])}</div>
    <div style="display:block">${rows("View", [["V", "Network / sequence"], ["D", "Diagram only"], ["L", "Show / hide the list"], ["F", "Fullscreen"], ["T", "Change theme"]])}${rows("Find", [["Ctrl K", "Search"], ["N P", "Next / previous attack"], ["?", "These shortcuts"]])}${rows("Evidence inspector", [["← →", "Previous / next item"], ["Esc", "Close it"]])}</div>
  </div></div></div>`;
}
function closeModal() { $("#modal").innerHTML = ""; }
function reframe() { setTimeout(() => { if (!S.A || S.mode !== "explore") return; camera(S.phase === "step" ? [...focusSet(S.A.steps[S.step])] : [], false); if (S.view === "seq") renderSeq(false); }, 60); }
function toggleList() {
  if (window.innerWidth <= 1050) { $("#side").classList.toggle("open"); return; }
  $("#app").classList.toggle("nolist"); $("#menuBtn").classList.toggle("on", !$("#app").classList.contains("nolist"));
  reframe();
}
function toggleDia() { $("#app").classList.toggle("dia"); $("#diaBtn").classList.toggle("on", $("#app").classList.contains("dia")); reframe(); }
function fullscreen() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => toast("Fullscreen isn't available here")); } catch (e) { toast("Fullscreen isn't available here"); } }
function toggleAnalyst() { if (S.mode === "analyst") exitAnalyst(); else startCase(); }

/* ============================================================
   EVENTS
   ============================================================ */
document.addEventListener("click", e => {
  if (AC && AC.state === "suspended") { try { AC.resume(); } catch (er) {} }
  const t = e.target.closest("[data-act],[data-a],[data-cat],[data-step],[data-def],[data-theme-set],[data-spd],[data-pi],[data-ev],[data-ans],[data-qtab]");
  if (!e.target.closest(".dd")) closeMenus();
  if ($("#side").classList.contains("open") && !e.target.closest("#side") && !e.target.closest("#menuBtn")) $("#side").classList.remove("open");
  if (!t) return;
  if (t.dataset.a) return loadAttack(t.dataset.a, {closeDrawer: true});
  if (t.dataset.cat) { S.cat = t.dataset.cat; return renderSide(); }
  if (t.dataset.step !== undefined && t.closest(".steps")) return goStep(+t.dataset.step);
  if (t.dataset.def) return toggleDef(t.dataset.def);
  if (t.dataset.themeSet) return setTheme(t.dataset.themeSet);
  if (t.dataset.spd) return setSpeed(+t.dataset.spd);
  if (t.dataset.pi !== undefined) return palGo(+t.dataset.pi);
  if (t.dataset.ev !== undefined) return openInsp(+t.dataset.ev);
  if (t.dataset.ans) { const [qi, ...rest] = t.dataset.ans.split("|"); return answer(+qi, rest.join("|")); }
  if (t.dataset.qtab) { S.qtab = t.dataset.qtab; S.qopen = true; return refreshQ(); }
  const act = t.dataset.act;
  if (act === "closeModal") { if (e.target === t || t.classList.contains("iconbtn") || t.classList.contains("btn")) closeModal(); return; }
  if (act === "play") { S.playing = true; updateControls(); return goStep(0); }
  if (act === "overview") return toOverview(false);
  if (act === "next") return nextStep();
  if (act === "replay") return playPause();
  if (act === "nextAttack") { const i = ATT.indexOf(S.A); return loadAttack(ATT[(i + 1) % ATT.length].id); }
  if (act === "ip") return openInsp(S.insp - 1);
  if (act === "in") return openInsp(S.insp + 1);
  if (act === "ix") return closeInsp();
  if (act === "exitAna") return exitAnalyst();
  if (act === "newcase") return startCase();
  if (act === "watch") { const id = S.kase.a.id; exitAnalyst(id); S.playing = true; updateControls(); return goStep(0); }
  if (act === "clue") return nextClue(true);
  if (act === "card") return openCard();
  if (act === "print") return printCard();
  if (act === "copycard") return copyText(cardText(S.A), "Revision card copied");
  if (act === "qcopy") { const q = $("#qtext"); return q && copyText(q.textContent, "Query copied"); }
  if (act === "copylink") return copyText(location.href, "Link copied");
  if (act === "keysFromAbout") return openKeys();
});
document.addEventListener("toggle", e => { if (!e.target.classList) return; if (e.target.classList.contains("qbox")) S.qopen = e.target.open; if (e.target.classList.contains("tech")) { S.techOpen = e.target.open; store.set(K.tech, S.techOpen); } }, true);
$("#playBtn").onclick = playPause; $("#nextBtn").onclick = nextStep; $("#prevBtn").onclick = prevStep; $("#stepBtn").onclick = singleStep;
$("#resetBtn").onclick = () => S.mode === "analyst" ? startCase() : toOverview(false);
$("#spdBtn").onclick = spdMenu; $("#themeBtn").onclick = themeMenu; $("#defBtn").onclick = defMenu;
$("#vNet").onclick = () => setView("net"); $("#vSeq").onclick = () => setView("seq");
$("#searchBtn").onclick = openPalette; $("#keysBtn").onclick = openKeys; $("#menuBtn").onclick = toggleList;
$("#diaBtn").onclick = toggleDia; $("#fsBtn").onclick = fullscreen; $("#anaBtn").onclick = toggleAnalyst; $("#aboutBtn").onclick = openAbout;
$("#sndBtn").onclick = () => { S.sound = !S.sound; store.set(K.sound, S.sound); renderTheme(); if (S.sound) sfx("win"); };
document.addEventListener("keydown", e => {
  const tg = (e.target.tagName || "").toUpperCase();
  if ($("#modal").innerHTML) {
    if (e.key === "Escape") return closeModal();
    if ($("#palIn")) {
      if (e.key === "ArrowDown") { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); palSearch($("#palIn").value); }
      else if (e.key === "ArrowUp") { e.preventDefault(); palSel = Math.max(0, palSel - 1); palSearch($("#palIn").value); }
      else if (e.key === "Enter") { e.preventDefault(); palGo(palSel); }
    }
    return;
  }
  if (tg === "INPUT" || tg === "TEXTAREA" || e.altKey) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); return openPalette(); }
  if (e.ctrlKey || e.metaKey) return;
  const k = e.key, l = k.toLowerCase();
  if (S.insp >= 0) {
    if (k === "Escape") return closeInsp();
    if (k === "ArrowLeft") return openInsp(S.insp - 1);
    if (k === "ArrowRight") return openInsp(S.insp + 1);
  }
  if (k === " ") { e.preventDefault(); return playPause(); }
  if (k === "ArrowRight") { e.preventDefault(); return nextStep(); }
  if (k === "ArrowLeft") { e.preventDefault(); return prevStep(); }
  if (k === "Escape") { closeMenus(); $("#side").classList.remove("open"); return S.mode === "analyst" ? null : toOverview(false); }
  if (l === "a") return toggleAnalyst();
  if (l === "s") return singleStep();
  if (/^[1-9]$/.test(k)) { const i = +k - 1; if (S.mode === "explore" && S.A && i < S.A.steps.length) goStep(i); return; }
  if (k === "[") return cycleSpeed(-1);
  if (k === "]") return cycleSpeed(1);
  if (l === "v") return setView(S.view === "net" ? "seq" : "net");
  if (l === "d") return toggleDia();
  if (l === "l") return toggleList();
  if (l === "f") return fullscreen();
  if (l === "t") { const i = THEMES.findIndex(x => x[0] === S.theme); return setTheme(THEMES[(i + 1) % THEMES.length][0]); }
  if (l === "b") return defMenu();
  if (l === "n" || l === "p") { const i = Math.max(0, ATT.indexOf(S.A)); return loadAttack(ATT[(i + (l === "n" ? 1 : ATT.length - 1)) % ATT.length].id); }
  if (k === "?" || k === "/") { e.preventDefault(); return k === "/" ? openPalette() : openKeys(); }
});
let rsz;
window.addEventListener("resize", () => { clearTimeout(rsz); rsz = setTimeout(() => { if (!S.A || S.mode !== "explore") return; camera(S.phase === "step" ? [...focusSet(S.A.steps[S.step])] : [], true); if (S.view === "seq") renderSeq(false); }, 120); });

/* ============================================================
   ROUTING: #sqli opens an attack, #sqli-3 opens step 3
   ============================================================ */
function parseHash(h) {
  const m = (h || "").match(/^#([a-z0-9-]+)$/); if (!m) return null;
  if (ATT.some(a => a.id === m[1])) return {id: m[1]};
  const s = m[1].match(/^(.+)-(\d{1,2})$/);
  if (s) { const a = ATT.find(x => x.id === s[1]); if (a && +s[2] >= 1 && +s[2] <= a.steps.length) return {id: a.id, step: +s[2] - 1}; }
  return null;
}
function route() {
  const r = parseHash(location.hash);
  if (!r) return false;
  loadAttack(r.id, r.step !== undefined ? {step: r.step} : {});
  return true;
}
window.addEventListener("hashchange", () => { if (location.hash.slice(1) === S.curHash) return; route(); });

/* ============================================================
   BOOT
   ============================================================ */
window.BREACHWALK = Object.freeze({name: "Breachwalk", author: "Dean Baker", copyright: "© 2026 Dean Baker. All rights reserved."});
try { console.log("%cBREACH%cWALK%c  by Dean Baker · © 2026", "font:700 14px monospace;color:#6ea8ff", "font:italic 700 14px monospace;color:#ff5a6e", "font:12px monospace;color:#8193b2"); } catch (e) {}

/* ============================================================
   WALKING IT: hooks for the shared "What's happening" box (shared/guide.js)
   ============================================================ */
function wiN(t) { try { if (window.WIG) window.WIG.on(t); } catch (e) { console.error(e); } }
window.WI_ENGINE = {
  walk: "breachwalk", S, T, isPixel,
  intro: a => (PLAIN[a.id] || {}).intro || a.summary,
  story: (a, i) => plainStep(a, i).what,
  more: (a, i) => a.steps[i].text,
  msgs: () => S.phase === "step" && S.A ? stepMsgs() : [],
  node: id => S.A && S.A.nodeMap[id],
  notes: (a, i) => nonstopAt(a, i).map(d => ({kind: "shield", name: d.name, short: d.short, result: d.result})),
  blocked: () => S.phase === "step" && S.blocked ? {name: S.blocked.name, short: S.blocked.short, result: S.blocked.result} : null,
  gKey: (a, i) => ({set: "steps", i}),
  runLabel: a => "",
  anaName: () => T("Analyst mode", "DETECTIVE MODE"),
  fixInfo: a => { const on = defsOn(a); return on.length ? {icon: "🛡", label: T("Defences switched on", "POWER-UPS EQUIPPED"), text: on.map(d => d.name).join(", ") + ". " + T("Press Start to see where the chain breaks.", "PRESS START.")} : null; },
  outcome: a => { const st = stopper(a), n = a.steps.length; return st
    ? {title: T("Attack stopped", "STAGE CLEAR"), text: `${st.name} stopped it at step ${st.at}: ${a.steps[st.at - 1].title}. Everything after that never happened.`, grand: "The crook got some of the way, but the lock held at the moment that mattered, so their plan fell apart.", next: T("The debrief on the right explains how to spot it and stop it. Try a different defence and Replay to see where else the chain breaks.", "TRY ANOTHER POWER-UP AND RETRY.")}
    : {title: T("The attacker got through", "GAME OVER"), text: `All ${n} steps worked and nothing stopped it.`, grand: "The burglar got in, found what they wanted and left before anyone noticed. Nobody locked the door.", next: T("Switch on a defence (the Defences button above the map), then Replay to see where it breaks the chain.", "EQUIP A POWER-UP AND RETRY.")}; },
  cont() { if (S.mode !== "explore") return; if (S.phase === "done") return playPause(); if (S.phase === "overview") { S.playing = true; updateControls(); return goStep(0); } if (S.busy) return; S.playing = true; updateControls(); if (S.msgI < stepMsgs().length) return runMsgs(false); nextStep(); },
  replay() { if (S.phase === "done") playPause(); },
  pause() { S.playing = false; updateControls(); }
};

window.__ax = {S, ATT, QUERIES, SPR, goStep, finish, toOverview, loadAttack, setTheme, toggleDef, playPause, openInsp, setView, singleStep, nextStep,
  startCase, answer, nextClue, exitAnalyst, openCard, openAbout, cardText, route, parseHash};
renderTheme();
setView(S.view);
if (!route()) loadAttack(store.get(K.last, ATT[0].id));
})();
