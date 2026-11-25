/* Walking IT: the first-visit tour and the "?" help on every panel. Both use the same words, so they never disagree.
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
(function () {
"use strict";
const walk = (location.pathname.match(/\/(ticketwalk|cloudwalk|packetwalk|breachwalk)\//) || [])[1];
if (!walk) return;
const pixel = () => document.body.getAttribute("data-theme") === "pixel";
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
const KEY = "walkingit:tour:" + walk;

/* ---------- the words: one entry per panel ---------- */
const W = {
  breachwalk: {thing: "attack", things: "Attacks", fix: "Defences", chain: "Kill chain", chainText: "The seven stages most attacks move through, from scouting the target to the damage at the end. The red tile is where the attacker is right now.", ana: "Analyst mode", anaText: "Test yourself like a SOC analyst: alerts arrive with no names attached, and you work out which attack it is, which ATT&CK technique is involved and which defence would have stopped it earliest.", evText: "What a security team would actually see: email headers, sign-in logs, endpoint alerts and packets, in the order they turn up. Click any row to inspect the raw log.", fixText: "Switch on a defence, then replay the attack. You'll see exactly which step it breaks the chain at, or how much damage it saves if it only reduces the impact.", infoText: "The reference for each step: what moves between the machines, how you'd spot it, words to know, and the technical detail with example detection queries (KQL and CQL)."},
  packetwalk: {thing: "ticket", things: "Tickets", fix: "Fixes", chain: "The journey", chainText: "The seven stages every connection goes through, from plugging in to using the app. The lit tile shows where you are; when a ticket finishes still broken, it marks the stage where it broke.", ana: "Diagnose", anaText: "Test yourself: clues arrive one at a time with no ticket attached. Work out the root cause, which stage of the journey broke and which fix would actually solve it.", evText: "What an engineer would actually see: command output, logs and packet captures, in the order you'd find them. Click any row to inspect it, down to the bytes.", fixText: "Switch on a fix, then replay. Only one of them really fixes the ticket; the others are the things people often try first, and each tells you why it didn't help.", infoText: "The reference for each step: what moves on the network, how you'd check it, commands to try, words to know, and the technical detail."},
  cloudwalk: {thing: "ticket", things: "Tickets", fix: "Fixes", chain: "The sign-in journey", chainText: "The seven stages every Microsoft 365 sign-in goes through, from the account existing to actually using the app. The lit tile shows where you are; when a ticket finishes still broken, it marks the stage where it broke.", ana: "Diagnose", anaText: "Test yourself: clues arrive one at a time with no ticket attached. Work out the root cause, which stage of the journey broke and which fix would actually solve it.", evText: "What an admin would actually see: sign-in and audit logs, PowerShell output and what the user sees on screen. Click any row to inspect it.", fixText: "Switch on a fix, then replay. Only one of them really fixes the ticket; the others are the things people often try first, and each tells you why it didn't help.", infoText: "The reference for each step: what moves between the services, how you'd check it, PowerShell and where to look in the admin centres, words to know, and the technical detail."},
  ticketwalk: {thing: "ticket", things: "Tickets", fix: "Fixes", chain: "Ticket lifecycle", chainText: "The seven stages of a service desk ticket, from being logged to being confirmed and closed. The red tile is where you are now.", ana: "Diagnose", anaText: "Test yourself: clues arrive one at a time. Work out the root cause, how urgent it is and which fix would actually solve it.", evText: "What the service desk would actually see: ticket notes, sign-in and audit logs, admin screens and PowerShell output. Click any row to inspect it.", fixText: "Switch on a fix, then replay. Only one of them really fixes the ticket; the others are the things juniors often try first, and each tells you why it didn't help.", infoText: "The reference for each step: the ticket, your call on verifying and triaging the caller, how you'd check it, commands to try, words to know, and the technical detail."}
}[walk];
const NAME = {breachwalk: "Breachwalk", packetwalk: "Packetwalk", cloudwalk: "Cloudwalk", ticketwalk: "Ticketwalk"}[walk];

const PANELS = [
  {id: "side", sel: "#side", title: W.things, text: `Every ${W.thing} in ${NAME}. Pick one to load it, and the steps appear underneath so you can jump to any of them. The dot goes amber once you've started and green once you've finished.`},
  {id: "stage", sel: "#stage", title: "The map", text: `The people, devices and services involved in this ${W.thing}. Watch the messages travel between them as it plays. Switch to Sequence (top left) for the same thing as a step-by-step list.`},
  {id: "fix", sel: "#defBtn", title: W.fix, text: W.fixText},
  {id: "narr", sel: "#narr", title: "What's happening", text: "Explains each step in plain English as it plays, then pauses so you can take it in. Press Continue when you're ready. Grandad mode tells the same story with no jargon at all, Tell me more gives the deeper version, and Auto-play lets it run without stopping."},
  {id: "ev", sel: ".ev", title: "Evidence", text: W.evText},
  {id: "info", sel: "#info", title: "The details", text: W.infoText},
  {id: "kc", sel: ".top .kc", title: W.chain, text: W.chainText},
  {id: "ana", sel: "#anaBtn", title: W.ana, text: W.anaText},
  {id: "home", sel: "#wiHome", title: "Walking IT", text: "Home takes you back to the Walking IT front page. The grid button next to it jumps straight to another walk. Look for the ? on each panel if you forget what something does."}
];
const P = id => PANELS.find(p => p.id === id);

/* ---------- ? help popovers ---------- */
let pop = null, popBtn = null;
function closePop() { if (pop) { pop.remove(); pop = null; } if (popBtn) { popBtn.setAttribute("aria-expanded", "false"); popBtn = null; } }
function openPop(btn, id) {
  if (popBtn === btn) return closePop();
  closePop();
  const p = P(id); if (!p) return;
  pop = document.createElement("div");
  pop.className = "wi-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", p.title);
  pop.innerHTML = `<b class="t">${p.title}</b><p>${p.text}</p><div class="row"><button class="lnk" data-wi="tour">▶ ${pixel() ? "TAKE THE TOUR" : "Take the tour"}</button><button class="x" data-wi="close">${pixel() ? "OK" : "Got it"}</button></div>`;
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12);
  let top = r.bottom + 8; if (top + h > innerHeight - 12) top = Math.max(12, r.top - h - 8);
  pop.style.left = left + "px"; pop.style.top = top + "px";
  popBtn = btn; btn.setAttribute("aria-expanded", "true");
  pop.querySelector(".x").focus();
}
function qBtn(id) { const b = document.createElement("button"); b.className = "wi-q"; b.type = "button"; b.dataset.wiq = id; b.setAttribute("aria-label", "What is " + P(id).title + "?"); b.setAttribute("aria-expanded", "false"); b.textContent = "?"; return b; }
function addHelp() {
  const put = (sel, id, how) => { const host = document.querySelector(sel); if (!host || host.querySelector(`.wi-q[data-wiq="${id}"]`) || (host.parentNode && host.parentNode.querySelector(`:scope > .wi-q[data-wiq="${id}"]`))) return; const b = qBtn(id); if (how === "after") host.insertAdjacentElement("afterend", b); else host.appendChild(b); };
  put("#sideTitle", "side", "after");
  put(".stage-bar", "stage");
  put("#evTitle", "ev", "after");
  put("#narrH", "narr", "after");
  const ih = document.querySelector("#info .ph > .h"); if (ih && !document.querySelector('#info .wi-q[data-wiq="info"]')) ih.insertAdjacentElement("afterend", qBtn("info"));
}
document.addEventListener("click", e => {
  const q = e.target.closest(".wi-q"); if (q) { e.stopPropagation(); return openPop(q, q.dataset.wiq); }
  const a = e.target.closest("[data-wi]");
  if (a && a.dataset.wi === "close") { const b = popBtn; closePop(); if (b) b.focus(); return; }
  if (a && a.dataset.wi === "tour") { closePop(); return startTour(); }
  if (pop && !pop.contains(e.target)) closePop();
}, true);
window.addEventListener("resize", closePop);

/* ---------- tour ---------- */
let tour = null;
function visible(el) { if (!el) return false; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 4 && r.height > 4 && cs.visibility !== "hidden" && cs.display !== "none" && r.right > 0 && r.left < innerWidth; }
function stops() { return PANELS.filter(p => visible(document.querySelector(p.sel))); }
function startTour() {
  if (tour) return;
  if (window.__wiTourBlock && window.__wiTourBlock()) return;
  const list = stops(); if (!list.length) return;
  const el = document.createElement("div");
  el.className = "wi-tour"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Tour of " + NAME);
  el.innerHTML = `<div class="wi-hole"></div><div class="wi-bub"></div>`;
  document.body.appendChild(el);
  tour = {el, list, i: 0, prev: document.activeElement};
  show(0);
}
function endTour() {
  if (!tour) return;
  store.set(KEY, 1);
  const prev = tour.prev; tour.el.remove(); tour = null;
  try { if (prev && prev.focus) prev.focus(); } catch (e) {}
}
function show(i) {
  tour.i = i;
  const p = tour.list[i], target = document.querySelector(p.sel), px = pixel();
  if (target && innerWidth <= 1050) target.scrollIntoView({block: "center"});
  const r = target.getBoundingClientRect(), pad = 6;
  const hole = tour.el.querySelector(".wi-hole"), bub = tour.el.querySelector(".wi-bub");
  Object.assign(hole.style, {left: (r.left - pad) + "px", top: (r.top - pad) + "px", width: (r.width + pad * 2) + "px", height: (r.height + pad * 2) + "px"});
  const n = tour.list.length, last = i === n - 1;
  bub.innerHTML = `<div class="k">${px ? "TUTORIAL" : "Quick tour"} · ${i + 1} / ${n}</div><h3>${p.title}</h3><p>${p.text}</p>
    <div class="row"><button class="skip" data-t="skip">${last ? "" : px ? "SKIP" : "Skip tour"}</button><span class="sp"></span>
    <div class="dots" aria-hidden="true">${tour.list.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
    ${i ? `<button data-t="back">${px ? "BACK" : "Back"}</button>` : ""}<button class="pri" data-t="next">${last ? (px ? "LET'S GO!" : "Let's go") : (px ? "NEXT" : "Next")}</button></div>`;
  if (last) bub.querySelector(".skip").style.visibility = "hidden";
  // place the bubble beside the highlighted panel, wherever there's room
  const bw = bub.offsetWidth, bh = bub.offsetHeight, m = 14;
  const room = {right: innerWidth - r.right, left: r.left, below: innerHeight - r.bottom, above: r.top};
  let left, top;
  if (room.below >= bh + m * 2) { top = r.bottom + m; left = r.left + r.width / 2 - bw / 2; }
  else if (room.above >= bh + m * 2) { top = r.top - bh - m; left = r.left + r.width / 2 - bw / 2; }
  else if (room.right >= bw + m * 2) { left = r.right + m; top = r.top + r.height / 2 - bh / 2; }
  else if (room.left >= bw + m * 2) { left = r.left - bw - m; top = r.top + r.height / 2 - bh / 2; }
  else { left = innerWidth / 2 - bw / 2; top = innerHeight / 2 - bh / 2; }
  bub.style.left = Math.min(Math.max(12, left), innerWidth - bw - 12) + "px";
  bub.style.top = Math.min(Math.max(12, top), innerHeight - bh - 12) + "px";
  bub.querySelector('[data-t="next"]').focus();
}
document.addEventListener("click", e => {
  if (!tour) return;
  const b = e.target.closest("[data-t]");
  if (!b) { e.stopPropagation(); e.preventDefault(); return; }
  e.stopPropagation();
  if (b.dataset.t === "skip") return endTour();
  if (b.dataset.t === "back") return show(Math.max(0, tour.i - 1));
  if (b.dataset.t === "next") return tour.i >= tour.list.length - 1 ? endTour() : show(tour.i + 1);
}, true);
document.addEventListener("keydown", e => {
  if (tour) {
    e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); return endTour(); }
    if (e.key === "ArrowRight") { e.preventDefault(); return tour.i >= tour.list.length - 1 ? endTour() : show(tour.i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); return show(Math.max(0, tour.i - 1)); }
    if (e.key === "Tab") { const f = [...tour.el.querySelectorAll("button")].filter(x => x.offsetParent && x.style.visibility !== "hidden"); const k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); }
    return;
  }
  if (pop && e.key === "Escape") { e.stopPropagation(); const b = popBtn; closePop(); if (b) b.focus(); }
}, true);
window.addEventListener("resize", () => { if (tour) show(tour.i); });

/* ---------- start ---------- */
addHelp();
new MutationObserver(addHelp).observe(document.getElementById("info"), {childList: true});
window.WITOUR = {start: startTour, end: endTour, panels: PANELS};
if (!store.get(KEY, 0)) setTimeout(() => { if (!document.querySelector("#modal .scrim")) startTour(); }, 900);
})();
