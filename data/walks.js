/* Walking IT: the walks in the series. Each walk lives in its own folder of this site. Created by Dean Baker. © 2026 Dean Baker. All rights reserved.
   Add a new walk by adding an entry here. Order = the suggested learning path.
   icon: an isometric icon kind from app.js (agent, cloud, router, attacker, server, laptop, printer, fw ...)
   roles: which "Where do you sit?" buttons point at this walk. */
window.WALKS = [
  {
    id: "ticket", name: "TICKET", url: "ticketwalk/index.html",
    icon: "agent", area: "Service desk",
    tagline: "Work real service desk tickets, from logged to closed.",
    what: "Verify the caller, set the priority, find the real cause, then write the closing note.",
    count: "8 tickets", topics: ["Lockouts", "MFA", "Shared mailboxes", "Printers", "New starters"],
    chainName: "Ticket lifecycle",
    stages: ["Logged", "Verify", "Triage", "Investigate", "Find the cause", "Fix", "Confirm & close"],
    roles: ["new", "desk"], start: true
  },
  {
    id: "cloud", name: "CLOUD", url: "cloudwalk/index.html",
    icon: "cloud", area: "Microsoft 365 and Entra",
    tagline: "Follow Microsoft 365 problems to the setting that broke them.",
    what: "Read the sign-in logs and admin screens, then find the one change that fixes it.",
    count: "8 tickets", topics: ["Sync", "MFA", "Conditional Access", "Licensing", "Intune"],
    chainName: "Sign-in journey",
    stages: ["Exist (sync)", "Prove it (MFA)", "Allowed in?", "Licensed", "Access (groups)", "Trusted device", "Use it"],
    roles: ["m365"]
  },
  {
    id: "packet", name: "PACKET", url: "packetwalk/index.html",
    icon: "router", area: "Networking",
    tagline: "Follow a connection step by step and find where it breaks.",
    what: "Read the command output and packet captures, and skip the red herrings.",
    count: "8 tickets", topics: ["DHCP", "DNS", "Gateways", "Firewalls", "VPN"],
    chainName: "Connection journey",
    stages: ["Connect", "Get an address", "Find the name", "Find the way", "Open a connection", "Secure it", "Use it"],
    roles: ["net"]
  },
  {
    id: "breach", name: "BREACH", url: "breachwalk/index.html",
    icon: "attacker", area: "Security",
    tagline: "Watch real cyber attacks unfold and find the defence that stops them.",
    what: "See the evidence a SOC analyst would see, then solve mystery cases in analyst mode.",
    count: "15 attacks · 55 defences", topics: ["Phishing", "MFA fatigue", "Ransomware", "Kerberoasting", "KQL and CQL"],
    chainName: "Kill chain",
    stages: ["Recon", "Initial access", "Execution & persistence", "Credential access", "Escalation & movement", "Collection & exfiltration", "Impact"],
    roles: ["sec"]
  }
];

/* "Where do you sit?" buttons: label, pixel label, and the advice shown when picked */
window.ROLES = [
  {id: "new", label: "New to IT", px: "NEW PLAYER", tip: "Start with Ticketwalk: it's the day-one job. Then Cloudwalk and Packetwalk, and save Breachwalk for last."},
  {id: "desk", label: "Service desk", px: "HELP DESK", tip: "Ticketwalk is your patch. Cloudwalk is the natural next step once tickets turn into Microsoft 365 problems."},
  {id: "m365", label: "Microsoft 365", px: "M365", tip: "Cloudwalk: sync, MFA, Conditional Access, licensing and Intune, traced to the setting that broke."},
  {id: "net", label: "Networking", px: "NETWORK", tip: "Packetwalk: DHCP, DNS, gateways and VPNs, with real command output and packet captures."},
  {id: "sec", label: "Security", px: "SECURITY", tip: "Breachwalk: 15 attacks, the evidence they leave, and the defence that breaks each chain."}
];
