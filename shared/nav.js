/* Walking IT: the site-wide "Walks" menu, added to the header of every walk.
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved.
   Each walk lives in its own folder; this script works out which one it is from the folder name. */
(function () {
"use strict";
const WALKS = [
  ["ticketwalk", "TICKET", "Service desk tickets"],
  ["cloudwalk", "CLOUD", "Microsoft 365 and Entra"],
  ["packetwalk", "PACKET", "Networking"],
  ["breachwalk", "BREACH", "Cyber attacks"]
];
const here = (location.pathname.match(/\/(ticketwalk|cloudwalk|packetwalk|breachwalk|hack)\//) || [])[1] || "";
const tb = document.querySelector(".top .tb");
if (!tb) return;
const pixel = () => document.body.getAttribute("data-theme") === "pixel";

const css = document.createElement("style");
css.textContent = `
.wi-menu{min-width:280px;left:auto;right:0}
.wi-menu a{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;text-decoration:none;color:var(--text)}
.wi-menu a:hover,.wi-menu a:focus-visible{background:var(--panel2)}
.wi-menu a[aria-current="page"]{background:color-mix(in srgb,var(--accent) 12%,transparent)}
.wi-menu .wm{font:700 12.5px var(--head);letter-spacing:1.8px;white-space:nowrap}
.wi-menu .wm i{color:var(--red);padding-right:1px}
.wi-menu small{display:block;font:11px var(--mono);color:var(--muted);letter-spacing:.3px}
.wi-menu .here{margin-left:auto;font:600 9.5px var(--mono);letter-spacing:1px;text-transform:uppercase;color:var(--accent);white-space:nowrap}
.wi-menu .sep{height:1px;background:var(--line);margin:5px 4px}
.wi-menu .lg{width:22px;height:22px;flex:none;border-radius:50%}
[data-theme="pixel"] .wi-menu .lg{image-rendering:pixelated;border-radius:0}
[data-theme="pixel"] .wi-menu a{border-radius:0}
[data-theme="pixel"] .wi-menu .wm{font-size:8px;letter-spacing:.5px;line-height:1.7;color:var(--cyan)}
[data-theme="pixel"] .wi-menu .wm i{color:var(--amber);font-style:normal}
[data-theme="pixel"] .wi-menu small{font-size:15px}
[data-theme="pixel"] .wi-menu .here{font:6px var(--head);color:var(--amber)}
#wiBtn .ic rect{rx:1}
[data-theme="pixel"] #wiBtn .ic rect{rx:0}`;
document.head.appendChild(css);

const dd = document.createElement("div");
dd.className = "dd";
dd.innerHTML = `<button class="iconbtn" id="wiBtn" aria-haspopup="menu" aria-expanded="false" title="All walks (W)" aria-label="All walks and Hump Day Hack"><svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2.5" width="4.5" height="4.5"/><rect x="9" y="2.5" width="4.5" height="4.5"/><rect x="2.5" y="9" width="4.5" height="4.5"/><rect x="9" y="9" width="4.5" height="4.5"/></svg></button><div id="wiMenu"></div>`;
tb.insertBefore(dd, tb.firstChild);
const home = document.createElement("a");
home.className = "iconbtn"; home.id = "wiHome"; home.href = "../index.html";
home.title = "Walking IT home"; home.setAttribute("aria-label", "Walking IT home");
home.innerHTML = `<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 7.5 8 3l5.5 4.5"/><path d="M4 6.5v6.5h3v-3.5h2V13h3V6.5"/></svg>`;
tb.insertBefore(home, dd);
const btn = dd.querySelector("#wiBtn"), box = dd.querySelector("#wiMenu");

function close(focus) {
  if (!box.innerHTML) return;
  box.innerHTML = ""; btn.setAttribute("aria-expanded", "false"); btn.classList.remove("on");
  if (focus) btn.focus();
}
function open() {
  const P = pixel();
  const logo = `<img class="lg" src="../shared/brand/walkingit-${P ? "lens-px19.png" : "lens-128.webp"}" alt="" width="22" height="22">`;
  const item = (href, wm, sub, cur) => `<a role="menuitem" href="${href}"${cur ? ' aria-current="page"' : ""}><span><span class="wm">${wm}</span><small>${sub}</small></span>${cur ? `<span class="here">${P ? "YOU ARE HERE" : "You're here"}</span>` : ""}</a>`;
  box.innerHTML = `<div class="menu wi-menu" role="menu" aria-label="Walking IT">
    <a role="menuitem" href="../index.html">${logo}<span><span class="wm">WALKING <i>IT</i></span><small>${P ? "HOME · ALL WALKS" : "Home: all the walks"}</small></span></a>
    <div class="sep" role="separator"></div>
    ${WALKS.map(([id, name, sub]) => item(`../${id}/index.html`, `${name}<i>WALK</i>`, P ? sub.toUpperCase() : sub, id === here)).join("")}
    <div class="sep" role="separator"></div>
    ${item("https://deanobaker3-alt.github.io/hump-day-hack/", "HUMP DAY <i>HACK</i>", P ? "A NEW CASE EVERY WEDNESDAY" : "A new case every Wednesday", here === "hack")}
    ${window.WITOUR ? `<div class="sep" role="separator"></div><a role="menuitem" href="#" data-wi-tour="1"><span><span class="wm" style="letter-spacing:1px">▶ ${P ? "TAKE THE TOUR" : "Take the tour"}</span><small>${P ? "WHAT EVERY PANEL DOES" : "What every panel on this page does"}</small></span></a>` : ""}
  </div>`;
  btn.setAttribute("aria-expanded", "true"); btn.classList.add("on");
  const first = box.querySelector("a"); if (first) first.focus();
}
btn.addEventListener("click", e => { e.stopPropagation(); box.innerHTML ? close(true) : open(); });
box.addEventListener("click", e => { const t = e.target.closest("[data-wi-tour]"); if (!t) return; e.preventDefault(); close(false); window.WITOUR.start(); });
document.addEventListener("click", e => { if (!dd.contains(e.target)) close(false); });
/* capture phase, so the walk's own shortcuts don't also fire while this menu is in use */
document.addEventListener("keydown", e => {
  if (box.innerHTML) {
    const items = [...box.querySelectorAll("a")], i = items.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); return close(true); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus(); return; }
    if (e.key === "Tab") { close(false); return; }
    if (e.key === " ") { e.preventDefault(); e.stopPropagation(); if (i >= 0) items[i].click(); return; }
    if (e.key !== "Enter") e.stopPropagation();
    return;
  }
  const tg = (e.target.tagName || "").toUpperCase();
  if (e.key.toLowerCase() === "w" && !e.ctrlKey && !e.metaKey && !e.altKey && tg !== "INPUT" && tg !== "TEXTAREA" && !document.querySelector("#modal .scrim")) { e.preventDefault(); e.stopPropagation(); open(); }
}, true);
})();
