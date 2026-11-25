/* Packetwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — scenarios 1–4. (5–8 are in scenarios2.js.)

   HOW A SCENARIO IS DESCRIBED
   {
     id, cat, name, sub          id is also the #hash that opens it
     impact                      who's affected (shown as a chip)
     layers: ["L7 DHCP", ...]    OSI layers involved
     cause                       one-line root cause (also used in Diagnose mode)
     ticket: {ref, from, text}   how the problem arrives at the helpdesk
     intro                       plain-English summary
     summary                     technical summary (under "Technical detail")
     facts: [[k, v], ...]
     nodes: [{id, kind, label, sub, x, y, ghost?}]   ghost = an address nothing answers on
     links, lanes                as Breachwalk
     stage: 1..7                 the journey stage where it breaks
     steps: [STEP, ...]          the broken run, ending where it fails
     fixed: [n | STEP, ...]      the working run: a number reuses steps[n]
     fixes: [{id, kind: "fix"|"herring", name, short, desc, result, at, ev}]
             fix:     plays the fixed run; ev shows at fixed-run step `at`
             herring: the run still breaks; result + ev show at broken-run step `at`
     debrief: {check: [], fix: [], prevent: []}
     tell                        the giveaway clues, for Diagnose mode
   }
   STEP = {title, sub, ph (1..7), what, check, tech, facts?, msgs: [{from, to, label, kind, lost?}],
           callout?, focus?, fault?: [nodeIds], cmds?: {win, nix}, evidence: [EV]}
     msg kinds: normal (blue), data (amber, replies), bad (red, the problem), fix (green)
     lost: "No reply" makes the message stop short and fail
   EV = {t, src, title, sev: err|warn|clue|info|ok, kind: cmd|log|packet|browser, fields: [[name, value, meaning]], raw}
        or {t, src, title, sev, kind: "packet", pkt: "key in packets.js"}

   All addresses are private ranges or documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24).
   MAC addresses use the documentation block 00:00:5e:00:53:xx. Every company, person and domain is made up. */
(function () {
const R = String.raw;
window.SCENARIOS = (window.SCENARIOS || []).concat([

/* ============ 1. DHCP SCOPE FULL ============ */
{
  id: "dhcp-full", cat: "address", name: "No address (169.254)", sub: "The DHCP pool has run dry",
  impact: "New devices, Floor 2", layers: ["L7 DHCP", "L3 IPv4", "L2 Ethernet"],
  cause: "The DHCP scope is full",
  ticket: {ref: "INC-20431", from: "Priya Shah · Finance", text: "My new laptop is plugged in at my desk but there's no internet and Teams won't sign in. The old one worked fine."},
  intro: "Priya's new laptop plugs in fine but never gets a proper address. It asks the DHCP server for one, but every address in the Floor 2 pool is already handed out, so the server says nothing and the laptop falls back to a useless 169.254 address.",
  summary: "Scope 10.20.10.0/24 on DC01 hands out 10.20.10.100–10.20.10.150 (51 addresses) with an 8-day lease. Phones and visitors' devices that left days ago still hold leases, so the pool is exhausted. The server sends no DHCPOFFER, and the Windows client configures an APIPA (169.254.0.0/16) address.",
  facts: [["Symptom", "169.254.x.x address, blank gateway"], ["Root cause", "DHCP pool exhausted"], ["Who's affected", "New devices; existing ones keep their leases until they expire"], ["Key evidence", "Scope 100% in use, event 1020"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Priya's laptop", sub: "LT-PRIYA · new", x: 120, y: 330},
    {id: "sw", kind: "switch", label: "Floor 2 switch", sub: "Access switch · VLAN 10", x: 400, y: 330},
    {id: "core", kind: "router", label: "Core switch", sub: "10.20.10.1 · DHCP relay", x: 660, y: 180},
    {id: "dc", kind: "dc", label: "DC01", sub: "10.20.0.10 · DHCP + DNS", x: 900, y: 330},
    {id: "inet", kind: "cloud", label: "Internet", sub: "", x: 660, y: 520}
  ],
  links: [["lap", "sw"], ["sw", "core"], ["core", "dc"], ["core", "inet"]],
  lanes: ["lap", "sw", "core", "dc", "inet"],
  stage: 2,
  steps: [
    {title: "Plug in", sub: "The cable and port are fine", ph: 1,
     what: "Priya plugs her new laptop into the desk socket. The lights come on and the switch sees it straight away, so the cable and the port are working.",
     check: "The switch log shows the port coming up. If it never came up, you'd be looking at a cable, a port or a patching problem, not DHCP.",
     tech: "Autonegotiation completes at 1000 Mb/s full duplex on Gi1/0/14, an access port in VLAN 10 (Floor 2 users). Layers 1 and 2 are working. Everything after this depends on getting an IP address.",
     msgs: [{from: "lap", to: "sw", label: "Link up: 1 Gbps", kind: "normal"}],
     cmds: {win: R`Get-NetAdapter | Format-Table Name, Status, LinkSpeed`, nix: R`ifconfig en0          # macOS: look for "status: active"
ip link show          # Linux: look for "state UP"`},
     evidence: [{t: "09:02:10", src: "Floor 2 switch · log", title: "Gi1/0/14 changed state to up", sev: "info", kind: "log",
       fields: [["Interface", "GigabitEthernet1/0/14", "Priya's desk socket, patched to this port"], ["State", "up / line protocol up", "Electrically connected and passing frames"]],
       raw: R`Nov 20 09:02:09: %LINK-3-UPDOWN: Interface GigabitEthernet1/0/14, changed state to up
Nov 20 09:02:10: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet1/0/14, changed state to up`}]},
    {title: "Ask for an address", sub: "DHCP Discover, sent to everyone", ph: 2,
     what: "The laptop has no address yet, so it shouts to the whole floor: 'Is there a DHCP server? I need an address.' The core switch passes the request on to the DHCP server, which sits on a different network.",
     check: "A packet capture on the laptop shows the Discover going out. If you can see it leave, the laptop is doing its job.",
     tech: "DHCPDISCOVER from 0.0.0.0:68 to 255.255.255.255:67. Broadcasts don't cross routers, so the core switch's DHCP relay (ip helper-address 10.20.0.10) forwards it to DC01 as unicast and sets giaddr to 10.20.10.1. That tells the server which scope to offer from.",
     msgs: [{from: "lap", to: "core", label: "DHCP Discover (broadcast)", kind: "normal"}, {from: "core", to: "dc", label: "Discover, relayed (giaddr 10.20.10.1)", kind: "normal"}],
     cmds: {win: R`# Start a capture first (built into Windows), then reconnect the cable
pktmon start --capture --comp nics
pktmon stop
pktmon etl2pcap PktMon.etl          # open the .pcapng in Wireshark, filter: dhcp`, nix: R`sudo tcpdump -ni en0 port 67 or port 68     # macOS
sudo tcpdump -ni eth0 port 67 or port 68    # Linux`},
     evidence: [{t: "09:02:11", src: "Packet capture · LT-PRIYA", title: "DHCP Discover from 00:00:5e:00:53:12 (LT-PRIYA)", sev: "info", kind: "packet", pkt: "dhcp-discover"}]},
    {title: "No offer comes back", sub: "Every address is already taken", ph: 2,
     what: "DC01 looks at the Floor 2 pool and finds every address already handed out. With nothing to give, it doesn't reply at all. The laptop doesn't get an error, just silence.",
     check: "On the DHCP server, the scope shows 100% in use and the System log has event 1020 ('Scope … is 100 percent full'). The DHCP audit log records ID 14: a request it couldn't satisfy.",
     tech: "The scope range is only 51 addresses with an 8-day lease. Phones and visitors' laptops that left days ago still hold leases until they expire. With no free address, DC01 sends no DHCPOFFER and logs audit ID 14 (address pool exhausted) and event 1020.",
     msgs: [], focus: ["dc", "core"], fault: ["dc"], callout: "Pool full: no offer sent",
     facts: [["Scope", "10.20.10.0/24"], ["Range", "10.20.10.100 – .150 (51)"], ["Lease", "8 days"], ["Free", "0"]],
     cmds: {win: R`# On the DHCP server
Get-DhcpServerv4ScopeStatistics -ScopeId 10.20.10.0
Get-DhcpServerv4Lease -ScopeId 10.20.10.0 | Sort-Object LeaseExpiryTime | Select-Object -First 10`, nix: null},
     evidence: [
      {t: "09:02:11", src: "DC01 · System event log", title: "Event 1020: Scope 10.20.10.0 is 100 percent full", sev: "err", kind: "log",
       fields: [["Source", "Microsoft-Windows-DHCP-Server", ""], ["Event ID", "1020", "Raised when a scope crosses its 'nearly full' threshold"], ["Message", "Scope, 10.20.10.0, is 100 percent full with only 0 IP addresses remaining.", "Nothing left to hand out"]],
       raw: R`Log Name:      System
Source:        Microsoft-Windows-DHCP-Server
Event ID:      1020
Level:         Warning
Computer:      DC01.corp.contoso.com
Description:
Scope, 10.20.10.0, is 100 percent full with only 0 IP addresses remaining.`},
      {t: "09:02:45", src: "DC01 · PowerShell", title: "Get-DhcpServerv4ScopeStatistics: 0 free, 51 in use", sev: "err", kind: "cmd",
       fields: [["Free", "0", "No addresses left to offer"], ["InUse", "51", "The whole range, .100 to .150"], ["PercentageInUse", "100", ""]],
       raw: R`PS C:\> Get-DhcpServerv4ScopeStatistics -ScopeId 10.20.10.0

ScopeId         Free       InUse      PercentageInUse Reserved   Pending   SuperscopeName
-------         ----       -----      --------------- --------   -------   --------------
10.20.10.0      0          51         100             0          0`}]},
    {title: "A 169.254 address", sub: "Windows picks one for itself", ph: 2,
     what: "After a few unanswered requests, Windows gives up waiting and picks itself an address starting with 169.254. That only works for talking to other devices that did the same, so there's no gateway, no DNS and no internet. Windows keeps asking for a real address every five minutes in the background.",
     check: "ipconfig /all shows 'Autoconfiguration IPv4 Address … 169.254…' and a blank default gateway. A 169.254 address on a DHCP-enabled adapter means 'DHCP didn't answer'.",
     tech: "APIPA picks an address from 169.254.0.0/16 (mask 255.255.0.0) and checks it with ARP before using it. No gateway or DNS servers are configured. The DHCP client keeps retrying in the background every 5 minutes, and replaces the APIPA address as soon as a server answers.",
     msgs: [], focus: ["lap"], callout: "Self-assigned: 169.254.83.17",
     cmds: {win: R`ipconfig /all`, nix: R`ipconfig getifaddr en0      # macOS
ip -4 addr show             # Linux`},
     evidence: [{t: "09:03:02", src: "LT-PRIYA · ipconfig /all", title: "Autoconfiguration IPv4 Address 169.254.83.17, no gateway", sev: "err", kind: "cmd",
       fields: [["DHCP Enabled", "Yes", "The laptop is set to get an address automatically…"], ["Autoconfiguration IPv4 Address", "169.254.83.17", "…but it had to make one up"], ["Subnet Mask", "255.255.0.0", "The APIPA range"], ["Default Gateway", "(blank)", "No way off this network"]],
       raw: R`Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Physical Address. . . . . . . . . : 00-00-5E-00-53-12
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   Autoconfiguration IPv4 Address. . : 169.254.83.17(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :`}]}
  ],
  fixed: [0, 1,
    {title: "An offer comes back", sub: "DC01 has addresses to give", ph: 2,
     what: "This time DC01 finds a free address in the Floor 2 pool and offers it: 10.20.10.151, along with the gateway, the DNS servers and how long Priya can keep it.",
     check: "A capture shows a DHCP Offer arriving. The DHCP audit log will show an 'Assign' entry once the deal is done.",
     tech: "DC01 replies to the relay agent (10.20.10.1) with a DHCPOFFER: yiaddr 10.20.10.151, option 3 router 10.20.10.1, option 6 DNS 10.20.0.10 and 10.20.0.11, option 15 corp.contoso.com, lease 86,400 s. The relay passes it to the client.",
     msgs: [{from: "dc", to: "core", label: "DHCP Offer: 10.20.10.151", kind: "data"}, {from: "core", to: "lap", label: "Offer: 10.20.10.151", kind: "data"}],
     evidence: []},
    {title: "Request and ACK", sub: "The deal is done", ph: 2,
     what: "The laptop replies 'Yes please, I'll take 10.20.10.151' and DC01 confirms. Before using it, Windows quickly checks nobody else is already on that address.",
     check: "The DHCP audit log records ID 10 ('Assign') for LT-PRIYA.",
     tech: "DHCPREQUEST (broadcast, option 54 identifying DC01) and DHCPACK complete the DORA exchange. Windows then sends an ARP probe for 10.20.10.151 to detect a conflict before configuring the address.",
     msgs: [{from: "lap", to: "core", label: "DHCP Request: 10.20.10.151", kind: "normal"}, {from: "core", to: "dc", label: "Request, relayed", kind: "normal"}, {from: "dc", to: "core", label: "DHCP ACK", kind: "data"}, {from: "core", to: "lap", label: "ACK: yours for 1 day", kind: "data"}],
     evidence: [{t: "09:41:07", src: "DC01 · DHCP audit log", title: "ID 10 Assign: 10.20.10.151 to LT-PRIYA", sev: "ok", kind: "log",
       fields: [["ID", "10", "A new address was leased to a client"], ["IP Address", "10.20.10.151", ""], ["Host Name", "LT-PRIYA.corp.contoso.com", ""], ["MAC Address", "00005E005312", "Priya's network card"]],
       raw: R`10,11/20/26,09:41:07,Assign,10.20.10.151,LT-PRIYA.corp.contoso.com,00005E005312,`}]},
    {title: "Online", sub: "Gateway, DNS, internet", ph: 7,
     what: "With a real address, a gateway and DNS servers, Priya's laptop can find names, reach the internet and sign in to Teams.",
     check: "ipconfig /all shows an IPv4 address in 10.20.10.x, a default gateway of 10.20.10.1 and the company DNS servers.",
     tech: "Lease obtained for 1 day. Default route via 10.20.10.1; DNS 10.20.0.10/10.20.0.11 with suffix corp.contoso.com.",
     msgs: [{from: "lap", to: "core", label: "Traffic via gateway 10.20.10.1", kind: "normal"}, {from: "core", to: "inet", label: "Out to the internet", kind: "normal"}, {from: "inet", to: "lap", label: "Teams signs in", kind: "data"}],
     cmds: {win: R`ipconfig /all`, nix: R`ipconfig getpacket en0      # macOS: shows the DHCP lease details
ip -4 addr show; ip route   # Linux`},
     evidence: [{t: "09:41:09", src: "LT-PRIYA · ipconfig /all", title: "IPv4 10.20.10.151, gateway 10.20.10.1, lease 1 day", sev: "ok", kind: "cmd",
       fields: [["IPv4 Address", "10.20.10.151", "A real address on the Floor 2 network"], ["Default Gateway", "10.20.10.1", "The core switch"], ["DHCP Server", "10.20.0.10", "DC01, reached through the relay"], ["DNS Servers", "10.20.0.10, 10.20.0.11", ""]],
       raw: R`Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : corp.contoso.com
   Physical Address. . . . . . . . . : 00-00-5E-00-53-12
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.20.10.151(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : 20 November 2026 09:41:07
   Lease Expires . . . . . . . . . . : 21 November 2026 09:41:07
   Default Gateway . . . . . . . . . : 10.20.10.1
   DHCP Server . . . . . . . . . . . : 10.20.0.10
   DNS Servers . . . . . . . . . . . : 10.20.0.10
                                       10.20.0.11`}]}
  ],
  fixes: [
    {id: "cable", kind: "herring", name: "Swap the network cable", short: "New cable", at: 4,
     desc: "Try a different patch lead.",
     result: "The link was already up at 1 Gbps, so the cable was never the problem. The new one comes up just the same, and the laptop still gets no offer.",
     ev: {t: "09:15:30", src: "Floor 2 switch · log", title: "Gi1/0/14 up again on the new cable: same result", sev: "warn", kind: "log", fields: [["Link", "Up, 1 Gbps", "It was fine before too"]], raw: R`Nov 20 09:15:29: %LINK-3-UPDOWN: Interface GigabitEthernet1/0/14, changed state to up`}},
    {id: "restartdhcp", kind: "herring", name: "Restart the DHCP Server service", short: "Restart DHCP", at: 4,
     desc: "Restart the DHCP service on DC01.",
     result: "Leases are stored in the DHCP database, so they survive a restart. The service comes back up with the scope still 100% full.",
     ev: {t: "09:18:02", src: "DC01 · PowerShell", title: "After the restart: scope still 100% in use", sev: "warn", kind: "cmd", fields: [["Free", "0", "Restarting doesn't release leases"]], raw: R`PS C:\> Restart-Service DHCPServer
PS C:\> Get-DhcpServerv4ScopeStatistics -ScopeId 10.20.10.0

ScopeId         Free       InUse      PercentageInUse Reserved   Pending   SuperscopeName
-------         ----       -----      --------------- --------   -------   --------------
10.20.10.0      0          51         100             0          0`}},
    {id: "reboot", kind: "herring", name: "Restart Priya's laptop", short: "Restart laptop", at: 4,
     desc: "Turn it off and on again.",
     result: "It boots, asks for an address, hears nothing and picks another 169.254 address. Nothing on the laptop can create free addresses on the server.",
     ev: {t: "09:21:44", src: "LT-PRIYA · ipconfig /all", title: "After restart: Autoconfiguration IPv4 Address 169.254.201.6", sev: "warn", kind: "cmd", fields: [["IPv4", "169.254.201.6", "A different made-up address, same problem"]], raw: R`   Autoconfiguration IPv4 Address. . : 169.254.201.6(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :`}},
    {id: "widen", kind: "fix", name: "Widen the scope range and shorten the lease", short: "Bigger pool", at: 3,
     desc: "Extend the pool to .50–.250 (after checking those addresses are unused) and cut the lease from 8 days to 1.",
     result: "The pool grows from 51 to 201 addresses, and a 1-day lease means devices that leave give their address back much sooner. DC01 now has free addresses to offer, and the laptop's next background retry gets one.",
     ev: {t: "09:40:30", src: "DC01 · PowerShell", title: "Scope widened to .50–.250, lease 1 day: 150 free", sev: "ok", kind: "cmd",
       fields: [["Range", "10.20.10.50 – 10.20.10.250", "201 addresses"], ["Lease", "1 day", "Short leases suit busy floors with lots of visitors"], ["Free", "150", ""]],
       raw: R`PS C:\> Set-DhcpServerv4Scope -ScopeId 10.20.10.0 -StartRange 10.20.10.50 -EndRange 10.20.10.250 -LeaseDuration 1.00:00:00
PS C:\> Get-DhcpServerv4ScopeStatistics -ScopeId 10.20.10.0

ScopeId         Free       InUse      PercentageInUse Reserved   Pending   SuperscopeName
-------         ----       -----      --------------- --------   -------   --------------
10.20.10.0      150        51         25.37313        0          0`}}
  ],
  debrief: {
    check: ["ipconfig /all: a 169.254 address means DHCP didn't answer", "Is the link up? (switch log, adapter status)", "Capture: does a Discover leave, and does an Offer come back?", "On the server: scope statistics, event 1020, audit log ID 14"],
    fix: ["Give the scope more addresses (widen the range, or add a scope or VLAN)", "Shorten the lease on busy or guest networks", "Move phones and guests to their own scope"],
    prevent: ["Alert on scope usage (event 1020) before it hits 100%", "Size scopes for visitors and phones, not just staff", "Short leases for transient devices"]
  },
  tell: "A 169.254 address with a blank gateway (DHCP didn't answer), the Discover leaving the laptop with no Offer back, and the server reporting the scope 100% full."
},

/* ============ 2. WRONG DNS SERVER ============ */
{
  id: "dns-wrong", cat: "dns", name: "Ping works, websites don't", sub: "A leftover manual DNS setting",
  impact: "One user", layers: ["L7 DNS", "L4 UDP"],
  cause: "The laptop's DNS server is set by hand to an address that doesn't exist here",
  ticket: {ref: "INC-20438", from: "Sam Okafor · Sales", text: "Wi-Fi says connected but no websites will load. Teams says it can't connect. Everyone around me is fine."},
  intro: "Sam's laptop is connected and has an address, and the internet is there. But every website fails, because the laptop asks a DNS server that isn't on this network: his home router, typed in by hand last week.",
  summary: "The Wi-Fi adapter has a static DNS server, 192.168.1.1, left over from troubleshooting at home. Static DNS overrides the DNS servers DHCP supplies (10.20.0.10/11). Queries to 192.168.1.1 go to the default gateway, aren't answered and time out. IP connectivity is fine.",
  facts: [["Symptom", "Names fail, IP addresses work"], ["Root cause", "Manual DNS server 192.168.1.1"], ["Who's affected", "Just Sam"], ["Key evidence", "ipconfig DNS Servers, nslookup timeouts"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Sam's laptop", sub: "LT-SAM · 10.20.10.75", x: 110, y: 320},
    {id: "ap", kind: "ap", label: "Office Wi-Fi", sub: "Contoso-Staff", x: 320, y: 140},
    {id: "core", kind: "router", label: "Core switch", sub: "10.20.10.1 · gateway", x: 400, y: 400},
    {id: "ghost", kind: "router", ghost: true, label: "192.168.1.1", sub: "Sam's home router (not here)", x: 640, y: 540},
    {id: "dns", kind: "dns", label: "DC01 DNS", sub: "10.20.0.10", x: 680, y: 140},
    {id: "web", kind: "web", label: "news.example", sub: "203.0.113.80", x: 930, y: 330}
  ],
  links: [["lap", "ap"], ["ap", "core"], ["core", "dns"], ["core", "web"], ["core", "ghost"]],
  lanes: ["lap", "core", "ghost", "dns", "web"],
  stage: 3,
  steps: [
    {title: "Connected, with an address", sub: "But look at the DNS line", ph: 2,
     what: "Sam joins the office Wi-Fi and DHCP gives him an address, a gateway and the company's DNS servers. But Windows ignores those DNS servers, because someone typed one in by hand last week: 192.168.1.1, his router at home.",
     check: "ipconfig /all shows DHCP is on, yet the DNS Servers line says 192.168.1.1. On this network, DHCP would never hand that out.",
     tech: "A DNS server set manually on the adapter takes priority over option 6 from DHCP. The adapter still gets its IPv4 address, mask and gateway from DHCP.",
     msgs: [{from: "lap", to: "core", label: "DHCP: renew lease", kind: "normal"}, {from: "core", to: "lap", label: "10.20.10.75 + gateway + DNS", kind: "data"}],
     cmds: {win: R`ipconfig /all
Get-DnsClientServerAddress -AddressFamily IPv4`, nix: R`scutil --dns | grep nameserver     # macOS
resolvectl status                  # Linux (systemd-resolved)`},
     evidence: [{t: "10:05:12", src: "LT-SAM · ipconfig /all", title: "DHCP Enabled: Yes, but DNS Servers: 192.168.1.1", sev: "clue", kind: "cmd",
       fields: [["IPv4 Address", "10.20.10.75", "From DHCP: fine"], ["Default Gateway", "10.20.10.1", "From DHCP: fine"], ["DHCP Server", "10.20.0.10", ""], ["DNS Servers", "192.168.1.1", "Not from DHCP. A home router address, typed in by hand"]],
       raw: R`Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . : corp.contoso.com
   Physical Address. . . . . . . . . : 00-00-5E-00-53-75
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.20.10.75(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.20.10.1
   DHCP Server . . . . . . . . . . . : 10.20.0.10
   DNS Servers . . . . . . . . . . . : 192.168.1.1`}]},
    {title: "Look up the website", sub: "Asking a server that isn't there", ph: 3,
     what: "Sam types news.example. Before anything else, the laptop has to turn that name into an address, so it asks its DNS server. That's 192.168.1.1, which doesn't exist on the office network, so the question goes nowhere.",
     check: "A capture shows DNS queries leaving for 192.168.1.1 and no replies coming back.",
     tech: "UDP/53 query for news.example (type A) to 192.168.1.1. It's off-subnet, so the frame goes to the gateway. 192.168.1.1 is a private address that isn't routed anywhere from here, so the query is never answered.",
     msgs: [{from: "lap", to: "ghost", label: "DNS: A? news.example", kind: "bad", lost: "No reply"}],
     cmds: {win: R`Resolve-DnsName news.example`, nix: R`dig news.example                    # Linux / macOS
dscacheutil -q host -a name news.example   # macOS`},
     evidence: [{t: "10:05:40", src: "Packet capture · LT-SAM", title: "DNS query for news.example to 192.168.1.1: no response", sev: "warn", kind: "packet", pkt: "dns-query-wrong"}]},
    {title: "Timed out", sub: "No name, no website", ph: 3,
     what: "The laptop tries a few more times, then gives up. With no address for news.example, the browser has nothing to connect to, and Teams can't find its servers either.",
     check: "nslookup shows 'DNS request timed out' and names the server as 192.168.1.1. That's the giveaway: the laptop is asking the wrong server.",
     tech: "nslookup first does a reverse lookup of the server's own address (hence 'Server: UnKnown'), then the query, retrying until it gives up with 'Request to UnKnown timed-out'.",
     msgs: [], focus: ["lap"], fault: ["lap"], callout: "DNS timed out",
     cmds: {win: R`nslookup news.example`, nix: R`nslookup news.example`},
     evidence: [{t: "10:06:02", src: "LT-SAM · nslookup", title: "nslookup news.example: DNS request timed out (server 192.168.1.1)", sev: "err", kind: "cmd",
       fields: [["Server", "UnKnown / 192.168.1.1", "The server it's asking"], ["Result", "Request to UnKnown timed-out", "Nobody answered"]],
       raw: R`C:\> nslookup news.example
DNS request timed out.
    timeout was 2 seconds.
Server:  UnKnown
Address:  192.168.1.1

DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
DNS request timed out.
    timeout was 2 seconds.
*** Request to UnKnown timed-out`}]},
    {title: "But the internet is there", sub: "Ping by address works", ph: 4,
     what: "The engineer pings the website's address directly and gets replies straight away. So the Wi-Fi, the gateway and the internet are all fine. Only names are broken, which points straight at DNS.",
     check: "Ping by IP works, ping by name fails with 'could not find host'. That split is the classic DNS fingerprint.",
     tech: "ICMP echo to 203.0.113.80 succeeds (TTL 54 on arrival). 'Ping request could not find host' means name resolution failed before any packet was sent.",
     msgs: [{from: "lap", to: "web", label: "ping 203.0.113.80", kind: "normal"}, {from: "web", to: "lap", label: "Reply", kind: "data"}],
     cmds: {win: R`ping 203.0.113.80
ping news.example`, nix: R`ping -c 4 203.0.113.80
ping -c 4 news.example`},
     evidence: [
      {t: "10:07:15", src: "LT-SAM · ping", title: "ping 203.0.113.80: 4 replies, 0% loss", sev: "clue", kind: "cmd",
       fields: [["Replies", "4 of 4", "The route to the internet works"], ["TTL", "54", "Counts down at each router on the way back"]],
       raw: R`C:\> ping 203.0.113.80

Pinging 203.0.113.80 with 32 bytes of data:
Reply from 203.0.113.80: bytes=32 time=13ms TTL=54
Reply from 203.0.113.80: bytes=32 time=13ms TTL=54
Reply from 203.0.113.80: bytes=32 time=14ms TTL=54
Reply from 203.0.113.80: bytes=32 time=13ms TTL=54

Ping statistics for 203.0.113.80:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 13ms, Maximum = 14ms, Average = 13ms`},
      {t: "10:07:31", src: "LT-SAM · ping", title: "ping news.example: could not find host", sev: "err", kind: "cmd",
       fields: [["Result", "Could not find host", "No packet was even sent: the name couldn't be turned into an address"]],
       raw: R`C:\> ping news.example
Ping request could not find host news.example. Please check the name and try again.`}]}
  ],
  fixed: [
    {title: "Connected, with an address", sub: "And the right DNS servers", ph: 2,
     what: "With the manual setting removed, Sam's laptop uses the DNS servers DHCP hands out: DC01 and DC02.",
     check: "ipconfig /all now shows DNS Servers 10.20.0.10 and 10.20.0.11.",
     tech: "With no static DNS server on the adapter, DHCP option 6 is used.",
     msgs: [{from: "lap", to: "core", label: "DHCP: renew lease", kind: "normal"}, {from: "core", to: "lap", label: "10.20.10.75 + gateway + DNS", kind: "data"}],
     cmds: {win: R`ipconfig /all`, nix: R`scutil --dns | grep nameserver     # macOS
resolvectl status                  # Linux`},
     evidence: [{t: "10:12:40", src: "LT-SAM · ipconfig /all", title: "DNS Servers: 10.20.0.10, 10.20.0.11", sev: "ok", kind: "cmd",
       fields: [["DNS Servers", "10.20.0.10, 10.20.0.11", "From DHCP, as intended"]],
       raw: R`Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . : corp.contoso.com
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.20.10.75(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.20.10.1
   DHCP Server . . . . . . . . . . . : 10.20.0.10
   DNS Servers . . . . . . . . . . . : 10.20.0.10
                                       10.20.0.11`}]},
    {title: "Look up the website", sub: "The right server answers", ph: 3,
     what: "The laptop asks DC01 for news.example. DC01 doesn't hold internet names itself, so it asks on Sam's behalf and passes the answer back: 203.0.113.80.",
     check: "nslookup names dc01 as the server and returns an address. 'Non-authoritative answer' just means DC01 got it from elsewhere.",
     tech: "DC01 forwards the query for an external name and caches the result. The response carries a TTL of 300 s, so the laptop can reuse it for five minutes.",
     msgs: [{from: "lap", to: "dns", label: "DNS: A? news.example", kind: "normal"}, {from: "dns", to: "lap", label: "news.example = 203.0.113.80", kind: "data"}],
     cmds: {win: R`nslookup news.example`, nix: R`dig news.example`},
     evidence: [
      {t: "10:12:55", src: "Packet capture · LT-SAM", title: "DNS response from 10.20.0.10: news.example A 203.0.113.80", sev: "ok", kind: "packet", pkt: "dns-response-ok"},
      {t: "10:13:02", src: "LT-SAM · nslookup", title: "nslookup news.example → 203.0.113.80 (server dc01)", sev: "ok", kind: "cmd",
       fields: [["Server", "dc01.corp.contoso.com", "The company DNS server"], ["Answer", "203.0.113.80", ""]],
       raw: R`C:\> nslookup news.example
Server:  dc01.corp.contoso.com
Address:  10.20.0.10

Non-authoritative answer:
Name:    news.example
Address:  203.0.113.80`}]},
    {title: "The page loads", sub: "Connect, secure, use", ph: 7,
     what: "With an address to connect to, the browser opens a connection, sets up encryption and loads the page. Teams finds its servers the same way.",
     check: "Websites and Teams work. Ping by name now works too.",
     tech: "TCP handshake to 203.0.113.80:443, then TLS, then HTTP.",
     msgs: [{from: "lap", to: "web", label: "HTTPS to 203.0.113.80", kind: "normal"}, {from: "web", to: "lap", label: "Page", kind: "data"}],
     evidence: []}
  ],
  fixes: [
    {id: "cache", kind: "herring", name: "Clear the browser cache", short: "Clear cache", at: 4,
     desc: "Delete cached files and cookies in the browser.",
     result: "The browser can't load a page it can't find an address for. Nothing cached was involved: the lookup still goes to 192.168.1.1 and still times out.",
     ev: {t: "10:08:20", src: "LT-SAM · browser", title: "After clearing the cache: site still can't be reached", sev: "warn", kind: "browser", fields: [["Result", "Site can't be reached", "Same DNS failure"]], raw: "news.example: the server's address couldn't be found (DNS lookup timed out)"}},
    {id: "flush", kind: "herring", name: "Run ipconfig /flushdns", short: "Flush DNS", at: 4,
     desc: "Clear the laptop's DNS cache.",
     result: "That clears names the laptop already remembered, but the next lookup still goes to 192.168.1.1 and still times out. Flushing fixes stale answers, not the wrong server.",
     ev: {t: "10:08:45", src: "LT-SAM · Command Prompt", title: "Cache flushed, next lookup still times out", sev: "warn", kind: "cmd", fields: [["Server asked", "192.168.1.1", "Unchanged"]], raw: R`C:\> ipconfig /flushdns

Windows IP Configuration

Successfully flushed the DNS Resolver Cache.

C:\> nslookup news.example
DNS request timed out.
    timeout was 2 seconds.
Server:  UnKnown
Address:  192.168.1.1`}},
    {id: "router", kind: "herring", name: "Restart the office router", short: "Restart router", at: 4,
     desc: "Reboot the core switch / gateway.",
     result: "The office network was never the problem: pinging 203.0.113.80 already works. Sam's laptop is asking the wrong server, and a reboot here can't change a setting on his laptop. (And you'd have knocked the whole floor offline for nothing.)",
     ev: {t: "10:10:02", src: "LT-SAM · ping", title: "After the reboot: ping by IP still fine, names still fail", sev: "warn", kind: "cmd", fields: [["Change", "None", ""]], raw: R`C:\> ping news.example
Ping request could not find host news.example. Please check the name and try again.`}},
    {id: "autodns", kind: "fix", name: "Set DNS back to automatic", short: "Automatic DNS", at: 1,
     desc: "Remove the manual DNS server so the ones from DHCP are used.",
     result: "With the manual entry gone, Windows uses the DNS servers DHCP hands out: 10.20.0.10 and 10.20.0.11. Lookups are answered and everything works. (If Sam needs a custom DNS at home, set it on his home router, not his laptop.)",
     ev: {t: "10:12:31", src: "LT-SAM · PowerShell", title: "DNS reset to DHCP: 10.20.0.10, 10.20.0.11", sev: "ok", kind: "cmd",
       fields: [["Command", "Set-DnsClientServerAddress -ResetServerAddresses", "Removes the manual entry"], ["ServerAddresses", "{10.20.0.10, 10.20.0.11}", "Now from DHCP"]],
       raw: R`PS C:\> Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ResetServerAddresses
PS C:\> Get-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -AddressFamily IPv4

InterfaceAlias               Interface Address ServerAddresses
                             Index     Family
--------------               --------- ------- ---------------
Wi-Fi                               14 IPv4    {10.20.0.10, 10.20.0.11}`}}
  ],
  debrief: {
    check: ["Ping an IP address, then ping a name: IP works but names fail = DNS", "ipconfig /all: which DNS servers is it actually using?", "nslookup: which server answered, or timed out?", "Compare with a colleague on the same network"],
    fix: ["Set DNS back to automatic (DHCP)", "Then confirm with nslookup and a browser"],
    prevent: ["Don't set DNS by hand on company laptops; stop users changing it if you can", "If someone needs a temporary DNS change, write it in the ticket and undo it", "Check ipconfig /all early on any 'internet's down' ticket"]
  },
  tell: "Ping by IP works but names fail, nslookup times out, and ipconfig shows a DNS server (192.168.1.1) that DHCP would never hand out."
},

/* ============ 3. WRONG DEFAULT GATEWAY ============ */
{
  id: "wrong-gateway", cat: "routing", name: "Printer works, nothing else", sub: "A default gateway that isn't there",
  impact: "One device", layers: ["L3 IPv4 routing", "L2 ARP"],
  cause: "The PC's default gateway points at an old router that no longer exists",
  ticket: {ref: "INC-20447", from: "Reception (Floor 2)", text: "The new reception PC prints fine but nothing else works: no email, no internet, can't get to the shared drive."},
  intro: "The new reception PC was set up by hand, copying settings from a sticky note written before last summer's network upgrade. It can reach the printer next to it, but everything else has to go through the 'gateway', and the gateway on the note doesn't exist any more.",
  summary: "RECEP-01 has a static configuration: 10.20.10.23/24, gateway 10.20.10.254 (the old router, removed in the summer). Same-subnet traffic (the printer at 10.20.10.40) is delivered directly. Everything off-subnet, including the DNS servers, needs the gateway. ARP for 10.20.10.254 gets no reply, so Windows reports 'Destination host unreachable' from its own address.",
  facts: [["Symptom", "Local printer works, everything else fails"], ["Root cause", "Static gateway 10.20.10.254 (gone)"], ["Who's affected", "One PC"], ["Key evidence", "'Reply from <own IP>: Destination host unreachable'"]],
  nodes: [
    {id: "pc", kind: "laptop", label: "Reception PC", sub: "RECEP-01 · 10.20.10.23", x: 130, y: 320},
    {id: "prn", kind: "printer", label: "Reception printer", sub: "10.20.10.40", x: 330, y: 540},
    {id: "core", kind: "router", label: "Core switch", sub: "10.20.10.1 · the real gateway", x: 520, y: 160},
    {id: "ghost", kind: "router", ghost: true, label: "10.20.10.254", sub: "Old router · removed", x: 560, y: 470},
    {id: "dns", kind: "dns", label: "DC01", sub: "10.20.0.10 · DNS", x: 820, y: 160},
    {id: "inet", kind: "cloud", label: "Internet", sub: "", x: 860, y: 420}
  ],
  links: [["pc", "prn"], ["pc", "core"], ["pc", "ghost"], ["core", "dns"], ["core", "inet"]],
  lanes: ["pc", "prn", "core", "ghost", "dns", "inet"],
  stage: 4,
  steps: [
    {title: "Settings from a sticky note", sub: "A static IP and an old gateway", ph: 2,
     what: "The new reception PC was set up yesterday with a fixed address, copied from a note stuck to the old monitor. The address and mask are fine, but the 'default gateway' on the note is the old router's address.",
     check: "ipconfig /all shows DHCP Enabled: No, and a default gateway of 10.20.10.254. Every other PC on the floor uses 10.20.10.1.",
     tech: "Static IPv4 10.20.10.23, mask 255.255.255.0, gateway 10.20.10.254, DNS 10.20.0.10. Since the summer refresh, 10.20.10.1 (the core switch's VLAN 10 interface) has been the gateway. Nothing answers on .254.",
     msgs: [], focus: ["pc"], callout: "Gateway: 10.20.10.254",
     cmds: {win: R`ipconfig /all`, nix: R`netstat -rn | grep default     # macOS
ip route show default          # Linux`},
     evidence: [{t: "08:47:10", src: "RECEP-01 · ipconfig /all", title: "DHCP Enabled: No · Default Gateway: 10.20.10.254", sev: "clue", kind: "cmd",
       fields: [["DHCP Enabled", "No", "Typed in by hand"], ["IPv4 Address", "10.20.10.23", "Fine"], ["Subnet Mask", "255.255.255.0", "Fine"], ["Default Gateway", "10.20.10.254", "The old router's address. It was removed in the summer"], ["DNS Servers", "10.20.0.10", "Correct, but on another network, so it needs the gateway too"]],
       raw: R`Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Physical Address. . . . . . . . . : 00-00-5E-00-53-23
   DHCP Enabled. . . . . . . . . . . : No
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.20.10.23(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.20.10.254
   DNS Servers . . . . . . . . . . . : 10.20.0.10`}]},
    {title: "Printing works", sub: "Same network, no gateway needed", ph: 4,
     what: "The printer is on the same local network (10.20.10.x), so the PC can reach it directly: it asks 'who has 10.20.10.40?', the printer answers, and the job goes straight across. The gateway isn't involved at all.",
     check: "Ping the printer: instant replies. That proves the cable, the network card and the switch are all fine.",
     tech: "10.20.10.40 is inside 10.20.10.0/24, so it's on-link. The PC ARPs for it directly and sends the print job (TCP 9100) to the printer's MAC address.",
     msgs: [{from: "pc", to: "prn", label: "ARP: who has 10.20.10.40?", kind: "normal"}, {from: "prn", to: "pc", label: "ARP: it's me (…:53:40)", kind: "data"}, {from: "pc", to: "prn", label: "Print job (TCP 9100)", kind: "normal"}],
     cmds: {win: R`ping 10.20.10.40`, nix: R`ping -c 4 10.20.10.40`},
     evidence: [{t: "08:49:02", src: "RECEP-01 · ping", title: "ping 10.20.10.40 (printer): 4 replies", sev: "clue", kind: "cmd",
       fields: [["Replies", "4 of 4", "Local delivery works"], ["Time", "<1ms", "Same switch, no routing"], ["TTL", "64", "The printer's starting TTL; no routers in between"]],
       raw: R`C:\> ping 10.20.10.40

Pinging 10.20.10.40 with 32 bytes of data:
Reply from 10.20.10.40: bytes=32 time<1ms TTL=64
Reply from 10.20.10.40: bytes=32 time<1ms TTL=64
Reply from 10.20.10.40: bytes=32 time<1ms TTL=64
Reply from 10.20.10.40: bytes=32 time<1ms TTL=64

Ping statistics for 10.20.10.40:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 0ms, Average = 0ms`}]},
    {title: "Anything else: find the gateway", sub: "Who is 10.20.10.254?", ph: 4,
     what: "Email, the internet, the shared drive and even the DNS server are all on other networks, so the PC must send them to its gateway. First it needs the gateway's hardware address, so it asks 'who has 10.20.10.254?'. Nobody does.",
     check: "A capture shows repeated ARP requests for 10.20.10.254 and no replies.",
     tech: "For any off-subnet destination the next hop is the default gateway. The PC broadcasts an ARP request for 10.20.10.254. No device owns that address, so there's no ARP reply and nothing can be sent.",
     msgs: [{from: "pc", to: "ghost", label: "ARP: who has 10.20.10.254?", kind: "bad", lost: "No reply"}],
     cmds: {win: R`Get-NetNeighbor -IPAddress 10.20.10.254
arp -a`, nix: R`arp -a              # macOS
ip neigh show       # Linux`},
     evidence: [{t: "08:50:11", src: "Packet capture · RECEP-01", title: "ARP: Who has 10.20.10.254? Tell 10.20.10.23 (no reply)", sev: "warn", kind: "packet", pkt: "arp-old-gateway"}]},
    {title: "Destination host unreachable", sub: "Coming from its own address", ph: 4,
     what: "With no gateway to hand things to, every packet for the outside world is stuck. Windows says so in a confusing way: 'Reply from 10.20.10.23: Destination host unreachable'. That's the PC's own address talking. Names fail too, because the DNS server is also on the other side of the missing gateway.",
     check: "When the 'Reply from' address is your own IP, the problem is on this PC or its local network, not out on the internet. Get-NetNeighbor shows the gateway as 'Unreachable'.",
     tech: "When ARP for the next hop fails, Windows reports 'Destination host unreachable' itself: no packet ever leaves the PC. It counts these as 'received', so the statistics misleadingly show 0% loss. The neighbour cache marks 10.20.10.254 as Unreachable.",
     msgs: [], focus: ["pc", "ghost"], fault: ["pc"], callout: "No working gateway",
     cmds: {win: R`ping 203.0.113.80
Get-NetNeighbor -IPAddress 10.20.10.254`, nix: R`ping -c 4 203.0.113.80
ip neigh show 10.20.10.254   # Linux: look for FAILED`},
     evidence: [
      {t: "08:51:30", src: "RECEP-01 · ping", title: "ping 203.0.113.80: 'Reply from 10.20.10.23: Destination host unreachable'", sev: "err", kind: "cmd",
       fields: [["Reply from", "10.20.10.23", "That's this PC. It couldn't even hand the packet to a gateway"], ["Received / Lost", "4 / 0 (0% loss)", "Misleading: Windows counts the error messages as replies"]],
       raw: R`C:\> ping 203.0.113.80

Pinging 203.0.113.80 with 32 bytes of data:
Reply from 10.20.10.23: Destination host unreachable.
Reply from 10.20.10.23: Destination host unreachable.
Reply from 10.20.10.23: Destination host unreachable.
Reply from 10.20.10.23: Destination host unreachable.

Ping statistics for 203.0.113.80:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`},
      {t: "08:52:05", src: "RECEP-01 · PowerShell", title: "Get-NetNeighbor: 10.20.10.254 is Unreachable", sev: "err", kind: "cmd",
       fields: [["IPAddress", "10.20.10.254", "The configured gateway"], ["LinkLayerAddress", "00-00-00-00-00-00", "No MAC address ever learned"], ["State", "Unreachable", "ARP got no answer"]],
       raw: R`PS C:\> Get-NetNeighbor -IPAddress 10.20.10.254

ifIndex IPAddress                                          LinkLayerAddress      State       PolicyStore
------- ---------                                          ----------------      -----       -----------
7       10.20.10.254                                       00-00-00-00-00-00     Unreachable ActiveStore`}]}
  ],
  fixed: [
    {title: "Settings from DHCP", sub: "The right gateway, automatically", ph: 2,
     what: "The PC is switched back to getting its settings automatically. DHCP gives it an address on the same network, the current gateway (10.20.10.1) and the DNS servers.",
     check: "ipconfig /all shows DHCP Enabled: Yes and Default Gateway 10.20.10.1.",
     tech: "DHCP option 3 supplies 10.20.10.1, the core switch's VLAN 10 interface. The PC gets a leased address from the pool.",
     msgs: [{from: "pc", to: "core", label: "DHCP Discover / Request", kind: "normal"}, {from: "core", to: "pc", label: "10.20.10.118 + gateway 10.20.10.1", kind: "data"}],
     cmds: {win: R`ipconfig /all`, nix: R`ip route show default`},
     evidence: [{t: "09:20:44", src: "RECEP-01 · ipconfig /all", title: "DHCP Enabled: Yes · Default Gateway: 10.20.10.1", sev: "ok", kind: "cmd",
       fields: [["DHCP Enabled", "Yes", ""], ["IPv4 Address", "10.20.10.118", "From the DHCP pool"], ["Default Gateway", "10.20.10.1", "The current gateway"]],
       raw: R`Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : corp.contoso.com
   Physical Address. . . . . . . . . : 00-00-5E-00-53-23
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration Enabled . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.20.10.118(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.20.10.1
   DHCP Server . . . . . . . . . . . : 10.20.0.10
   DNS Servers . . . . . . . . . . . : 10.20.0.10
                                       10.20.0.11`}]},
    {use: 1, times: ["09:20:52"]},
    {title: "Find the real gateway", sub: "10.20.10.1 answers", ph: 4,
     what: "For anything off the local network, the PC asks 'who has 10.20.10.1?'. The core switch answers straight away with its hardware address.",
     check: "Get-NetNeighbor shows 10.20.10.1 with a real MAC address and a state of Reachable.",
     tech: "ARP request for 10.20.10.1, ARP reply from the core switch's VLAN 10 interface. The PC caches it and sends off-subnet frames to that MAC.",
     msgs: [{from: "pc", to: "core", label: "ARP: who has 10.20.10.1?", kind: "normal"}, {from: "core", to: "pc", label: "ARP: it's me (…:53:01)", kind: "data"}],
     evidence: [{t: "09:21:02", src: "RECEP-01 · PowerShell", title: "Get-NetNeighbor: 10.20.10.1 is Reachable", sev: "ok", kind: "cmd",
       fields: [["LinkLayerAddress", "00-00-5E-00-53-01", "The core switch"], ["State", "Reachable", ""]],
       raw: R`PS C:\> Get-NetNeighbor -IPAddress 10.20.10.1

ifIndex IPAddress                                          LinkLayerAddress      State       PolicyStore
------- ---------                                          ----------------      -----       -----------
7       10.20.10.1                                         00-00-5E-00-53-01     Reachable   ActiveStore`}]},
    {title: "Out to the world", sub: "Routed via 10.20.10.1", ph: 7,
     what: "Now everything off the local network goes to the core switch, which routes it on: to DC01 for names, to the file server, and out to the internet.",
     check: "tracert shows 10.20.10.1 as the first hop, and email and websites work.",
     tech: "Hop 1 is the core switch, hop 2 the internet firewall's inside interface, then the ISP.",
     msgs: [{from: "pc", to: "core", label: "Traffic for 203.0.113.80", kind: "normal"}, {from: "core", to: "dns", label: "DNS lookups", kind: "normal"}, {from: "core", to: "inet", label: "Routed out", kind: "normal"}, {from: "inet", to: "pc", label: "Replies", kind: "data"}],
     cmds: {win: R`tracert -d 203.0.113.80`, nix: R`traceroute -n 203.0.113.80`},
     evidence: [{t: "09:21:40", src: "RECEP-01 · tracert", title: "tracert -d 203.0.113.80: hop 1 is 10.20.10.1", sev: "ok", kind: "cmd",
       fields: [["Hop 1", "10.20.10.1", "The core switch: the correct gateway"], ["Hop 2", "10.20.0.1", "The internet firewall"], ["Hop 4", "203.0.113.80", "Destination reached"]],
       raw: R`C:\> tracert -d 203.0.113.80

Tracing route to 203.0.113.80 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  10.20.10.1
  2     1 ms     1 ms     1 ms  10.20.0.1
  3     9 ms     8 ms     9 ms  198.51.100.1
  4    13 ms    13 ms    14 ms  203.0.113.80

Trace complete.`}]}
  ],
  fixes: [
    {id: "driver", kind: "herring", name: "Reinstall the network driver", short: "New driver", at: 4,
     desc: "Remove and reinstall the network card's driver.",
     result: "The network card is working: it reaches the printer. The driver comes back with exactly the same settings, so the PC is still sending everything to a gateway that doesn't exist.",
     ev: {t: "09:02:30", src: "RECEP-01 · ping", title: "After the driver reinstall: printer fine, internet still unreachable", sev: "warn", kind: "cmd", fields: [["Change", "None", "The static settings survive a driver reinstall"]], raw: R`Reply from 10.20.10.23: Destination host unreachable.`}},
    {id: "publicdns", kind: "herring", name: "Point DNS at a public resolver", short: "Public DNS", at: 4,
     desc: "Change the DNS server to a public one on the internet.",
     result: "A public DNS server is on the internet, which needs the gateway too. Swapping one unreachable DNS server for another changes nothing. The problem is the gateway, not the DNS server.",
     ev: {t: "09:05:10", src: "RECEP-01 · nslookup", title: "nslookup via a public resolver: timed out", sev: "warn", kind: "cmd", fields: [["Result", "Timed out", "Can't reach any DNS server off this subnet"]], raw: R`DNS request timed out.
    timeout was 2 seconds.`}},
    {id: "cable", kind: "herring", name: "Reseat the network cable", short: "Reseat cable", at: 4,
     desc: "Unplug and firmly re-plug the cable at both ends.",
     result: "Printing works, so the cable, port and switch were already fine. The PC is reaching its own network perfectly well; it just can't leave it.",
     ev: {t: "09:07:00", src: "RECEP-01 · ping", title: "After reseating: printer still answers, internet still unreachable", sev: "warn", kind: "cmd", fields: [["Change", "None", ""]], raw: R`Reply from 10.20.10.40: bytes=32 time<1ms TTL=64`}},
    {id: "dhcp", kind: "fix", name: "Switch the PC back to DHCP", short: "Back to DHCP", at: 1,
     desc: "Set IP and DNS settings to automatic.",
     result: "DHCP gives RECEP-01 the current gateway (10.20.10.1), which answers ARP straight away, so everything works. If reception ever needs a fixed address, use a DHCP reservation rather than typing settings in, so they update when the network changes. (And bin the sticky note.)",
     ev: {t: "09:20:30", src: "RECEP-01 · Settings", title: "IP assignment and DNS set to Automatic (DHCP)", sev: "ok", kind: "log", fields: [["IP assignment", "Automatic (DHCP)", "Was Manual"], ["DNS server assignment", "Automatic (DHCP)", ""]], raw: "Settings > Network & internet > Ethernet > IP assignment: Automatic (DHCP)\nDNS server assignment: Automatic (DHCP)"}}
  ],
  debrief: {
    check: ["Ping something local (printer, gateway) and something remote", "If local works and remote fails, look at the default gateway", "'Reply from <your own IP>: Destination host unreachable' = ARP failed for the next hop", "Get-NetNeighbor / arp -a: does the gateway have a MAC address?"],
    fix: ["Use DHCP (or a DHCP reservation) so the gateway is always current", "If it must be static, set the gateway to 10.20.10.1"],
    prevent: ["Avoid hand-typed settings on desktops", "Keep a single source of truth for network settings, not sticky notes", "After a network change, search for devices still using old addresses"]
  },
  tell: "The local printer replies but everything else fails with 'Reply from' the PC's own address, the gateway never answers ARP, and DHCP is switched off with an old gateway typed in."
},

/* ============ 4. IP ADDRESS CONFLICT ============ */
{
  id: "ip-conflict", cat: "address", name: "Two devices, one address", sub: "A printer set up with someone else's IP",
  impact: "Two devices, on and off", layers: ["L3 IPv4", "L2 ARP"],
  cause: "A new printer was given a static IP inside the DHCP pool that a laptop already has",
  ticket: {ref: "INC-20452", from: "Ola Nowak · Marketing", text: "My laptop keeps dropping off the network. Windows said something about an IP address conflict? Also the new printer is 'offline' half the time."},
  intro: "Facilities set up a new printer and typed in an address that 'looked free'. It's inside the range DHCP hands out, and DHCP had already given it to Ola's laptop. Now two devices claim the same address, and the network keeps sending Ola's traffic to the printer.",
  summary: "Ola's laptop holds a DHCP lease for 10.20.10.120. The new printer was configured statically with 10.20.10.120. When it boots it announces itself with a gratuitous ARP. Windows detects the conflict (Tcpip event 4199), and the core switch updates its ARP entry for 10.20.10.120 to the printer's MAC, so return traffic for Ola goes to the printer. The ARP entry flips whenever either device announces itself, so the symptoms come and go.",
  facts: [["Symptom", "Intermittent drop-outs on two devices"], ["Root cause", "Static IP inside the DHCP pool"], ["Who's affected", "Ola's laptop and the new printer"], ["Key evidence", "Tcpip event 4199, ARP table MAC changes"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Ola's laptop", sub: "10.20.10.120 (DHCP) · …:53:20", x: 130, y: 200},
    {id: "prn", kind: "printer", label: "New printer", sub: "10.20.10.120 (typed in) · …:53:41", x: 130, y: 500},
    {id: "sw", kind: "switch", label: "Floor 2 switch", sub: "VLAN 10", x: 420, y: 350},
    {id: "core", kind: "router", label: "Core switch", sub: "10.20.10.1 · ARP table", x: 680, y: 350},
    {id: "fs", kind: "server", label: "FS01", sub: "10.20.0.20 · file server", x: 920, y: 350}
  ],
  links: [["lap", "sw"], ["prn", "sw"], ["sw", "core"], ["core", "fs"]],
  lanes: ["lap", "prn", "sw", "core", "fs"],
  stage: 2,
  steps: [
    {title: "Ola has her address", sub: "Leased from DHCP this morning", ph: 2,
     what: "Ola's laptop got 10.20.10.120 from DHCP this morning, as normal. Everything works.",
     check: "ipconfig /all on Ola's laptop shows 10.20.10.120, with DHCP Enabled: Yes and a lease from DC01.",
     tech: "Lease from DC01 for 10.20.10.120, inside the pool 10.20.10.100–.150. The core switch's ARP table maps 10.20.10.120 to Ola's MAC (…:53:20).",
     msgs: [{from: "core", to: "lap", label: "DHCP ACK: 10.20.10.120", kind: "data"}, {from: "lap", to: "fs", label: "File share traffic", kind: "normal"}],
     cmds: {win: R`ipconfig /all`, nix: R`ipconfig getpacket en0   # macOS
ip -4 addr show          # Linux`},
     evidence: [{t: "08:31:15", src: "LT-OLA · ipconfig /all", title: "IPv4 10.20.10.120, leased from DHCP", sev: "info", kind: "cmd",
       fields: [["IPv4 Address", "10.20.10.120", "Handed out by DHCP"], ["Physical Address", "00-00-5E-00-53-20", "Ola's network card"], ["DHCP Server", "10.20.0.10", ""]],
       raw: R`Ethernet adapter Ethernet:

   Physical Address. . . . . . . . . : 00-00-5E-00-53-20
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 10.20.10.120(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : 20 November 2026 08:31:14
   Default Gateway . . . . . . . . . : 10.20.10.1
   DHCP Server . . . . . . . . . . . : 10.20.0.10`}]},
    {title: "The new printer arrives", sub: "Typed-in address: 10.20.10.120", ph: 2,
     what: "Facilities plug in the new printer and type 10.20.10.120 into its settings because it 'looked free'. When it starts up, the printer announces to the whole network: '10.20.10.120 is me!'",
     check: "A capture shows an ARP announcement for 10.20.10.120 from a MAC address that isn't Ola's.",
     tech: "A gratuitous ARP (sender IP = target IP = 10.20.10.120) from …:53:41. Devices that already have 10.20.10.120 in their ARP cache, including the core switch, update the entry to the printer's MAC.",
     msgs: [{from: "prn", to: "sw", label: "ARP: 10.20.10.120 is at …:53:41", kind: "bad"}, {from: "sw", to: "lap", label: "Flooded to everyone", kind: "bad"}, {from: "sw", to: "core", label: "Flooded to everyone", kind: "bad"}],
     evidence: [{t: "10:14:02", src: "Packet capture · Floor 2", title: "Gratuitous ARP: 10.20.10.120 is at 00:00:5e:00:53:41", sev: "warn", kind: "packet", pkt: "arp-gratuitous-printer"}]},
    {title: "Windows spots the clash", sub: "Event 4199", ph: 2,
     what: "Ola's laptop hears another device claiming its address. Windows pops up a warning about an IP address conflict and logs it, including the other device's hardware address.",
     check: "The System event log has Tcpip event 4199 naming the address and the other device's MAC. That MAC is your best clue for finding the culprit.",
     tech: "Tcpip event 4199 (address conflict) is logged by the system defending its address. The MAC address in the event (00-00-5E-00-53-41) belongs to the printer, which you can trace through the switch's MAC address table.",
     msgs: [], focus: ["lap", "prn"], fault: ["prn"], callout: "IP address conflict!",
     cmds: {win: R`Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Tcpip'; Id=4199} -MaxEvents 5 | Format-List TimeCreated, Message`, nix: R`arping -I eth0 10.20.10.120    # Linux: replies from two MACs = conflict`},
     evidence: [{t: "10:14:03", src: "LT-OLA · System event log", title: "Tcpip 4199: address conflict for 10.20.10.120 with 00-00-5E-00-53-41", sev: "err", kind: "log",
       fields: [["Source", "Tcpip", ""], ["Event ID", "4199", "Address conflict detected"], ["IP address", "10.20.10.120", "Ola's address"], ["Other device", "00-00-5E-00-53-41", "Not Ola's MAC. This is the device to go and find"]],
       raw: R`Log Name:      System
Source:        Tcpip
Event ID:      4199
Level:         Error
Computer:      LT-OLA.corp.contoso.com
Description:
The system detected an address conflict for IP address 10.20.10.120 with the system having network hardware address 00-00-5E-00-53-41. Network operations on this system may be disrupted as a result.`}]},
    {title: "Replies go to the wrong device", sub: "The gateway believes the printer", ph: 4,
     what: "The core switch now thinks 10.20.10.120 is the printer. So when the file server replies to Ola, the reply is delivered to the printer, which throws it away. Ola's file copy stalls and Teams drops. It flips back and forth whenever either device speaks up, so it comes and goes.",
     check: "The core switch's ARP table shows 10.20.10.120 against the printer's MAC, not Ola's. Check it a few minutes later and it may have flipped back.",
     tech: "Return traffic is forwarded to whichever MAC the gateway's ARP entry holds. With two hosts claiming one IP, the entry is overwritten by whichever announced last, giving intermittent, one-way failures.",
     msgs: [{from: "lap", to: "fs", label: "Request to FS01", kind: "normal"}, {from: "fs", to: "core", label: "Reply for 10.20.10.120", kind: "data"}, {from: "core", to: "prn", label: "Delivered to the printer!", kind: "bad", lost: "Dropped"}],
     cmds: {win: R`# From another PC on the same network
arp -a | findstr 10.20.10.120`, nix: R`arp -a | grep 10.20.10.120`},
     evidence: [{t: "10:15:20", src: "Core switch · show ip arp", title: "10.20.10.120 now mapped to the printer (0000.5e00.5341)", sev: "err", kind: "cmd",
       fields: [["Address", "10.20.10.120", ""], ["Hardware Addr", "0000.5e00.5341", "The printer. Ola's laptop is 0000.5e00.5320"], ["Age", "0", "Updated moments ago by the printer's announcement"]],
       raw: R`CORE-SW1# show ip arp 10.20.10.120
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  10.20.10.120            0   0000.5e00.5341  ARPA   Vlan10`}]}
  ],
  fixed: [0,
    {title: "The new printer arrives", sub: "Given its own address", ph: 2,
     what: "This time the printer is given 10.20.10.41, an address outside the range DHCP hands out, and recorded in the IP address list. It announces itself, and nobody else claims that address.",
     check: "The printer's settings page shows 10.20.10.41. No conflict event on any PC.",
     tech: "10.20.10.41 sits outside the DHCP range (.100–.150), so DHCP will never hand it to anything else. The printer's gratuitous ARP for 10.20.10.41 is uncontested.",
     msgs: [{from: "prn", to: "sw", label: "ARP: 10.20.10.41 is at …:53:41", kind: "normal"}],
     evidence: []},
    {title: "Everyone in the right place", sub: "One address, one device", ph: 4,
     what: "The core switch's ARP table has a separate entry for each device, so replies from the file server reach Ola's laptop and print jobs reach the printer.",
     check: "The core switch shows 10.20.10.120 → Ola's MAC and 10.20.10.41 → the printer's MAC.",
     tech: "Unique IP-to-MAC mappings. Return traffic for 10.20.10.120 is forwarded to …:53:20.",
     msgs: [{from: "lap", to: "fs", label: "Request to FS01", kind: "normal"}, {from: "fs", to: "core", label: "Reply for 10.20.10.120", kind: "data"}, {from: "core", to: "lap", label: "Delivered to Ola", kind: "data"}],
     evidence: [{t: "10:41:10", src: "Core switch · show ip arp", title: "10.20.10.120 → Ola (…5320), 10.20.10.41 → printer (…5341)", sev: "ok", kind: "cmd",
       fields: [["10.20.10.120", "0000.5e00.5320", "Ola's laptop"], ["10.20.10.41", "0000.5e00.5341", "The printer, on its own address"]],
       raw: R`CORE-SW1# show ip arp vlan 10
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  10.20.10.41             0   0000.5e00.5341  ARPA   Vlan10
Internet  10.20.10.120            2   0000.5e00.5320  ARPA   Vlan10`}]}
  ],
  fixes: [
    {id: "driver", kind: "herring", name: "Reinstall the printer driver", short: "Printer driver", at: 4,
     desc: "Remove and re-add the printer on the PCs.",
     result: "The driver lives on the PCs and only decides how print jobs are formatted. The clash is in the printer's network settings, which a driver can't touch.",
     ev: {t: "10:20:15", src: "LT-OLA · System event log", title: "Event 4199 again after the driver reinstall", sev: "warn", kind: "log", fields: [["Event ID", "4199", "Still conflicting"]], raw: "The system detected an address conflict for IP address 10.20.10.120 with the system having network hardware address 00-00-5E-00-53-41."}},
    {id: "cable", kind: "herring", name: "Replace Ola's network cable", short: "New cable", at: 4,
     desc: "Give Ola a new patch lead.",
     result: "Windows has already said exactly what's wrong: another device is using her address. A new cable can't change that, and the drop-outs carry on.",
     ev: {t: "10:24:40", src: "LT-OLA · System event log", title: "Another 4199 after the cable swap", sev: "warn", kind: "log", fields: [["Other device", "00-00-5E-00-53-41", "The same printer"]], raw: "Tcpip 4199: address conflict for 10.20.10.120 with 00-00-5E-00-53-41"}},
    {id: "restartsw", kind: "herring", name: "Restart the core switch", short: "Restart switch", at: 4,
     desc: "Reboot the core switch to clear its tables.",
     result: "That clears the ARP table for a moment (and knocks the whole office offline while it reboots). Within minutes both devices announce themselves again and the clash is back.",
     ev: {t: "10:33:05", src: "Core switch · show ip arp", title: "After the reboot: 10.20.10.120 flips back to the printer", sev: "warn", kind: "cmd", fields: [["Hardware Addr", "0000.5e00.5341", "The printer again"]], raw: R`Internet  10.20.10.120            0   0000.5e00.5341  ARPA   Vlan10`}},
    {id: "move", kind: "fix", name: "Move the printer to a free address outside the DHCP pool", short: "Readdress printer", at: 2,
     desc: "Set the printer to 10.20.10.41 (outside .100–.150) and record it.",
     result: "The printer moves to 10.20.10.41, which DHCP will never hand out. Ola keeps 10.20.10.120, the core switch learns her MAC again, and both devices work. Record the address so nobody 'finds it free' next year.",
     ev: {t: "10:40:12", src: "Printer · web settings", title: "Printer IPv4 changed to 10.20.10.41 (static, outside the pool)", sev: "ok", kind: "log",
       fields: [["IPv4 address", "10.20.10.41", "Outside the DHCP range"], ["Subnet mask", "255.255.255.0", ""], ["Gateway", "10.20.10.1", ""]],
       raw: "TCP/IP settings: Manual\nIPv4 address: 10.20.10.41\nSubnet mask: 255.255.255.0\nDefault gateway: 10.20.10.1"}}
  ],
  debrief: {
    check: ["Look for Tcpip event 4199 and note the other device's MAC address", "Check the gateway's ARP table: which MAC does it hold for the address?", "Trace the MAC through the switch's MAC address table to find the port", "Was a static device added recently?"],
    fix: ["Move the static device to an address outside the DHCP range", "Or set it to DHCP with a reservation", "Then check the ARP table settles on one MAC per address"],
    prevent: ["Keep static devices outside the DHCP range, and exclude their addresses", "Record every static address in one place (an IPAM tool or a shared list)", "Printers and other kit: use DHCP reservations where you can"]
  },
  tell: "Problems that come and go, Tcpip event 4199 naming another device's MAC, a gratuitous ARP from a new device, and the gateway's ARP entry pointing at the wrong MAC."
}
]);
})();
