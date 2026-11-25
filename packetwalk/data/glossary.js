/* Packetwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — the journey stages and "Words to know".
   JOURNEY: the seven stages every connection goes through (the tiles along the top).
   GLOSSARY: shown under a step when the term appears in it. [label, pattern (case-insensitive), plain meaning] */
window.JOURNEY = [
  {name: "Connect", tech: "Layers 1–2: cable, Wi-Fi or VPN tunnel", desc: "Getting a working link: a cable plugged in, Wi-Fi joined or a VPN tunnel built."},
  {name: "Get an address", tech: "DHCP, static IP, subnet mask", desc: "Getting an IP address, a subnet mask, a gateway and DNS servers, usually from DHCP."},
  {name: "Find the name", tech: "DNS", desc: "Turning a name like fs01 or news.example into an IP address, using DNS."},
  {name: "Find the way", tech: "Routing, ARP, default gateway", desc: "Working out where to send the traffic: straight to a local device, or to the gateway to be routed on."},
  {name: "Open a connection", tech: "TCP / UDP ports, firewalls", desc: "Reaching the right program on the far end, on the right port, without a firewall in the way."},
  {name: "Secure it", tech: "TLS, certificates", desc: "Setting up encryption and checking the other end really is who it says it is, using its certificate."},
  {name: "Use it", tech: "HTTP, SMB, the app itself", desc: "Actually using the service: loading the page, opening the share, signing in."}
];

window.GLOSSARY = [
  ["IP address", "\\bIP address|\\ban address\\b|its address|her address|his address", "A device's number on the network, like 10.20.10.75. Every device needs a unique one."],
  ["DHCP", "\\bDHCP\\b", "The service that hands out IP addresses (and the gateway and DNS servers) automatically, on loan for a set time."],
  ["Lease", "\\blease", "How long a device may keep an address DHCP gave it before it has to ask again."],
  ["Scope / pool", "\\bscope\\b|\\bpool\\b", "The range of addresses a DHCP server is allowed to hand out on one network."],
  ["169.254 (APIPA)", "169\\.254|picks itself an address|made-up address", "The address Windows gives itself when no DHCP server answers. Seeing one means 'DHCP didn't work'."],
  ["Broadcast", "broadcast|shouts|to everyone|whole floor", "A message sent to every device on the local network at once."],
  ["Subnet mask", "subnet mask|\\bmask\\b", "Tells a device which addresses are 'local' (reach directly) and which are 'remote' (send to the gateway)."],
  ["Default gateway", "gateway", "The router a device sends traffic to when the destination isn't on its own local network."],
  ["Router", "\\brouter\\b|routes it|routed", "A device that passes traffic between different networks."],
  ["DNS", "\\bDNS\\b|turn that name|turn .{0,20}name into", "The internet's phone book: turns names like news.example into IP addresses."],
  ["DNS suffix", "suffix", "The domain Windows adds to short names, so 'fs01' becomes fs01.corp.contoso.com."],
  ["MAC address", "\\bMAC\\b|hardware address", "A network card's built-in hardware address, used to deliver traffic on the local network."],
  ["ARP", "\\bARP\\b|who has", "How a device finds the hardware (MAC) address that goes with an IP address on its local network."],
  ["Ping", "\\bping", "A quick 'are you there?' test. A reply proves the device is reachable, but not that any particular app works."],
  ["Port", "\\bport\\b|port \\d", "A numbered door on a device that a particular program listens on, like 443 for secure websites."],
  ["TCP handshake", "handshake|\\bSYN\\b|SYN-ACK", "The three-message 'can we talk? / yes / great' that opens a TCP connection."],
  ["Firewall", "firewall", "Software or a device that decides which traffic is allowed in or out, and drops the rest."],
  ["VPN", "\\bVPN\\b|tunnel", "A secure tunnel from a device to the company network over the internet."],
  ["Split tunnel", "split", "A VPN that only sends company traffic through the tunnel; everything else goes straight to the internet."],
  ["Certificate", "certificate", "A website's digital ID card, signed by a trusted authority and valid only between two dates."],
  ["TLS / HTTPS", "\\bTLS\\b|HTTPS|encryption", "The encryption that protects web traffic. It relies on certificates to prove who's at the other end."],
  ["Packet capture", "capture", "A recording of the actual traffic on the network, viewed in a tool like Wireshark."],
  ["Static IP", "fixed address|static|typed in|by hand", "An address typed into a device's settings instead of coming from DHCP. Easy to get wrong and easy to forget."],
  ["IP conflict", "conflict|clash|same address", "Two devices using the same IP address, so traffic for one ends up at the other."],
  ["File share / SMB", "\\bSMB\\b|file share|S: drive|\\\\\\\\fs01", "Folders shared from a server, opened over the SMB protocol on port 445."]
];
