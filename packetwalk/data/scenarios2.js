/* Packetwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — scenarios 5–8. Same format as scenarios1.js. */
(function () {
const R = String.raw;
window.SCENARIOS = (window.SCENARIOS || []).concat([

/* ============ 5. WRONG SUBNET MASK ============ */
{
  id: "wrong-mask", cat: "address", name: "The file server vanished", sub: "One wrong number in the subnet mask",
  impact: "One device", layers: ["L3 IPv4 (subnetting)", "L2 ARP"],
  cause: "The PC's subnet mask is 255.0.0.0 instead of 255.255.255.0",
  ticket: {ref: "INC-20460", from: "Leeds office · CAD workstation", text: "Since IT gave the CAD PC a fixed IP yesterday it can't open anything on the S: drive. Websites are fine. The PC next to it is fine."},
  intro: "The Leeds CAD PC was given a fixed address yesterday. Whoever typed it in pressed Tab and Windows filled in the subnet mask for them: 255.0.0.0. Now the PC thinks every 10.x.x.x address is in the same room, so it never sends head-office traffic to the router.",
  summary: "LEEDS-CAD1 is static: 10.30.5.45 with mask 255.0.0.0 (Windows pre-fills the old 'class A' default when you type a 10.x address). The correct mask is 255.255.255.0. With /8, the HQ file server 10.20.0.20 looks on-link, so the PC ARPs for it on the Leeds LAN instead of using the gateway 10.30.5.1. DNS (the Leeds router) and internet traffic still work.",
  facts: [["Symptom", "Internet fine, HQ servers unreachable"], ["Root cause", "Mask 255.0.0.0 instead of 255.255.255.0"], ["Who's affected", "One PC"], ["Key evidence", "ARP for a remote IP; on-link route 10.0.0.0/8"]],
  nodes: [
    {id: "pc", kind: "laptop", label: "CAD PC", sub: "LEEDS-CAD1 · 10.30.5.45", x: 120, y: 330},
    {id: "rtr", kind: "router", label: "Leeds router", sub: "10.30.5.1 · gateway + DNS", x: 400, y: 330},
    {id: "inet", kind: "cloud", label: "Internet", sub: "", x: 400, y: 100},
    {id: "vpn", kind: "vpn", label: "Site-to-site VPN", sub: "Leeds ⇄ head office", x: 660, y: 470},
    {id: "fs", kind: "server", label: "FS01", sub: "10.20.0.20 · head office", x: 920, y: 330}
  ],
  links: [["pc", "rtr"], ["rtr", "inet"], ["rtr", "vpn"], ["vpn", "fs"]],
  lanes: ["pc", "rtr", "inet", "vpn", "fs"],
  stage: 4,
  steps: [
    {title: "A fixed address, typed in", sub: "Windows filled in the mask", ph: 2,
     what: "The CAD PC needed a fixed address for its plotter licence. The engineer typed 10.30.5.45, pressed Tab, and Windows helpfully filled in the subnet mask: 255.0.0.0. Nobody noticed. The office actually uses 255.255.255.0.",
     check: "ipconfig /all shows DHCP Enabled: No and a subnet mask of 255.0.0.0. Every other PC in Leeds shows 255.255.255.0.",
     tech: "Windows pre-fills the classful default mask: 255.0.0.0 for any 10.x.x.x address. The Leeds LAN is 10.30.5.0/24. With /8, the PC treats all of 10.0.0.0–10.255.255.255 as directly connected.",
     msgs: [], focus: ["pc"], callout: "Mask: 255.0.0.0 (should be 255.255.255.0)",
     cmds: {win: R`ipconfig /all`, nix: R`ifconfig en0 | grep netmask   # macOS
ip -4 addr show               # Linux: look at the /prefix`},
     evidence: [{t: "09:12:05", src: "LEEDS-CAD1 · ipconfig /all", title: "Subnet Mask 255.0.0.0 on a static address", sev: "clue", kind: "cmd",
       fields: [["DHCP Enabled", "No", "Set by hand"], ["IPv4 Address", "10.30.5.45", "Correct"], ["Subnet Mask", "255.0.0.0", "Wrong: Leeds is 255.255.255.0. This says 'all 16 million 10.x addresses are local'"], ["Default Gateway", "10.30.5.1", "Correct"], ["DNS Servers", "10.30.5.1", "Correct: the Leeds router forwards DNS"]],
       raw: R`Ethernet adapter Ethernet:

   Physical Address. . . . . . . . . : 00-00-5E-00-53-45
   DHCP Enabled. . . . . . . . . . . : No
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.30.5.45(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.0.0.0
   Default Gateway . . . . . . . . . : 10.30.5.1
   DNS Servers . . . . . . . . . . . : 10.30.5.1`}]},
    {title: "The web works", sub: "Internet addresses use the gateway", ph: 7,
     what: "Websites load fine. Internet addresses don't start with 10, so the PC knows they're elsewhere and sends them to the router, exactly as it should. That's why this one is so confusing.",
     check: "Browsing works and pinging an internet address works. The fault only shows up for other 10.x networks.",
     tech: "203.0.113.80 doesn't match 10.0.0.0/8, so it uses the default route via 10.30.5.1. The Leeds router is also on-link under either mask, so DNS via 10.30.5.1 works too.",
     msgs: [{from: "pc", to: "rtr", label: "Web traffic via gateway", kind: "normal"}, {from: "rtr", to: "inet", label: "Out to the internet", kind: "normal"}, {from: "inet", to: "pc", label: "Pages load", kind: "data"}],
     evidence: []},
    {title: "Look up the file server", sub: "The name works fine", ph: 3,
     what: "Opening the S: drive means finding fs01. The PC asks its DNS server (the Leeds router) and gets the right answer straight away: 10.20.0.20. So names aren't the problem.",
     check: "nslookup fs01.corp.contoso.com returns 10.20.0.20.",
     tech: "The Leeds router forwards DNS to head office and returns the A record. 'Non-authoritative answer' because the router isn't authoritative for corp.contoso.com.",
     msgs: [{from: "pc", to: "rtr", label: "DNS: A? fs01.corp.contoso.com", kind: "normal"}, {from: "rtr", to: "pc", label: "10.20.0.20", kind: "data"}],
     cmds: {win: R`nslookup fs01.corp.contoso.com`, nix: R`dig fs01.corp.contoso.com`},
     evidence: [{t: "09:14:30", src: "LEEDS-CAD1 · nslookup", title: "nslookup fs01.corp.contoso.com → 10.20.0.20", sev: "clue", kind: "cmd",
       fields: [["Answer", "10.20.0.20", "Correct: DNS is working"]],
       raw: R`C:\> nslookup fs01.corp.contoso.com
Server:  leeds-rtr.corp.contoso.com
Address:  10.30.5.1

Non-authoritative answer:
Name:    fs01.corp.contoso.com
Address:  10.20.0.20`}]},
    {title: "'It's in this room', it thinks", sub: "ARP for a server miles away", ph: 4,
     what: "10.20.0.20 starts with 10, and the mask says every 10.x address is local. So instead of handing the traffic to the router, the PC shouts on the Leeds network: 'Who has 10.20.0.20?' The file server is at head office, so nothing in Leeds answers.",
     check: "A capture shows ARP requests for 10.20.0.20. A PC should never ARP for an address on another site; it should only ARP for its gateway.",
     tech: "10.20.0.20 AND 255.0.0.0 = 10.0.0.0, which equals the PC's own network (10.30.5.45 AND 255.0.0.0), so the destination is treated as on-link. ARP is local-only, so the request never leaves Leeds.",
     msgs: [{from: "pc", to: "fs", label: "ARP: who has 10.20.0.20?", kind: "bad", lost: "No reply"}],
     facts: [["10.30.5.45 AND 255.0.0.0", "10.0.0.0"], ["10.20.0.20 AND 255.0.0.0", "10.0.0.0 (same, so 'local')"], ["With 255.255.255.0", "10.30.5.0 vs 10.20.0.0 (different, so 'remote')"]],
     cmds: {win: R`arp -a`, nix: R`arp -a`},
     evidence: [{t: "09:15:02", src: "Packet capture · LEEDS-CAD1", title: "ARP: Who has 10.20.0.20? Tell 10.30.5.45 (no reply)", sev: "warn", kind: "packet", pkt: "arp-remote-server"}]},
    {title: "Unreachable", sub: "And the routing table shows why", ph: 4,
     what: "With no ARP answer, the PC reports the file server as unreachable, from its own address. The routing table gives the game away: a single line claiming the whole of 10.0.0.0 is directly connected.",
     check: "ping 10.20.0.20 says 'Reply from 10.30.5.45: Destination host unreachable'. route print shows 10.0.0.0 255.0.0.0 On-link.",
     tech: "The connected route 10.0.0.0/8 is more specific than the default route 0.0.0.0/0, so it wins for every 10.x destination. ARP fails, so Windows reports 'Destination host unreachable' itself without sending anything.",
     msgs: [], focus: ["pc"], fault: ["pc"], callout: "10.0.0.0/8 'on-link'",
     cmds: {win: R`ping 10.20.0.20
route print -4`, nix: R`netstat -rn      # macOS
ip route         # Linux`},
     evidence: [
      {t: "09:15:40", src: "LEEDS-CAD1 · ping", title: "ping 10.20.0.20: 'Reply from 10.30.5.45: Destination host unreachable'", sev: "err", kind: "cmd",
       fields: [["Reply from", "10.30.5.45", "The PC itself: it couldn't find the destination on its 'local' network"]],
       raw: R`C:\> ping 10.20.0.20

Pinging 10.20.0.20 with 32 bytes of data:
Reply from 10.30.5.45: Destination host unreachable.
Reply from 10.30.5.45: Destination host unreachable.
Reply from 10.30.5.45: Destination host unreachable.
Reply from 10.30.5.45: Destination host unreachable.

Ping statistics for 10.20.0.20:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`},
      {t: "09:16:10", src: "LEEDS-CAD1 · route print", title: "Route 10.0.0.0 255.0.0.0 On-link", sev: "err", kind: "cmd",
       fields: [["0.0.0.0 / 0.0.0.0", "via 10.30.5.1", "Default route: fine"], ["10.0.0.0 / 255.0.0.0", "On-link", "Claims every 10.x address is local. It should be 10.30.5.0 / 255.255.255.0"]],
       raw: R`IPv4 Route Table
===========================================================================
Active Routes:
Network Destination        Netmask          Gateway       Interface  Metric
          0.0.0.0          0.0.0.0        10.30.5.1       10.30.5.45     25
         10.0.0.0        255.0.0.0         On-link        10.30.5.45    281
       10.30.5.45  255.255.255.255         On-link        10.30.5.45    281
   10.255.255.255  255.255.255.255         On-link        10.30.5.45    281`}]}
  ],
  fixed: [
    {title: "A fixed address, typed in", sub: "With the right mask", ph: 2,
     what: "The mask is corrected to 255.255.255.0, the same as every other PC in Leeds. Now only 10.30.5.x counts as 'in this room'.",
     check: "ipconfig /all shows Subnet Mask 255.255.255.0.",
     tech: "10.30.5.45/24: on-link range 10.30.5.0–10.30.5.255.",
     msgs: [], focus: ["pc"], callout: "Mask: 255.255.255.0",
     evidence: [{t: "09:30:15", src: "LEEDS-CAD1 · ipconfig /all", title: "Subnet Mask 255.255.255.0", sev: "ok", kind: "cmd",
       fields: [["Subnet Mask", "255.255.255.0", "Matches the Leeds network"]],
       raw: R`   IPv4 Address. . . . . . . . . . . : 10.30.5.45(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.30.5.1`}]},
    1, {use: 2, times: ["09:30:40"]},
    {title: "Remote, so use the gateway", sub: "Through the router and the VPN", ph: 4,
     what: "10.20.0.20 is no longer 'local', so the PC hands the traffic to the Leeds router, which sends it through the site-to-site VPN to head office.",
     check: "tracert shows the Leeds router as the first hop, then head office.",
     tech: "10.20.0.20 doesn't match 10.30.5.0/24, so it uses the default route via 10.30.5.1. The router sends it into the IPsec tunnel to the head-office firewall (10.20.0.1).",
     msgs: [{from: "pc", to: "rtr", label: "Packet for 10.20.0.20", kind: "normal"}, {from: "rtr", to: "vpn", label: "Into the tunnel", kind: "normal"}, {from: "vpn", to: "fs", label: "Delivered at head office", kind: "normal"}, {from: "fs", to: "pc", label: "Reply", kind: "data"}],
     cmds: {win: R`tracert -d 10.20.0.20
route print -4`, nix: R`traceroute -n 10.20.0.20`},
     evidence: [
      {t: "09:31:02", src: "LEEDS-CAD1 · route print", title: "Route 10.30.5.0 255.255.255.0 On-link", sev: "ok", kind: "cmd",
       fields: [["10.30.5.0 / 255.255.255.0", "On-link", "Only Leeds addresses are local now"]],
       raw: R`Network Destination        Netmask          Gateway       Interface  Metric
          0.0.0.0          0.0.0.0        10.30.5.1       10.30.5.45     25
        10.30.5.0    255.255.255.0         On-link        10.30.5.45    281`},
      {t: "09:31:20", src: "LEEDS-CAD1 · tracert", title: "tracert -d 10.20.0.20: via 10.30.5.1", sev: "ok", kind: "cmd",
       fields: [["Hop 1", "10.30.5.1", "The Leeds router"], ["Hop 2", "10.20.0.1", "Head office firewall, at the far end of the VPN"], ["Hop 3", "10.20.0.20", "FS01"]],
       raw: R`C:\> tracert -d 10.20.0.20

Tracing route to 10.20.0.20 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  10.30.5.1
  2    12 ms    11 ms    12 ms  10.20.0.1
  3    12 ms    12 ms    12 ms  10.20.0.20

Trace complete.`}]},
    {title: "The S: drive opens", sub: "SMB on TCP 445", ph: 7,
     what: "The file share opens and the CAD drawings load.",
     check: "Test-NetConnection to fs01 on port 445 succeeds.",
     tech: "TCP 445 (SMB) to 10.20.0.20 completes the handshake through the tunnel.",
     msgs: [{from: "pc", to: "fs", label: "SMB: open \\\\fs01\\cad", kind: "normal"}, {from: "fs", to: "pc", label: "Files", kind: "data"}],
     cmds: {win: R`Test-NetConnection fs01.corp.contoso.com -Port 445`, nix: R`nc -vz fs01.corp.contoso.com 445`},
     evidence: [{t: "09:31:45", src: "LEEDS-CAD1 · PowerShell", title: "Test-NetConnection fs01 -Port 445: TcpTestSucceeded True", sev: "ok", kind: "cmd",
       fields: [["TcpTestSucceeded", "True", "The file server answered on port 445"]],
       raw: R`PS C:\> Test-NetConnection fs01.corp.contoso.com -Port 445

ComputerName     : fs01.corp.contoso.com
RemoteAddress    : 10.20.0.20
RemotePort       : 445
InterfaceAlias   : Ethernet
SourceAddress    : 10.30.5.45
TcpTestSucceeded : True`}]}
  ],
  fixes: [
    {id: "flush", kind: "herring", name: "Run ipconfig /flushdns", short: "Flush DNS", at: 5,
     desc: "Clear the PC's DNS cache.",
     result: "DNS was already returning the right address (10.20.0.20). Flushing just means it asks again and gets the same correct answer. The problem comes after the name is found.",
     ev: {t: "09:20:05", src: "LEEDS-CAD1 · nslookup", title: "After flushing: fs01 still resolves to 10.20.0.20", sev: "warn", kind: "cmd", fields: [["Answer", "10.20.0.20", "Unchanged and correct"]], raw: R`Name:    fs01.corp.contoso.com
Address:  10.20.0.20`}},
    {id: "byip", kind: "herring", name: "Map the drive by IP instead of name", short: "Map by IP", at: 5,
     desc: "Use \\\\10.20.0.20\\cad instead of \\\\fs01\\cad.",
     result: "By IP, the PC still thinks 10.20.0.20 is local and still ARPs for it on the Leeds network. Skipping DNS doesn't help when DNS was never the problem.",
     ev: {t: "09:22:30", src: "Packet capture · LEEDS-CAD1", title: "Still ARPing for 10.20.0.20", sev: "warn", kind: "log", fields: [["ARP", "Who has 10.20.0.20?", "Same mistake, no name involved"]], raw: "ARP, Request who-has 10.20.0.20 tell 10.30.5.45"}},
    {id: "vpn", kind: "herring", name: "Restart the site-to-site VPN", short: "Restart VPN", at: 5,
     desc: "Bounce the tunnel between Leeds and head office.",
     result: "Colleagues in Leeds are using that tunnel right now without trouble. Traffic from this PC never even reaches the router, so the tunnel can't be the problem. (And everyone in Leeds just lost their connection to head office for a minute.)",
     ev: {t: "09:25:00", src: "Leeds router · log", title: "Tunnel re-established: CAD PC still can't reach FS01", sev: "warn", kind: "log", fields: [["Tunnel", "Up", "It was up before, too"]], raw: "IPsec tunnel to head office re-established (phase 2 up)"}},
    {id: "mask", kind: "fix", name: "Correct the subnet mask to 255.255.255.0", short: "Fix the mask", at: 1,
     desc: "Set the mask to match the Leeds network (or use a DHCP reservation instead).",
     result: "Now only 10.30.5.x counts as local. Traffic for 10.20.0.20 goes to the Leeds router, through the VPN to head office, and the S: drive opens. A DHCP reservation would have avoided the typo altogether.",
     ev: {t: "09:30:00", src: "LEEDS-CAD1 · Settings", title: "IPv4 subnet mask changed to 255.255.255.0 (/24)", sev: "ok", kind: "log", fields: [["Subnet mask", "255.255.255.0", "Same as prefix length /24"]], raw: "Internet Protocol Version 4 (TCP/IPv4) Properties\n  IP address:           10.30.5.45\n  Subnet mask:          255.255.255.0\n  Default gateway:      10.30.5.1\n  Preferred DNS server: 10.30.5.1"}}
  ],
  debrief: {
    check: ["If some remote networks work and others don't, compare the subnet mask with a working PC", "ping the far address: 'Reply from <your own IP>: Destination host unreachable' points to a local decision", "route print / ip route: is there an 'on-link' route that's far too big?", "A capture showing ARP for a remote address is the smoking gun"],
    fix: ["Set the correct mask (255.255.255.0 / prefix 24 here)", "Better: DHCP with a reservation, so nobody types it"],
    prevent: ["Use DHCP reservations instead of static IPs where possible", "When typing a static IP, never trust the auto-filled mask", "Keep each site's network details in one place"]
  },
  tell: "The internet works but head-office addresses are 'unreachable' from the PC's own IP, the PC ARPs for a remote server, and the mask is 255.0.0.0 where everyone else has 255.255.255.0."
},

/* ============ 6. BLOCKED PORT ============ */
{
  id: "blocked-port", cat: "firewall", name: "Ping yes, app no", sub: "A server firewall with no rule for the app",
  impact: "Everyone, for one app", layers: ["L4 TCP", "Host firewall"],
  cause: "The server's firewall has no inbound rule allowing the app's port (TCP 8443)",
  ticket: {ref: "INC-20466", from: "Jo Bennett · Warehouse", text: "The new StockTrack page just spins and then says it took too long to respond. IT said it went live this morning?"},
  intro: "StockTrack was installed on APP02 yesterday and works when tested on the server itself. From everyone's desks it just times out. The server is up and answers ping, but its firewall silently drops anything sent to the app's port, because nobody added a rule for it.",
  summary: "StockTrack listens on TCP 8443 on APP02 (10.20.0.30). Windows Defender Firewall's default inbound action is block, and the installer didn't create a rule for 8443. ICMP echo is allowed by Group Policy, so ping works. SYNs to 8443 are dropped without a reply, so clients retry and time out. Locally on the server, the connection works because it never crosses the inbound filter.",
  facts: [["Symptom", "Ping works, app times out"], ["Root cause", "No inbound firewall rule for TCP 8443"], ["Who's affected", "Every client"], ["Key evidence", "TcpTestSucceeded False, LISTENING on the server, DROP in the firewall log"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Jo's laptop", sub: "10.20.10.62", x: 120, y: 330},
    {id: "core", kind: "router", label: "Core switch", sub: "10.20.10.1", x: 390, y: 330},
    {id: "fw", kind: "fw", label: "APP02 firewall", sub: "Windows Defender Firewall", x: 650, y: 330},
    {id: "app", kind: "server", label: "APP02", sub: "10.20.0.30 · StockTrack :8443", x: 900, y: 330}
  ],
  links: [["lap", "core"], ["core", "fw"], ["fw", "app"]],
  lanes: ["lap", "core", "fw", "app"],
  stage: 5,
  steps: [
    {title: "The server is there", sub: "Ping gets replies", ph: 4,
     what: "First check: is APP02 even reachable? The engineer pings it and gets replies. So the address, the routing and the server are all fine. Contoso's policy allows ping to servers, which is why this works.",
     check: "ping 10.20.0.30 replies. Note: ping only tests ICMP, not the app's port.",
     tech: "ICMP echo is permitted by a Group Policy firewall rule. TTL 127 = Windows' 128 minus one routed hop. This proves layers 1–3 end to end, nothing above.",
     msgs: [{from: "lap", to: "app", label: "ping 10.20.0.30", kind: "normal"}, {from: "app", to: "lap", label: "Reply", kind: "data"}],
     cmds: {win: R`ping 10.20.0.30`, nix: R`ping -c 4 10.20.0.30`},
     evidence: [{t: "10:13:30", src: "Jo's laptop · ping", title: "ping 10.20.0.30: 4 replies", sev: "clue", kind: "cmd",
       fields: [["Replies", "4 of 4", "The server is up and routable"], ["TTL", "127", "128 from Windows, minus one hop through the core switch"]],
       raw: R`C:\> ping 10.20.0.30

Pinging 10.20.0.30 with 32 bytes of data:
Reply from 10.20.0.30: bytes=32 time<1ms TTL=127
Reply from 10.20.0.30: bytes=32 time<1ms TTL=127
Reply from 10.20.0.30: bytes=32 time<1ms TTL=127
Reply from 10.20.0.30: bytes=32 time<1ms TTL=127

Ping statistics for 10.20.0.30:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 0ms, Average = 0ms`}]},
    {title: "Knock on port 8443", sub: "TCP SYN: 'can we talk?'", ph: 5,
     what: "The browser starts a connection to StockTrack on port 8443 by sending a 'can we talk?' message (a SYN). The server's own firewall has no rule allowing port 8443, so it quietly throws the message away. No 'no', just nothing.",
     check: "A capture on the laptop shows SYNs leaving for 10.20.0.30:8443 and no SYN-ACK coming back.",
     tech: "TCP SYN 10.20.10.62:50812 → 10.20.0.30:8443. The host firewall's default inbound action is block, which drops silently. A closed port with no firewall would answer with a RST instead ('actively refused').",
     msgs: [{from: "lap", to: "fw", label: "SYN → 10.20.0.30:8443", kind: "bad", lost: "Dropped"}],
     evidence: [{t: "10:14:02", src: "Packet capture · Jo's laptop", title: "TCP SYN to 10.20.0.30:8443: no reply", sev: "warn", kind: "packet", pkt: "tcp-syn-8443"}]},
    {title: "Silence, then retries", sub: "Test-NetConnection fails", ph: 5,
     what: "The laptop tries again, waiting a little longer each time, then gives up. The browser says the site took too long to respond. Test-NetConnection confirms it: the server pings, but the port doesn't connect.",
     check: "Test-NetConnection 10.20.0.30 -Port 8443 shows PingSucceeded True and TcpTestSucceeded False. That combination means 'the server's there, but something's blocking or not listening on the port'.",
     tech: "SYN retransmissions with exponential backoff, then the connect attempt fails. A timeout points to a silent drop (a firewall); a RST would mean nothing is listening.",
     msgs: [], focus: ["lap", "fw"], fault: ["fw"], callout: "No SYN-ACK: timed out",
     cmds: {win: R`Test-NetConnection 10.20.0.30 -Port 8443`, nix: R`nc -vz -w 5 10.20.0.30 8443`},
     evidence: [{t: "10:14:23", src: "Jo's laptop · PowerShell", title: "Test-NetConnection -Port 8443: PingSucceeded True, TcpTestSucceeded False", sev: "err", kind: "cmd",
       fields: [["PingSucceeded", "True", "The server is reachable"], ["TcpTestSucceeded", "False", "The port isn't: blocked, or nothing listening"]],
       raw: R`PS C:\> Test-NetConnection 10.20.0.30 -Port 8443
WARNING: TCP connect to (10.20.0.30 : 8443) failed


ComputerName           : 10.20.0.30
RemoteAddress          : 10.20.0.30
RemotePort             : 8443
InterfaceAlias         : Ethernet
SourceAddress          : 10.20.10.62
PingSucceeded          : True
PingReplyDetails (RTT) : 0 ms
TcpTestSucceeded       : False`}]},
    {title: "On the server: listening, but dropped", sub: "netstat and the firewall log", ph: 5,
     what: "On APP02 itself, StockTrack is running and listening on port 8443. The firewall log (switched on for troubleshooting) shows Jo's attempts arriving and being dropped. So the app is fine; the firewall is the problem.",
     check: "netstat shows LISTENING on 0.0.0.0:8443. pfirewall.log shows DROP lines for TCP from 10.20.10.62 to port 8443.",
     tech: "A socket bound to 0.0.0.0:8443 accepts on all interfaces. The firewall log records DROP TCP … 8443 52 S: the 52-byte SYN, flag S, path RECEIVE. Dropped-packet logging is off by default and has to be enabled per profile.",
     msgs: [], focus: ["fw", "app"], callout: "Listening, but the firewall drops it",
     cmds: {win: R`# On APP02
netstat -ano | findstr :8443
Get-NetFirewallRule -Enabled True -Direction Inbound | Get-NetFirewallPortFilter | Where-Object LocalPort -eq 8443
Set-NetFirewallProfile -Profile Domain -LogBlocked True    # then read %systemroot%\system32\LogFiles\Firewall\pfirewall.log`, nix: R`sudo ss -ltnp | grep 8443      # Linux: is anything listening?`},
     evidence: [
      {t: "10:20:11", src: "APP02 · netstat", title: "TCP 0.0.0.0:8443 LISTENING (PID 3120)", sev: "clue", kind: "cmd",
       fields: [["Local Address", "0.0.0.0:8443", "Listening on every interface"], ["State", "LISTENING", "StockTrack is running and waiting"], ["PID", "3120", "The StockTrack service"]],
       raw: R`C:\> netstat -ano | findstr :8443
  TCP    0.0.0.0:8443           0.0.0.0:0              LISTENING       3120`},
      {t: "10:24:02", src: "APP02 · pfirewall.log", title: "DROP TCP 10.20.10.62 → 10.20.0.30:8443 (SYN)", sev: "err", kind: "log",
       fields: [["action", "DROP", "Blocked by the firewall"], ["src-ip / dst-ip", "10.20.10.62 → 10.20.0.30", ""], ["dst-port", "8443", "StockTrack's port"], ["size / tcpflags", "52 / S", "A 52-byte SYN: a connection attempt"], ["path", "RECEIVE", "Inbound"]],
       raw: R`2026-11-20 10:24:02 DROP TCP 10.20.10.62 10.20.0.30 50812 8443 52 S 2316488701 0 64240 - - - RECEIVE
2026-11-20 10:24:05 DROP TCP 10.20.10.62 10.20.0.30 50812 8443 52 S 2316488701 0 64240 - - - RECEIVE
2026-11-20 10:24:11 DROP TCP 10.20.10.62 10.20.0.30 50812 8443 52 S 2316488701 0 64240 - - - RECEIVE`}]}
  ],
  fixed: [0,
    {title: "Knock on port 8443", sub: "SYN, SYN-ACK, ACK", ph: 5,
     what: "This time the firewall has a rule allowing port 8443 from staff networks. The SYN reaches StockTrack, which answers 'yes, let's talk' (SYN-ACK), and the laptop confirms (ACK). That's the three-way handshake.",
     check: "A capture shows SYN, SYN-ACK, ACK. Test-NetConnection shows TcpTestSucceeded True.",
     tech: "The inbound allow rule matches TCP 8443 from 10.20.0.0/16 on the Domain profile, so the SYN is passed to the listening socket.",
     msgs: [{from: "lap", to: "app", label: "SYN", kind: "normal"}, {from: "app", to: "lap", label: "SYN-ACK", kind: "data"}, {from: "lap", to: "app", label: "ACK", kind: "normal"}],
     cmds: {win: R`Test-NetConnection 10.20.0.30 -Port 8443`, nix: R`nc -vz 10.20.0.30 8443`},
     evidence: [{t: "10:46:10", src: "Jo's laptop · PowerShell", title: "Test-NetConnection -Port 8443: TcpTestSucceeded True", sev: "ok", kind: "cmd",
       fields: [["TcpTestSucceeded", "True", "The handshake completed"]],
       raw: R`PS C:\> Test-NetConnection 10.20.0.30 -Port 8443

ComputerName     : 10.20.0.30
RemoteAddress    : 10.20.0.30
RemotePort       : 8443
InterfaceAlias   : Ethernet
SourceAddress    : 10.20.10.62
TcpTestSucceeded : True`}]},
    {title: "StockTrack loads", sub: "Secure it, then use it", ph: 7,
     what: "With the connection open, the browser sets up encryption and the StockTrack login page appears.",
     check: "The page loads for Jo and the rest of the warehouse.",
     tech: "TLS handshake over the established TCP connection, then HTTPS requests to the app.",
     msgs: [{from: "lap", to: "app", label: "TLS handshake + HTTPS", kind: "normal"}, {from: "app", to: "lap", label: "StockTrack login page", kind: "data"}],
     evidence: []}
  ],
  fixes: [
    {id: "flush", kind: "herring", name: "Run ipconfig /flushdns", short: "Flush DNS", at: 4,
     desc: "Clear the laptop's DNS cache.",
     result: "Test-NetConnection used the IP address directly and still failed, so names aren't involved. The connection is being dropped after the address is known.",
     ev: {t: "10:30:00", src: "Jo's laptop · PowerShell", title: "After flushing DNS: TcpTestSucceeded still False", sev: "warn", kind: "cmd", fields: [["TcpTestSucceeded", "False", ""]], raw: R`WARNING: TCP connect to (10.20.0.30 : 8443) failed`}},
    {id: "browser", kind: "herring", name: "Try a different browser", short: "Other browser", at: 4,
     desc: "Open StockTrack in another browser.",
     result: "Every browser opens a TCP connection to 8443 the same way, and the firewall drops it before any browser gets a say.",
     ev: {t: "10:31:20", src: "Jo's laptop · browser", title: "Second browser: 'took too long to respond'", sev: "warn", kind: "browser", fields: [["Result", "Timed out", "Same drop"]], raw: "stocktrack.corp.contoso.com took too long to respond."}},
    {id: "restartapp", kind: "herring", name: "Restart the StockTrack service", short: "Restart app", at: 4,
     desc: "Restart the app on APP02.",
     result: "The app was already running and listening on 8443 (netstat shows LISTENING). Restarting it doesn't change the firewall, so the SYNs are still dropped before they reach it.",
     ev: {t: "10:33:40", src: "APP02 · pfirewall.log", title: "After the restart: still DROP on 8443", sev: "warn", kind: "log", fields: [["action", "DROP", "Unchanged"]], raw: R`2026-11-20 10:33:40 DROP TCP 10.20.10.62 10.20.0.30 50822 8443 52 S 1180244315 0 64240 - - - RECEIVE`}},
    {id: "rule", kind: "fix", name: "Add an inbound firewall rule for TCP 8443", short: "Firewall rule", at: 2,
     desc: "Allow TCP 8443 on APP02, from staff networks only.",
     result: "APP02's firewall now lets TCP 8443 in from 10.20.0.0/16. The SYN gets a SYN-ACK and StockTrack loads. Scoping the rule to staff networks keeps the port closed to everything else. (Turning the firewall off would 'work' too, but it would open every port on the server.)",
     ev: {t: "10:45:50", src: "APP02 · PowerShell", title: "New-NetFirewallRule: allow TCP 8443 inbound from 10.20.0.0/16", sev: "ok", kind: "cmd",
       fields: [["Direction", "Inbound", ""], ["LocalPort", "8443", "Only StockTrack's port"], ["RemoteAddress", "10.20.0.0/16", "Staff networks only"], ["Profile", "Domain", "The profile APP02 uses on the company network"]],
       raw: R`PS C:\> New-NetFirewallRule -DisplayName "StockTrack (TCP 8443 in)" -Direction Inbound -Protocol TCP -LocalPort 8443 -RemoteAddress 10.20.0.0/16 -Profile Domain -Action Allow`}}
  ],
  debrief: {
    check: ["Ping first, but remember it only proves the server is reachable", "Test-NetConnection -Port (or nc -vz): does the port connect?", "On the server: netstat -ano — is anything listening?", "Timed out = something dropping; 'actively refused' = nothing listening", "Firewall log: look for DROP on the port"],
    fix: ["Add a scoped inbound allow rule for the app's port", "Then confirm with Test-NetConnection and the app itself"],
    prevent: ["Make 'firewall rule' part of the go-live checklist for new apps", "Test from a client, not just on the server", "Manage server firewall rules centrally (Group Policy or Intune)"]
  },
  tell: "Ping works but the port test fails with a timeout, the app shows LISTENING on the server, and the server's firewall log has DROP lines for that port."
},

/* ============ 7. VPN WITHOUT INTERNAL DNS ============ */
{
  id: "vpn-dns", cat: "remote", name: "VPN on, file share off", sub: "The tunnel works, but names don't",
  impact: "Every VPN user", layers: ["L7 DNS", "VPN (split tunnel)"],
  cause: "The new VPN profile doesn't give the laptop the internal DNS servers or DNS suffix",
  ticket: {ref: "INC-20471", from: "Ellie Marsh · HR (working from home)", text: "The VPN says connected but the S: drive says it can't be found. It worked last week. Teams and email are fine."},
  intro: "Ellie's VPN connects and the tunnel to head office works. But when her laptop asks 'where is fs01?', it asks her home router, which has never heard of Contoso's internal names. Monday's new VPN profile forgot to hand out the company DNS servers.",
  summary: "Split-tunnel VPN: only 10.20.0.0/16 is routed through the tunnel. The VPN profile pushed on Monday has no DNS servers or DNS suffix for corp.contoso.com, so the VPN interface has none. Internal names are sent to the home router (192.168.1.1), which forwards them to public DNS and gets NXDOMAIN. Traffic by IP to 10.20.0.20 works through the tunnel.",
  facts: [["Symptom", "VPN connected, internal names fail"], ["Root cause", "No internal DNS servers or suffix in the VPN profile"], ["Who's affected", "Everyone who got Monday's profile"], ["Key evidence", "VPN adapter with no DNS servers; NXDOMAIN from the home router"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Ellie's laptop", sub: "Home Wi-Fi 192.168.1.23", x: 110, y: 330},
    {id: "home", kind: "router", label: "Home router", sub: "192.168.1.1 · DNS", x: 330, y: 520},
    {id: "pub", kind: "cloud", label: "Public DNS", sub: "Internet resolvers", x: 560, y: 560},
    {id: "vpn", kind: "vpn", label: "Contoso VPN gateway", sub: "203.0.113.25", x: 400, y: 150},
    {id: "dns", kind: "dns", label: "DC01 DNS", sub: "10.20.0.10", x: 700, y: 120},
    {id: "fs", kind: "server", label: "FS01", sub: "10.20.0.20", x: 900, y: 330}
  ],
  links: [["lap", "home"], ["home", "pub"], ["lap", "vpn"], ["vpn", "dns"], ["vpn", "fs"]],
  lanes: ["lap", "home", "pub", "vpn", "dns", "fs"],
  stage: 3,
  steps: [
    {title: "Tunnel up", sub: "Connected, with a VPN address", ph: 1,
     what: "Ellie connects the VPN. It signs her in and gives her laptop a company address (10.30.8.14) and a route for head-office networks. But look closely: the VPN adapter has no DNS servers at all.",
     check: "ipconfig /all shows the VPN adapter with an IPv4 address but no 'DNS Servers' line, while the Wi-Fi adapter lists 192.168.1.1.",
     tech: "Split tunnel: only 10.20.0.0/16 goes via the tunnel; everything else uses home Wi-Fi. The new profile is missing its DNS servers and the corp.contoso.com suffix, so the VPN interface has no resolvers of its own.",
     msgs: [{from: "lap", to: "vpn", label: "Sign in + build tunnel", kind: "normal"}, {from: "vpn", to: "lap", label: "10.30.8.14 + route 10.20.0.0/16", kind: "data"}],
     cmds: {win: R`ipconfig /all
Get-DnsClientServerAddress -AddressFamily IPv4`, nix: R`scutil --dns        # macOS: look for a resolver on the VPN interface
resolvectl status   # Linux`},
     evidence: [{t: "08:55:20", src: "Ellie's laptop · ipconfig /all", title: "VPN adapter: IPv4 10.30.8.14, no DNS servers", sev: "clue", kind: "cmd",
       fields: [["Contoso VPN · IPv4", "10.30.8.14", "The tunnel is up"], ["Contoso VPN · DNS Servers", "(none)", "The line is missing altogether"], ["Contoso VPN · DNS suffix", "(blank)", "No corp.contoso.com either"], ["Wi-Fi · DNS Servers", "192.168.1.1", "So every lookup goes to the home router"]],
       raw: R`PPP adapter Contoso VPN:

   Connection-specific DNS Suffix  . :
   Description . . . . . . . . . . . : Contoso VPN
   DHCP Enabled. . . . . . . . . . . : No
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.30.8.14(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.255
   Default Gateway . . . . . . . . . :

Wireless LAN adapter Wi-Fi:

   IPv4 Address. . . . . . . . . . . : 192.168.1.23(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   DNS Servers . . . . . . . . . . . : 192.168.1.1`}]},
    {title: "The tunnel itself works", sub: "Ping the file server by IP", ph: 4,
     what: "The engineer pings the file server by its address, 10.20.0.20. It replies through the tunnel. So the VPN, the routing and the file server are all fine.",
     check: "ping 10.20.0.20 works. route print shows 10.20.0.0 going via the VPN interface.",
     tech: "The split-tunnel route 10.20.0.0/16 points at the VPN interface (10.30.8.14), so traffic to 10.20.0.20 is encapsulated and delivered.",
     msgs: [{from: "lap", to: "vpn", label: "ping 10.20.0.20 (in the tunnel)", kind: "normal"}, {from: "vpn", to: "fs", label: "Delivered", kind: "normal"}, {from: "fs", to: "lap", label: "Reply", kind: "data"}],
     cmds: {win: R`ping 10.20.0.20
route print -4`, nix: R`ping -c 4 10.20.0.20
netstat -rn   # macOS
ip route      # Linux`},
     evidence: [{t: "08:57:02", src: "Ellie's laptop · ping", title: "ping 10.20.0.20: replies through the tunnel", sev: "clue", kind: "cmd",
       fields: [["Replies", "4 of 4", "The tunnel and FS01 are fine"]],
       raw: R`C:\> ping 10.20.0.20

Pinging 10.20.0.20 with 32 bytes of data:
Reply from 10.20.0.20: bytes=32 time=21ms TTL=127
Reply from 10.20.0.20: bytes=32 time=20ms TTL=127
Reply from 10.20.0.20: bytes=32 time=22ms TTL=127
Reply from 10.20.0.20: bytes=32 time=20ms TTL=127

Ping statistics for 10.20.0.20:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 20ms, Maximum = 22ms, Average = 20ms`}]},
    {title: "Ask the wrong DNS server", sub: "The home router has never heard of fs01", ph: 3,
     what: "To open \\\\fs01, the laptop needs fs01's address. The only DNS server it knows is the home router, so it asks that. The router asks the public internet, and the internet says 'no such name': corp.contoso.com only exists inside Contoso.",
     check: "nslookup fs01.corp.contoso.com shows the server as 192.168.1.1 and the answer 'Non-existent domain'.",
     tech: "The query leaves on the Wi-Fi interface (outside the tunnel) to 192.168.1.1, which recurses to public DNS and returns NXDOMAIN. With no corp.contoso.com suffix on the VPN interface, a short name like 'fs01' fares no better.",
     msgs: [{from: "lap", to: "home", label: "DNS: A? fs01.corp.contoso.com", kind: "bad"}, {from: "home", to: "pub", label: "Forwarded", kind: "normal"}, {from: "pub", to: "home", label: "NXDOMAIN", kind: "data"}, {from: "home", to: "lap", label: "No such name", kind: "bad"}],
     fault: ["vpn"],
     cmds: {win: R`nslookup fs01.corp.contoso.com
Resolve-DnsName fs01.corp.contoso.com`, nix: R`dig fs01.corp.contoso.com`},
     evidence: [
      {t: "08:58:10", src: "Packet capture · Ellie's laptop", title: "DNS query for fs01.corp.contoso.com sent to the home router", sev: "warn", kind: "packet", pkt: "dns-query-home"},
      {t: "08:58:12", src: "Ellie's laptop · nslookup", title: "nslookup fs01.corp.contoso.com: Non-existent domain (server 192.168.1.1)", sev: "err", kind: "cmd",
       fields: [["Server", "192.168.1.1", "The home router, not a Contoso DNS server"], ["Result", "Non-existent domain", "True, as far as the public internet knows"]],
       raw: R`C:\> nslookup fs01.corp.contoso.com
Server:  UnKnown
Address:  192.168.1.1

*** UnKnown can't find fs01.corp.contoso.com: Non-existent domain`}]},
    {title: "\\\\fs01 can't be found", sub: "No name, no share", ph: 7,
     what: "Without an address for fs01, Windows can't open the share and says it can't be found. Teams and email are fine because they use public internet names the home router can find.",
     check: "Get-DnsClientServerAddress shows the VPN interface with an empty list of DNS servers. That's the root cause in one line.",
     tech: "SMB never starts because name resolution fails first. Public names (Microsoft 365) resolve via the home router, which is why only internal services break.",
     msgs: [], focus: ["lap", "vpn"], callout: "Windows can't find \\\\fs01",
     cmds: {win: R`Get-DnsClientServerAddress -AddressFamily IPv4`, nix: R`scutil --dns`},
     evidence: [{t: "08:59:30", src: "Ellie's laptop · PowerShell", title: "Get-DnsClientServerAddress: Contoso VPN has no DNS servers", sev: "err", kind: "cmd",
       fields: [["Contoso VPN", "{}", "Empty: the profile didn't supply any"], ["Wi-Fi", "{192.168.1.1}", "The home router"]],
       raw: R`PS C:\> Get-DnsClientServerAddress -AddressFamily IPv4

InterfaceAlias               Interface Address ServerAddresses
                             Index     Family
--------------               --------- ------- ---------------
Contoso VPN                         31 IPv4    {}
Wi-Fi                               14 IPv4    {192.168.1.1}
Loopback Pseudo-Interface 1          1 IPv4    {}`}]}
  ],
  fixed: [
    {title: "Tunnel up", sub: "With internal DNS this time", ph: 1,
     what: "With the corrected profile, the VPN gives Ellie's laptop a company address, the route to head office, and Contoso's own DNS servers plus the corp.contoso.com suffix.",
     check: "ipconfig /all shows DNS Servers 10.20.0.10 and 10.20.0.11 on the VPN adapter, and suffix corp.contoso.com.",
     tech: "The profile now assigns DNS servers to the VPN interface and the connection-specific suffix corp.contoso.com, so internal names are resolved through the tunnel.",
     msgs: [{from: "lap", to: "vpn", label: "Sign in + build tunnel", kind: "normal"}, {from: "vpn", to: "lap", label: "10.30.8.14 + route + DNS 10.20.0.10", kind: "data"}],
     evidence: [{t: "09:40:05", src: "Ellie's laptop · ipconfig /all", title: "VPN adapter: DNS Servers 10.20.0.10, 10.20.0.11", sev: "ok", kind: "cmd",
       fields: [["DNS Suffix", "corp.contoso.com", ""], ["DNS Servers", "10.20.0.10, 10.20.0.11", "Contoso's own, reached through the tunnel"]],
       raw: R`PPP adapter Contoso VPN:

   Connection-specific DNS Suffix  . : corp.contoso.com
   Description . . . . . . . . . . . : Contoso VPN
   IPv4 Address. . . . . . . . . . . : 10.30.8.14(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.255
   Default Gateway . . . . . . . . . :
   DNS Servers . . . . . . . . . . . : 10.20.0.10
                                       10.20.0.11`}]},
    {use: 1, times: ["09:40:15"]},
    {title: "Ask the right DNS server", sub: "Through the tunnel to DC01", ph: 3,
     what: "Now the question 'where is fs01?' goes through the tunnel to DC01, which knows every internal name and answers straight away: 10.20.0.20.",
     check: "nslookup names dc01 as the server and returns 10.20.0.20, with no 'Non-authoritative' line, because DC01 owns that zone.",
     tech: "Query to 10.20.0.10 via the VPN interface. DC01 is authoritative for corp.contoso.com, so the answer is authoritative.",
     msgs: [{from: "lap", to: "vpn", label: "DNS: A? fs01.corp.contoso.com", kind: "normal"}, {from: "vpn", to: "dns", label: "To DC01", kind: "normal"}, {from: "dns", to: "lap", label: "fs01 = 10.20.0.20", kind: "data"}],
     cmds: {win: R`nslookup fs01.corp.contoso.com`, nix: R`dig fs01.corp.contoso.com`},
     evidence: [{t: "09:40:30", src: "Ellie's laptop · nslookup", title: "nslookup fs01.corp.contoso.com → 10.20.0.20 (server dc01)", sev: "ok", kind: "cmd",
       fields: [["Server", "dc01.corp.contoso.com", ""], ["Answer", "10.20.0.20", ""]],
       raw: R`C:\> nslookup fs01.corp.contoso.com
Server:  dc01.corp.contoso.com
Address:  10.20.0.10

Name:    fs01.corp.contoso.com
Address:  10.20.0.20`}]},
    {title: "The S: drive opens", sub: "SMB through the tunnel", ph: 7,
     what: "With the address found, the share opens through the tunnel, just like in the office.",
     check: "Test-NetConnection fs01 -Port 445 succeeds, from the VPN address.",
     tech: "TCP 445 to 10.20.0.20, sourced from 10.30.8.14 on the VPN interface.",
     msgs: [{from: "lap", to: "vpn", label: "SMB to \\\\fs01\\shared", kind: "normal"}, {from: "vpn", to: "fs", label: "Delivered", kind: "normal"}, {from: "fs", to: "lap", label: "Files", kind: "data"}],
     cmds: {win: R`Test-NetConnection fs01.corp.contoso.com -Port 445`, nix: R`nc -vz fs01.corp.contoso.com 445`},
     evidence: [{t: "09:41:00", src: "Ellie's laptop · PowerShell", title: "Test-NetConnection fs01 -Port 445: TcpTestSucceeded True", sev: "ok", kind: "cmd",
       fields: [["InterfaceAlias", "Contoso VPN", "Went through the tunnel"], ["TcpTestSucceeded", "True", ""]],
       raw: R`PS C:\> Test-NetConnection fs01.corp.contoso.com -Port 445

ComputerName     : fs01.corp.contoso.com
RemoteAddress    : 10.20.0.20
RemotePort       : 445
InterfaceAlias   : Contoso VPN
SourceAddress    : 10.30.8.14
TcpTestSucceeded : True`}]}
  ],
  fixes: [
    {id: "homerouter", kind: "herring", name: "Restart the home router", short: "Restart router", at: 4,
     desc: "Turn Ellie's home router off and on.",
     result: "The home router is answering correctly: corp.contoso.com really doesn't exist on the public internet. It's simply the wrong server to ask, and a restart doesn't change that.",
     ev: {t: "09:05:40", src: "Ellie's laptop · nslookup", title: "After the router restart: still Non-existent domain", sev: "warn", kind: "cmd", fields: [["Server", "192.168.1.1", ""]], raw: R`*** UnKnown can't find fs01.corp.contoso.com: Non-existent domain`}},
    {id: "reconnect", kind: "herring", name: "Disconnect and reconnect the VPN", short: "Reconnect VPN", at: 4,
     desc: "Drop the VPN and connect again.",
     result: "Same profile, same result: the tunnel comes back up, still with no DNS servers on it.",
     ev: {t: "09:07:15", src: "Ellie's laptop · PowerShell", title: "After reconnecting: Contoso VPN still {}", sev: "warn", kind: "cmd", fields: [["Contoso VPN", "{}", "No change"]], raw: R`Contoso VPN                         31 IPv4    {}`}},
    {id: "remap", kind: "herring", name: "Remove and re-map the S: drive", short: "Re-map drive", at: 4,
     desc: "Disconnect the mapped drive and map \\\\fs01\\shared again.",
     result: "Mapping the drive still needs fs01's address, and the laptop still can't find it. Re-mapping uses exactly the same lookup.",
     ev: {t: "09:09:00", src: "Ellie's laptop · Command Prompt", title: "net use: the network path was not found", sev: "warn", kind: "cmd", fields: [["Error", "System error 53", "The network path was not found"]], raw: R`C:\> net use S: \\fs01\shared
System error 53 has occurred.

The network path was not found.`}},
    {id: "profile", kind: "fix", name: "Add internal DNS servers and the corp.contoso.com suffix to the VPN profile", short: "Fix VPN profile", at: 1,
     desc: "Correct the profile centrally and push it to everyone.",
     result: "The VPN now gives laptops 10.20.0.10 and 10.20.0.11 and the corp.contoso.com suffix. Lookups for internal names go through the tunnel to DC01, and \\\\fs01 opens. Fixing the profile centrally fixes every affected user at once.",
     ev: {t: "09:38:00", src: "VPN profile · change record", title: "Profile v2.1: DNS 10.20.0.10/.11, suffix corp.contoso.com added", sev: "ok", kind: "log",
       fields: [["DNS servers", "10.20.0.10, 10.20.0.11", "Added back"], ["DNS suffix", "corp.contoso.com", "Added back"], ["Routes", "10.20.0.0/16 (split tunnel)", "Unchanged"]],
       raw: "VPN profile 'Contoso VPN' v2.1\n  DNS servers: 10.20.0.10, 10.20.0.11\n  DNS suffix: corp.contoso.com\n  Split tunnel routes: 10.20.0.0/16\n  Deployed to: all remote users"}}
  ],
  debrief: {
    check: ["Ping an internal server by IP: if that works, the tunnel is fine", "nslookup an internal name: which server answered?", "ipconfig /all or Get-DnsClientServerAddress: does the VPN adapter have DNS servers?", "Did anything change recently? (new profile, new client version)"],
    fix: ["Put the internal DNS servers and suffix back in the VPN profile", "Push the profile to everyone, not just this user"],
    prevent: ["Test VPN profile changes on a pilot group before rolling out", "Include 'open a file share by name' in the VPN test checklist", "Monitor tickets for 'VPN connected but…' after any change"]
  },
  tell: "The VPN connects and the server pings by IP, but internal names come back 'Non-existent domain' from the home router, and the VPN adapter has no DNS servers."
},

/* ============ 8. WRONG CLOCK ============ */
{
  id: "wrong-clock", cat: "tls", name: "\"Your connection isn't private\"", sub: "Every secure site fails at once",
  impact: "One device", layers: ["L6/7 TLS", "Certificates", "Time"],
  cause: "The laptop's clock is years behind, so every certificate looks 'not yet valid'",
  ticket: {ref: "INC-20479", from: "Dan Hughes · Operations", text: "Got my laptop back from repair. Every website says 'your connection isn't private'. Is it hacked?"},
  intro: "Dan's laptop came back from repair with a new motherboard. Its clock reset to 1 January 2020, and automatic time was switched off. Every website's security certificate says 'valid from 2026', so to Dan's laptop they all look like they're from the future.",
  summary: "System time is 2020-01-01 and 'Set time automatically' is off. Certificates are checked against the local clock: news.example's certificate has notBefore 2026-10-15, so it's 'not yet valid'. Chromium-based browsers show NET::ERR_CERT_DATE_INVALID ('Your clock is behind'). DHCP, DNS and TCP are unaffected. In TLS 1.3 the certificate is encrypted, so a packet capture won't show it; check in the browser instead.",
  facts: [["Symptom", "Certificate errors on every HTTPS site"], ["Root cause", "System clock set to 2020"], ["Who's affected", "One laptop"], ["Key evidence", "NET::ERR_CERT_DATE_INVALID, Get-Date"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Dan's laptop", sub: "LT-DAN · back from repair", x: 120, y: 330},
    {id: "core", kind: "router", label: "Office network", sub: "10.20.10.1", x: 380, y: 330},
    {id: "dns", kind: "dns", label: "DC01 DNS", sub: "10.20.0.10", x: 600, y: 130},
    {id: "web", kind: "web", label: "news.example", sub: "203.0.113.80 · HTTPS", x: 880, y: 330}
  ],
  links: [["lap", "core"], ["core", "dns"], ["core", "web"]],
  lanes: ["lap", "dns", "web"],
  stage: 6,
  steps: [
    {title: "The name resolves", sub: "DNS is fine", ph: 3,
     what: "Dan types news.example. The laptop asks DC01 and gets the address straight away. Networking is working normally.",
     check: "nslookup news.example returns 203.0.113.80.",
     tech: "Standard recursive lookup via DC01. DNS doesn't depend on the client clock.",
     msgs: [{from: "lap", to: "dns", label: "DNS: A? news.example", kind: "normal"}, {from: "dns", to: "lap", label: "203.0.113.80", kind: "data"}],
     evidence: [{t: "09:14:02", src: "Dan's laptop · nslookup", title: "nslookup news.example → 203.0.113.80", sev: "clue", kind: "cmd",
       fields: [["Answer", "203.0.113.80", "DNS works"]],
       raw: R`C:\> nslookup news.example
Server:  dc01.corp.contoso.com
Address:  10.20.0.10

Non-authoritative answer:
Name:    news.example
Address:  203.0.113.80`}]},
    {title: "Connect", sub: "The TCP handshake works", ph: 5,
     what: "The browser connects to the website on port 443 and the server answers. The connection is open, so the network isn't blocking anything.",
     check: "Test-NetConnection news.example -Port 443 succeeds.",
     tech: "SYN, SYN-ACK, ACK to 203.0.113.80:443.",
     msgs: [{from: "lap", to: "web", label: "SYN", kind: "normal"}, {from: "web", to: "lap", label: "SYN-ACK", kind: "data"}, {from: "lap", to: "web", label: "ACK", kind: "normal"}],
     cmds: {win: R`Test-NetConnection news.example -Port 443`, nix: R`nc -vz news.example 443`},
     evidence: [{t: "09:14:03", src: "Dan's laptop · PowerShell", title: "Test-NetConnection news.example -Port 443: TcpTestSucceeded True", sev: "clue", kind: "cmd",
       fields: [["TcpTestSucceeded", "True", "The network path is fine"]],
       raw: R`PS C:\> Test-NetConnection news.example -Port 443

ComputerName     : news.example
RemoteAddress    : 203.0.113.80
RemotePort       : 443
InterfaceAlias   : Ethernet
SourceAddress    : 10.20.10.88
TcpTestSucceeded : True`}]},
    {title: "The site shows its certificate", sub: "Its ID card, with dates", ph: 6,
     what: "To set up encryption, the website sends its certificate: a digital ID card saying 'I really am news.example', signed by a trusted authority, and valid between two dates.",
     check: "Click the warning's details (or the padlock) to view the certificate and its 'Valid from' and 'Valid to' dates.",
     tech: "TLS 1.3 ClientHello, then ServerHello. The server's Certificate message is encrypted in TLS 1.3, so you won't see it in a packet capture. Check it in the browser's certificate viewer.",
     msgs: [{from: "lap", to: "web", label: "TLS ClientHello", kind: "normal"}, {from: "web", to: "lap", label: "ServerHello + certificate", kind: "data"}],
     evidence: [{t: "09:14:03", src: "Browser · certificate viewer", title: "news.example certificate: valid 15 Oct 2026 – 13 Jan 2027", sev: "info", kind: "browser",
       fields: [["Issued to", "news.example", "Matches the site: good"], ["Issued by", "Example Issuing CA R2", "A trusted authority: good"], ["Valid from", "15 October 2026", ""], ["Valid to", "13 January 2027", "A typical 90-day certificate"]],
       raw: "Subject: CN=news.example\nIssuer: CN=Example Issuing CA R2\nValidity\n    Not Before: Oct 15 00:00:00 2026 GMT\n    Not After : Jan 13 23:59:59 2027 GMT"}]},
    {title: "Check the dates", sub: "'This won't be valid for 6 years'", ph: 6,
     what: "The laptop compares the certificate's dates with its own clock. Its clock says 1 January 2020, so the certificate isn't valid for another six years. The browser refuses to continue and warns Dan. It does this for every secure site, because they all have recent certificates.",
     check: "The browser shows 'Your clock is behind' with NET::ERR_CERT_DATE_INVALID. Get-Date on the laptop shows 2020.",
     tech: "Validation fails because the current time is before notBefore. The handshake is aborted. The same clock error would also break other time-sensitive checks; on a domain-joined PC, Kerberos sign-in fails once the clock is more than 5 minutes out (the default).",
     msgs: [{from: "lap", to: "web", label: "Abort: certificate not valid yet", kind: "bad"}],
     focus: ["lap"], fault: ["lap"], callout: "Clock says 2020: certificate 'not yet valid'",
     cmds: {win: R`Get-Date
w32tm /query /status`, nix: R`date
sntp <time-server>       # macOS: compare with a time server
timedatectl              # Linux`},
     evidence: [
      {t: "09:14:04", src: "Dan's laptop · browser", title: "Your clock is behind · NET::ERR_CERT_DATE_INVALID", sev: "err", kind: "browser",
       fields: [["Error", "NET::ERR_CERT_DATE_INVALID", "The certificate's dates don't include 'now', according to this computer"], ["Message", "Your clock is behind", "The browser has spotted that the computer's date is the problem"]],
       raw: "Your clock is behind\nA private connection to news.example can't be established because your computer's date and time (Wednesday, 1 January 2020 at 09:14:04) are incorrect.\nNET::ERR_CERT_DATE_INVALID"},
      {t: "09:15:20", src: "Dan's laptop · PowerShell", title: "Get-Date: 01 January 2020", sev: "err", kind: "cmd",
       fields: [["Date", "01 January 2020", "It's actually 20 November 2026"]],
       raw: R`PS C:\> Get-Date

01 January 2020 09:15:20`}]}
  ],
  fixed: [0, 1, 2,
    {title: "Check the dates", sub: "Today is inside the window", ph: 6,
     what: "With the clock showing the real date, 20 November 2026 falls between the certificate's 'valid from' and 'valid to' dates. The check passes and the encryption is set up.",
     check: "No warning; the padlock appears. Get-Date shows today's date.",
     tech: "notBefore ≤ now ≤ notAfter, the chain validates, and the TLS handshake completes.",
     msgs: [{from: "lap", to: "web", label: "Certificate OK: Finished", kind: "normal"}, {from: "web", to: "lap", label: "Finished", kind: "data"}],
     cmds: {win: R`Get-Date`, nix: R`date`},
     evidence: [{t: "09:31:02", src: "Dan's laptop · PowerShell", title: "Get-Date: 20 November 2026", sev: "ok", kind: "cmd",
       fields: [["Date", "20 November 2026", "Correct"]],
       raw: R`PS C:\> Get-Date

20 November 2026 09:31:02`}]},
    {title: "The page loads", sub: "Secure and working", ph: 7,
     what: "The page loads with the padlock, and every other secure site works again too.",
     check: "Websites, Teams and Outlook all connect without warnings.",
     tech: "HTTPS requests over the established TLS session.",
     msgs: [{from: "lap", to: "web", label: "HTTPS GET /", kind: "normal"}, {from: "web", to: "lap", label: "Page", kind: "data"}],
     evidence: []}
  ],
  fixes: [
    {id: "reset", kind: "herring", name: "Reset the network settings", short: "Network reset", at: 4,
     desc: "Use Network reset to reinstall adapters and clear settings.",
     result: "The network is fine: DNS answered and the connection opened. A reset removes and reinstalls the network adapters, which a laptop fresh from repair doesn't need, and the clock is still in 2020.",
     ev: {t: "09:20:40", src: "Dan's laptop · browser", title: "After the network reset: still NET::ERR_CERT_DATE_INVALID", sev: "warn", kind: "browser", fields: [["Error", "NET::ERR_CERT_DATE_INVALID", "Unchanged"]], raw: "Your clock is behind\nNET::ERR_CERT_DATE_INVALID"}},
    {id: "cache", kind: "herring", name: "Clear the browser cache and cookies", short: "Clear cache", at: 4,
     desc: "Delete cached files and cookies.",
     result: "The certificate check uses the computer's clock, not anything stored in the browser. Same dates, same clock, same error.",
     ev: {t: "09:22:05", src: "Dan's laptop · browser", title: "After clearing the cache: still 'Your clock is behind'", sev: "warn", kind: "browser", fields: [["Error", "NET::ERR_CERT_DATE_INVALID", ""]], raw: "Your clock is behind\nNET::ERR_CERT_DATE_INVALID"}},
    {id: "browser", kind: "herring", name: "Try a different browser", short: "Other browser", at: 4,
     desc: "Open the site in another browser.",
     result: "Every browser checks certificate dates against the same Windows clock. They'll all object, just with different wording.",
     ev: {t: "09:23:30", src: "Dan's laptop · second browser", title: "Second browser: certificate not yet valid", sev: "warn", kind: "browser", fields: [["Error", "Certificate not yet valid", "Different wording, same cause"]], raw: "The browser refuses the site: the certificate is not yet valid according to this computer's clock.\n(Each browser words it differently; the cause is the same.)"}},
    {id: "time", kind: "fix", name: "Set the correct date and time, and turn automatic time back on", short: "Fix the clock", at: 4,
     desc: "Correct the clock now, and switch 'Set time automatically' on so it stays right.",
     result: "The clock jumps to 20 November 2026 and syncs automatically from now on. The certificate's dates now include today, so the check passes and every secure site works. If an expired or 'not yet valid' error hits every site at once, check the clock first.",
     ev: {t: "09:30:45", src: "Dan's laptop · Settings", title: "Time set to 20 Nov 2026 09:30; 'Set time automatically' On", sev: "ok", kind: "log",
       fields: [["Set time automatically", "On", "Was Off after the repair"], ["Date and time", "20 November 2026 09:30", ""]],
       raw: "Settings > Time & language > Date & time\n  Set time automatically: On\n  Sync now: done (20 November 2026 09:30)"}}
  ],
  debrief: {
    check: ["Does it happen on every HTTPS site, or just one? Every site = your device", "Read the error: 'clock is behind/ahead' or ERR_CERT_DATE_INVALID", "Check the date and time on the device (Get-Date, date)", "View the certificate's 'Valid from' and 'Valid to' dates"],
    fix: ["Set the correct date and time", "Turn automatic time back on so it stays right"],
    prevent: ["After any hardware repair, check the clock and time sync before handing the device back", "Monitor time sync on managed devices", "One site only with a date error? That site's certificate has probably expired: tell the site owner"]
  },
  tell: "Every HTTPS site fails at once with a certificate date error, DNS and the TCP connection work fine, and the laptop's clock shows the wrong year."
}
]);
})();
