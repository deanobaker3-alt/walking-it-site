/* Packetwalk: "Why it matters" for every step, shown in the What's happening box.
   steps[i] matches the broken run's step i; fixed[i] is for steps that only happen in the fixed run.
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
window.EXPLAIN = {
  "dhcp-full": {
    steps: [
      "Starting at the bottom of the journey rules things out quickly. Link lights and the switch seeing the laptop prove the cable and port are fine, so you can stop suspecting them.",
      "A laptop with no address can't talk to anyone directly, so it broadcasts to the whole network. The switch relays that shout to the DHCP server on another network, which is why the relay is part of the journey too.",
      "DHCP failing silently is what makes this confusing: there's no error message, just nothing. Knowing that a full scope looks exactly like this saves a lot of time chasing cables and drivers.",
      "A 169.254 address is the giveaway. It means 'I asked for an address and nobody answered', which points you straight at DHCP rather than at the website, the browser or the Wi-Fi."
    ],
    fixed: {
      2: "With free addresses in the pool, DHCP makes an offer that includes everything the laptop needs: the address, the gateway, the DNS servers and the lease time.",
      3: "The request and acknowledgement complete the deal. Windows checking that nobody else already has the address is a small safety step that prevents address conflicts.",
      4: "With an address, gateway and DNS in place, every later stage of the journey can happen. Widening the scope fixes Priya, and a shorter lease stops the pool filling up again with old devices."
    }
  },
  "dns-wrong": {
    steps: [
      "A manually set DNS server overrides whatever DHCP hands out, and it stays there until someone removes it. That's why a setting typed in at home last week can break the office network today.",
      "Every website visit starts with a DNS lookup. If the DNS server is unreachable, nothing else in the journey gets a chance to happen, even though the network itself is fine.",
      "Timeouts point at a server that isn't answering, rather than one that's saying 'no such name'. That difference helps you tell a wrong DNS server from a wrong website name.",
      "Ping by IP working while names fail is the classic DNS test. It proves the Wi-Fi, gateway and internet are all fine, and narrows the fault to name lookups in one step."
    ],
    fixed: {
      0: "Setting DNS back to automatic means the laptop uses whatever the network hands out, so it works in the office, at home and anywhere else.",
      1: "The company's DNS servers answer internal names themselves and fetch internet names on your behalf. That's why using them works everywhere, and a home router's address only works at home.",
      2: "With the name resolved, the browser can open a connection, set up encryption and load the page. Every other app that relies on names starts working at the same moment."
    }
  },
  "wrong-gateway": {
    steps: [
      "Static settings copied from somewhere else are a common source of faults, because they don't update when the network changes. DHCP would have handed out the right gateway automatically.",
      "Things on the same network don't need the gateway at all, which is why the printer still works. 'Some things work, others don't' is a strong hint about routing.",
      "To send anything off the local network, the PC needs the gateway's hardware (MAC) address, which it finds with ARP. No ARP answer means the gateway address is wrong or the gateway is down.",
      "'Destination host unreachable' coming from your own address means the PC couldn't even hand the traffic to a gateway. It's a different message from a timeout, and it points at local settings, not the internet."
    ],
    fixed: {
      0: "Switching back to DHCP gives the PC the current gateway, so it keeps working the next time the network changes too.",
      2: "An ARP reply from the real gateway proves the PC can now hand traffic off the local network.",
      3: "With a working gateway, routing does the rest: DNS, the file server and the internet all become reachable again."
    }
  },
  "ip-conflict": {
    steps: [
      "Everything works at the start, which is what makes conflicts confusing: the problem only appears once a second device turns up with the same address.",
      "Picking an address because it 'looks free' is how most conflicts start. An address inside the DHCP range can be handed out at any moment, even if nothing is using it right now.",
      "Event 4199 records the clash and, crucially, the other device's MAC address. That's how you find out what's stealing the address.",
      "Intermittent faults are often conflicts. Whichever device spoke last 'owns' the address in the switch's ARP table, so traffic flips between them and connections drop at random."
    ],
    fixed: {
      1: "Static addresses belong outside the DHCP range, and in the IP address list. That one habit prevents almost every address conflict.",
      2: "One address per device means the ARP table stays correct, so traffic reaches the right place every time."
    }
  },
  "wrong-mask": {
    steps: [
      "The subnet mask decides what a PC thinks is 'local'. Windows auto-filling 255.0.0.0 for a 10.x address is a well-known trap, because it quietly makes the local network enormous.",
      "The web working is the confusing part, and the useful clue. Internet addresses don't start with 10, so they still go to the router, while anything inside the company is treated as local.",
      "Name lookups work, so DNS is fine. That rules out one of the most common causes and moves the investigation on to routing.",
      "Thinking the file server is local, the PC asks for it with ARP on the Leeds network instead of sending it to the router. Nothing in Leeds answers, because the server is at head office.",
      "The routing table shows the mistake in one line: all of 10.0.0.0 marked as directly connected. Checking the route table is often faster than checking cables."
    ],
    fixed: {
      0: "With the right mask, only the Leeds addresses are local, matching every other PC in the office.",
      3: "Remote traffic now goes to the gateway, which sends it through the VPN to head office: exactly how the network was designed to work.",
      4: "The file share opens over SMB on TCP 445. The fix was one number, which is why checking the full IP configuration is worth doing early."
    }
  },
  "blocked-port": {
    steps: [
      "Ping proves the server is up and reachable. It doesn't prove the app's port is open, because ping and the app use completely different protocols.",
      "A firewall that drops traffic sends nothing back, so the browser just waits. Silence is very different from 'connection refused', which would mean the server answered but nothing was listening.",
      "Test-NetConnection checks a specific port. 'Ping succeeds, TCP fails' is the classic sign of a firewall blocking that port.",
      "Checking the server itself confirms the app is listening and the firewall is dropping the connections. That pins the fault on the firewall rule, not on the app or the network."
    ],
    fixed: {
      1: "With a rule allowing port 8443 from staff networks, the three-way handshake completes. Scoping the rule to staff networks, rather than everyone, keeps the app safer.",
      2: "Once the connection is open, the browser sets up encryption and the app loads. The app was fine all along; only the firewall needed changing."
    }
  },
  "vpn-dns": {
    steps: [
      "A VPN needs to hand out more than an address and a route. Without internal DNS servers, the laptop has no way to look up the company's private names.",
      "Ping by IP through the tunnel proves the VPN, routing and server all work. That narrows the fault down to names.",
      "Internal names like corp.contoso.com don't exist on the public internet. A home router can only ask the internet, so it'll always say 'no such name'.",
      "Public services like Teams and email still work because their names are public. 'Some things work over VPN, internal ones don't' usually points at VPN DNS settings."
    ],
    fixed: {
      0: "The corrected profile hands out internal DNS servers and the corp.contoso.com suffix, so short names like fs01 work too.",
      2: "Internal lookups now go through the tunnel to DC01, which knows every internal name.",
      3: "With names working, the share opens exactly as it does in the office. The VPN itself was never broken; its settings were incomplete."
    }
  },
  "wrong-clock": {
    steps: [
      "Name lookups working rules out DNS straight away, so you can move further up the journey.",
      "A successful TCP connection proves the network isn't blocking anything. Whatever's wrong happens after the connection opens.",
      "Certificates prove a website's identity, and every one has 'valid from' and 'valid to' dates. Your computer checks those dates against its own clock.",
      "With the clock in 2020, every certificate looks 'not yet valid', so every secure site fails at once. When everything secure breaks together, check the date and time first."
    ],
    fixed: {
      3: "With the correct time, today falls inside the certificate's dates and the check passes. Turning automatic time back on stops it drifting again.",
      4: "Every secure site works again, which confirms the clock was the only problem. It's a five-second fix once you know to look for it."
    }
  }
};
