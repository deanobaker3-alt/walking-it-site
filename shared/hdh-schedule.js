/* Hump Day Hack: the release schedule. Part of Walking IT by Dean Baker. © 2026 Dean Baker. All rights reserved.

   ONE SETTING TO CHANGE BEFORE LAUNCH
   seasonStart is the Wednesday Case #1 goes live (UK date, YYYY-MM-DD). Each case after that goes live
   7 days later, at releaseTime UK time (GMT in winter, BST in summer). Nothing else needs touching.

   Each case goes live once, on its own date, and then stays in the archive for good. Nothing is ever re-run.
   walkingIT: leave empty until the Walking IT site is public, then put its address here (ending in /) and
   the "Meet Walking IT" card turns into links to the four walks.

   This file is public and also feeds the Walking IT home page, so it holds titles only, never answers. */
window.HDH_SCHEDULE = {
  seasonStart: "2026-12-02",
  releaseTime: "07:00",
  timeZone: "Europe/London",
  cases: [
    {n: 1,  area: "helpdesk",   title: "Back from the repair shop"},
    {n: 2,  area: "networking", title: "Floor 3 has no internet"},
    {n: 3,  area: "m365",       title: "Bounced by our own sales team"},
    {n: 4,  area: "security",   title: "The CEO needs a payment. Today."},
    {n: 5,  area: "helpdesk",   title: "The missing F: drive"},
    {n: 6,  area: "networking", title: "Half the office can't open HR"},
    {n: 7,  area: "m365",       title: "Forwarding to my Gmail stopped"},
    {n: 8,  area: "security",   title: "Our key is on GitHub"},
    {n: 9,  area: "helpdesk",   title: "Blue screen asking for a key"},
    {n: 10, area: "networking", title: "Fast internet, slow file copies"},
    {n: 11, area: "m365",       title: "The PA who can't see the diary"},
    {n: 12, area: "security",   title: "London to Amsterdam in 19 minutes"},
    {n: 13, area: "helpdesk",   title: "Locked out every 20 minutes"},
    {n: 14, area: "networking", title: "Small files fine, big ones hang"},
    {n: 15, area: "m365",       title: "Where did my reply go?"},
    {n: 16, area: "security",   title: "Bank details? What bank details?"},
    {n: 17, area: "helpdesk",   title: "Ready, but not printing"},
    {n: 18, area: "networking", title: "The file server in her living room"},
    {n: 19, area: "m365",       title: "The laptop from the spares cupboard"},
    {n: 20, area: "security",   title: "Prove you're not a robot"}
  ],
  walkingIT: "",
  /* demo links for testers: ?d=CODE unlocks one case early, e.g. {"<hash of code>": 20}. Keys are hashes of the codes
     (the codes themselves are kept out of the public files). Delete a line to switch that link off. */
  demos: {},
  /* hash of Dean's private preview code (#preview=CODE unlocks every case). Change it to retire the old link. */
  previewKey: "15d0aabb",
  areas: {
    helpdesk:   {name: "Helpdesk",      walk: "ticketwalk", walkName: "Ticketwalk"},
    networking: {name: "Networking",    walk: "packetwalk", walkName: "Packetwalk"},
    m365:       {name: "Microsoft 365", walk: "cloudwalk",  walkName: "Cloudwalk"},
    security:   {name: "Security",      walk: "breachwalk", walkName: "Breachwalk"}
  }
};

/* Release maths, shared by the home page and the case page. Works in UK wall-clock time, so the
   clocks going back or forward never shift a release. */
window.HDH_TIME = (function () {
  const S = window.HDH_SCHEDULE;
  const pad = n => String(n).padStart(2, "0");
  /* "YYYY-MM-DDTHH:MM" for a moment, as a UK clock shows it.
     Uses the browser's time zone data; if that's missing (very old browsers), falls back to the UK rule itself:
     BST (UTC+1) from 01:00 UTC on the last Sunday in March to 01:00 UTC on the last Sunday in October. */
  let fmt = null;
  try {
    fmt = new Intl.DateTimeFormat("en-GB", {timeZone: S.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"});
    if (!fmt.formatToParts) fmt = null;
  } catch (e) { fmt = null; }
  const lastSunday = (y, m) => { const d = new Date(Date.UTC(y, m + 1, 0)); return Date.UTC(y, m, d.getUTCDate() - d.getUTCDay(), 1); };
  function ukStampByRule(ms) {
    const y = new Date(ms).getUTCFullYear();
    const bst = ms >= lastSunday(y, 2) && ms < lastSunday(y, 9);
    const t = new Date(ms + (bst ? 3600000 : 0));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
  }
  function ukStamp(ms) {
    if (!fmt) return ukStampByRule(ms);
    const p = {};
    fmt.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
    if (p.hour === "24") p.hour = "00";   /* a few older engines say 24:00 for midnight */
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }
  /* the UK date (YYYY-MM-DD) that case n goes live */
  function releaseDate(n) {
    const [y, m, d] = S.seasonStart.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + 7 * (n - 1)));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }
  const releaseStamp = n => `${releaseDate(n)}T${S.releaseTime}`;
  const isOut = (n, ms) => ukStamp(ms) >= releaseStamp(n);
  /* the newest case that's out (0 if the season hasn't started) */
  function current(ms) {
    let c = 0;
    for (const k of S.cases) if (isOut(k.n, ms)) c = k.n;
    return c;
  }
  /* the real moment (ms) a UK wall-clock stamp happens, found by search so it's right either side of a clock change */
  function msOfStamp(stamp) {
    const [d, t] = stamp.split("T"), [y, m, dd] = d.split("-").map(Number), [h, mi] = t.split(":").map(Number);
    let guess = Date.UTC(y, m - 1, dd, h, mi);
    for (let i = 0; i < 3; i++) {
      const [d2, t2] = ukStamp(guess).split("T"), [y2, m2, dd2] = d2.split("-").map(Number), [h2, mi2] = t2.split(":").map(Number);
      const diff = Date.UTC(y, m - 1, dd, h, mi) - Date.UTC(y2, m2 - 1, dd2, h2, mi2);
      if (!diff) break;
      guess += diff;
    }
    return guess;
  }
  const releaseMs = n => msOfStamp(releaseStamp(n));
  /* "Wednesday 2 December, 7am" */
  function niceRelease(n) {
    const [y, m, d] = releaseDate(n).split("-").map(Number);
    const day = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {timeZone: "UTC", weekday: "long", day: "numeric", month: "long"});
    const [h, mi] = S.releaseTime.split(":").map(Number);
    const hh = h % 12 || 12, ap = h < 12 ? "am" : "pm";
    return `${day}, ${hh}${mi ? ":" + pad(mi) : ""}${ap}`;
  }
  /* "2 days 4 hours", "3 hours 10 minutes", "12 minutes" */
  function until(ms, now) {
    let s = Math.max(0, Math.floor((ms - now) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.max(d || h ? 0 : 1, Math.floor(s / 60));
    const u = (v, w) => `${v} ${w}${v === 1 ? "" : "s"}`;
    if (d) return u(d, "day") + (h ? " " + u(h, "hour") : "");
    if (h) return u(h, "hour") + (m ? " " + u(m, "minute") : "");
    return u(m, "minute");
  }
  /* the order a case's 4 answers are shown in: shuffled, but the same for everyone, every time */
  function order(n, stage, len) {
    let a = (n * 2654435761 + (stage === "fix" ? 44 : 17) * 40503) >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const idx = Array.from({length: len}, (_, i) => i);
    for (let i = len - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }
  return {ukStamp, ukStampByRule, releaseDate, releaseStamp, releaseMs, isOut, current, niceRelease, until, order};
})();
