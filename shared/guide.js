/* Walking IT: the "What's happening" box. Explains each step as it plays, pauses with a Continue button
   (unless Auto-play is on), and has a Grandad mode that tells the same story in everyday language.
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved.
   The walk's engine calls WIG.on(event) and exposes what this box needs as window.WI_ENGINE. */
(function () {
"use strict";
const E = window.WI_ENGINE;
if (!E) return;
const S = E.S, T = E.T;
const GD = window.GRANDAD || {};
const EX = window.EXPLAIN || {};
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
const K = {grand: "walkingit:grandad", auto: "walkingit:autoplay"};
const G = {grand: !!store.get(K.grand, false), auto: !!store.get(K.auto, false), more: false, key: ""};
const WORDS = {
  breachwalk: {thing: "attack", Thing: "Attack", fix: "defence", fixes: "defences"},
  packetwalk: {thing: "ticket", Thing: "Ticket", fix: "fix", fixes: "fixes"},
  cloudwalk: {thing: "ticket", Thing: "Ticket", fix: "fix", fixes: "fixes"},
  ticketwalk: {thing: "ticket", Thing: "Ticket", fix: "fix", fixes: "fixes"}
}[E.walk] || {thing: "scenario", Thing: "Scenario", fix: "fix", fixes: "fixes"};

/* ---------- build the box ---------- */
const box = document.getElementById("narr");
if (!box) return;
box.innerHTML = `<div class="nh"><span class="h" id="narrH">What's happening</span><span class="sp"></span>
    <button class="sw2 gd" id="gdSw" role="switch" aria-checked="${G.grand}" title="Explain it in everyday language, no jargon"><span class="tk"></span><span id="gdLbl">Grandad mode</span></button>
    <button class="sw2" id="apSw" role="switch" aria-checked="${G.auto}" title="Keep playing without stopping after each step"><span class="tk"></span><span id="apLbl">Auto-play</span></button></div>
  <div class="nb" id="narrBody"></div>
  <div class="nf" id="narrFoot"></div>`;
const body = box.querySelector("#narrBody"), foot = box.querySelector("#narrFoot");
const ctrl = document.getElementById("ctrl");
if (ctrl) foot.appendChild(ctrl);
const gdSw = box.querySelector("#gdSw"), apSw = box.querySelector("#apSw");
gdSw.addEventListener("click", () => { G.grand = !G.grand; store.set(K.grand, G.grand); gdSw.setAttribute("aria-checked", String(G.grand)); render(true); });
apSw.addEventListener("click", () => {
  G.auto = !G.auto; store.set(K.auto, G.auto); apSw.setAttribute("aria-checked", String(G.auto));
  // switching Auto-play on while paused between steps carries straight on
  if (G.auto && S.mode === "explore" && S.phase === "step" && !S.busy && !S.playing && doneStep()) E.cont();
  else render(false);
});
body.addEventListener("click", e => {
  const b = e.target.closest("[data-n]"); if (!b) return;
  const a = b.dataset.n;
  if (a === "cont") E.cont();
  else if (a === "replay") E.replay();
  else if (a === "pause") E.pause();
});
body.addEventListener("toggle", e => { if (e.target.classList && e.target.classList.contains("n-more")) G.more = e.target.open; }, true);

/* ---------- helpers ---------- */
const doneStep = () => S.phase === "step" && S.msgI >= E.msgs().length && !S.busy;
function gEntry(a) { return GD[a.id] || null; }
function gStep(a, i) {
  const g = gEntry(a); if (!g) return null;
  const k = E.gKey(a, i);
  return k.set === "fixed" ? (g.fixed || {})[k.i] || null : (g.steps || [])[k.i] || null;
}
function exStep(a, i) {
  const g = EX[a.id]; if (!g) return null;
  const k = E.gKey(a, i);
  return k.set === "fixed" ? (g.fixed || {})[k.i] || null : (g.steps || [])[k.i] || null;
}
function noteHTML(n) {
  if (G.grand) {
    const txt = n.kind === "herring"
      ? T(`That was a red herring. It's like changing the batteries in the TV remote when the real problem is that the telly isn't plugged in: lots of effort, no difference. ${esc(n.short)} didn't touch the real cause.`, `RED HERRING! ${esc(n.short).toUpperCase()} DIDN'T TOUCH THE REAL PROBLEM.`)
      : n.kind === "shield"
        ? T(`${esc(n.short)} didn't stop the attack, but it limits the damage, like a fire door that keeps a fire to one room.`, `${esc(n.short).toUpperCase()} SHIELDED YOU!`)
        : T(`This is where ${esc(n.short)} comes in. It's the right key for the right lock, so this time it works.`, `${esc(n.short).toUpperCase()} WORKED!`);
    return `<div class="n-note ${n.kind === "herring" ? "warn" : "good"}"><b>${n.kind === "herring" ? "🔁 " + T("Didn't help", "NO CHANGE") : "🛡 " + esc(n.short)}</b>${txt}</div>`;
  }
  const lab = n.kind === "herring" ? "🔁 " + T("Tried", "TRIED") + ": " + esc(n.name) : (n.kind === "shield" ? "🛡 " : "🔧 ") + esc(n.name);
  return `<div class="n-note ${n.kind === "herring" ? "warn" : "good"}"><b>${lab}</b>${esc(n.result)}</div>`;
}
function msgsHTML(a) {
  if (G.grand) return "";
  const list = E.msgs(); if (!list.length) return "";
  const shown = Math.min(list.length, S.busy ? S.msgI + 1 : S.msgI);
  if (!shown) return "";
  const blk = E.blocked();
  return `<ul class="n-msgs" aria-label="${T("What's moving", "ON THE WIRE")}">${list.slice(0, shown).map((m, i) => {
    const from = E.node(m.from), to = E.node(m.to), now = S.busy && i === S.msgI;
    const extra = m.blocked || blk ? ` · <b>${T("blocked", "BLOCKED")}</b>` : m.lost ? ` · <b>${T("never arrives", "LOST")}</b>` : "";
    return `<li class="k-${m.kind}${now ? " now" : ""}${m.lost ? " lost" : ""}"><i aria-hidden="true"></i><span>${esc(m.label)}</span><small>${esc(from ? from.label : m.from)} → ${esc(to ? to.label : m.to)}${extra}</small></li>`;
  }).join("")}</ul>`;
}
function moreHTML(a, plainText, techText) {
  const inner = G.grand
    ? `<p class="lab">${T("In IT terms", "IN IT TERMS")}</p><p>${esc(plainText)}</p>`
    : techText ? `<p>${esc(techText)}</p>` : "";
  if (!inner) return "";
  return `<details class="n-more"${G.more ? " open" : ""}><summary>${T("Tell me more", "MORE INFO")}</summary>${inner}</details>`;
}
function goHTML(label, act, ready) { return `<button class="n-cont${ready ? " ready" : ""}" data-n="${act}">${label}</button>`; }

/* ---------- render ---------- */
function render(force) {
  const a = S.A;
  $("#narrH").textContent = T("What's happening", "WHAT'S GOING ON");
  $("#gdLbl").textContent = T("Grandad mode", "GRANDAD");
  $("#apLbl").textContent = T("Auto-play", "AUTO");
  if (!a) { body.innerHTML = ""; return; }
  let html = "";
  if (S.mode !== "explore") {
    html = `<div class="n-kick">${esc(E.anaName())}</div><div class="n-ttl">${T("Solve it from the clues", "SOLVE THE CASE")}</div>
      <p class="n-story">${G.grand
        ? T("This is a detective game. Little clues turn up one at a time, like notes pushed under the door. Read them, then answer the questions on the right about what went wrong.", "CLUES ARRIVE ONE BY ONE. READ THEM AND SOLVE THE CASE ON THE RIGHT.")
        : T(`Clues arrive one at a time in the middle panel, with no names attached. Click a clue to inspect it, then answer the questions on the right: what's going on, and what would fix it.`, "CLUES ARRIVE ONE BY ONE. CLICK TO INSPECT. ANSWER ON THE RIGHT.")}</p>`;
  } else if (S.phase === "overview") {
    const g = gEntry(a), fx = E.fixInfo(a);
    const story = G.grand && g && g.intro ? g.intro : E.intro(a);
    html = `<div class="n-kick">${T("Before you start", "MISSION BRIEF")}${G.grand ? `<span class="n-badge">👴 ${T("Grandad mode", "GRANDAD")}</span>` : ""}</div>
      <div class="n-ttl">${esc(a.name)}</div>
      <p class="n-story${G.grand ? " grand" : ""}">${esc(story)}</p>
      ${fx ? `<div class="n-note good"><b>${fx.icon} ${esc(fx.label)}</b>${esc(fx.text)}</div>` : ""}
      ${G.grand ? moreHTML(a, E.intro(a), "") : ""}
      <div class="n-go">${goHTML(`▶ ${T("Start: step 1", "PRESS START")}`, "cont", true)}<span class="n-hint">${G.auto ? T("Auto-play is on: it'll run straight through.", "AUTO-PLAY ON") : T("It pauses after each step so you can read.", "PAUSES AFTER EACH STAGE")}</span></div>`;
  } else if (S.phase === "step") {
    const i = S.step, s = a.steps[i], n = a.steps.length, blk = E.blocked();
    const plain = E.story(a, i), gs = gStep(a, i);
    let story = G.grand && gs ? gs : plain;
    if (blk) story = G.grand ? T(`Stopped! ${blk.short} is like a lock on exactly the right door: the crook got this far, but couldn't get past this point, so nothing after it ever happens.`, `${blk.short.toUpperCase()} STOPPED THEM!`) : blk.result;
    const notes = blk ? [] : E.notes(a, i);
    const last = i >= n - 1 || !!blk;
    let go;
    if (!doneStep()) go = S.playing || S.busy ? `<span class="n-wait">${T("Playing", "PLAYING")}</span>` : goHTML(`▶ ${T("Play this step", "PLAY")}`, "cont", true);
    else if (S.playing) go = `<span class="n-wait">${last ? T("Wrapping up", "FINISHING") : T("Next step coming up", "NEXT STAGE")}</span>${goHTML(`❚❚ ${T("Pause here", "PAUSE")}`, "pause", false)}`;
    else go = goHTML(blk ? `${T("See the debrief", "CONTINUE")} ▶` : last ? `${T("See how it ends", "FINISH")} ▶` : `${T("Continue to step", "NEXT: STAGE")} ${i + 2} ▶`, "cont", true);
    html = `<div class="n-kick">${T("Step", "STAGE")} ${i + 1} ${T("of", "/")} ${n}${E.runLabel(a)}${G.grand ? `<span class="n-badge">👴 ${T("Grandad mode", "GRANDAD")}</span>` : ""}</div>
      <div class="n-ttl">${esc(blk ? T("Stopped by", "BLOCKED BY") + " " + blk.short : s.title)}</div>
      <p class="n-story${G.grand ? " grand" : ""}" aria-live="polite">${esc(story)}</p>
      ${blk && !G.grand ? `<div class="n-note bad"><b>${T("Without it", "WITHOUT IT")}</b>${esc(plain)}</div>` : ""}
      ${!blk && !G.grand && exStep(a, i) ? `<div class="n-why"><b>💡 ${T("Why it matters", "WHY IT MATTERS")}</b><p>${esc(exStep(a, i))}</p></div>` : ""}
      ${msgsHTML(a)}
      ${notes.map(noteHTML).join("")}
      ${moreHTML(a, blk ? plain : plain, blk ? "" : E.more(a, i))}
      <div class="n-go">${go}</div>`;
  } else {
    const o = E.outcome(a);
    html = `<div class="n-kick">${T("The end", "GAME OVER")}${G.grand ? `<span class="n-badge">👴 ${T("Grandad mode", "GRANDAD")}</span>` : ""}</div>
      <div class="n-ttl">${esc(o.title)}</div>
      <p class="n-story${G.grand ? " grand" : ""}">${esc(G.grand ? o.grand : o.text)}</p>
      <p class="n-story" style="margin-top:8px;font-size:13.5px;color:var(--muted)">${esc(o.next)}</p>
      <div class="n-go">${goHTML(`↺ ${T("Replay", "RETRY")}`, "replay", false)}</div>`;
  }
  const key = [S.mode, a.id, S.phase, S.step, G.grand].join("|");
  if (key !== G.key) { G.key = key; body.scrollTop = 0; }
  body.innerHTML = html;
  const ms = body.querySelector(".n-msgs li:last-child");
  if (ms && S.busy) ms.scrollIntoView({block: "nearest"});
}
function $(s) { return document.querySelector(s); }

/* ---------- engine events ---------- */
let pending = false;
window.WIG = {
  on(type) { if (pending) return; pending = true; queueMicrotask(() => { pending = false; render(false); }); },
  guided() { return !G.auto; },
  state: G
};
render(false);
})();
