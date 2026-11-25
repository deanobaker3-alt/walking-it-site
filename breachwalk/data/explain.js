/* Breachwalk: "Why it matters" for every step, shown in the What's happening box.
   steps[i] matches step i of the attack. Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
window.EXPLAIN = {
  "phish-bec": {
    steps: [
      "Lookalike domains are cheap and quick to register, so attackers set them up days in advance. Spotting newly registered domains that resemble yours is one of the earliest warnings you can get.",
      "Passing SPF, DKIM and DMARC only proves the email really came from the domain it claims, not that the domain is trustworthy. A brand-new domain sending to Finance for the first time is the real red flag.",
      "This is an adversary-in-the-middle attack. Ordinary MFA doesn't stop it, because the user genuinely completes MFA; the fake page just relays it and steals the session that comes back.",
      "A stolen session cookie works without the password or MFA. That's why resetting the password alone may not lock the attacker out; you also need to revoke the user's sessions.",
      "Inbox rules that hide replies are a hallmark of business email compromise. Checking for new rules that move or delete mail is one of the first things to do on a suspected compromise.",
      "Because the email comes from a genuine mailbox, every technical check passes. The defence here is process: always confirm changes to bank details by phone, on a number you already hold."
    ]
  },
  "mfa-fatigue": {
    steps: [
      "Passwords are stolen in bulk by infostealer malware and sold online. That's why MFA matters so much: a stolen password alone shouldn't be enough to get in.",
      "Push bombing relies on annoyance and confusion. A burst of MFA prompts the user didn't trigger is a strong sign their password has been stolen.",
      "The phone call is social engineering. Real IT teams don't ask you to approve prompts you didn't start, and staff need to hear that before it happens.",
      "One tap undoes all the protection MFA gives. Number matching, where you type a number shown on the sign-in screen, makes blind approval much harder.",
      "Registering their own MFA method gives the attacker lasting access, even if the password is later changed. New MFA registrations straight after a risky sign-in are worth alerting on.",
      "External forwarding rules quietly copy everything out of the organisation. Blocking automatic external forwarding stops this whole class of data theft."
    ]
  },
  "password-spray": {
    steps: [
      "Usernames are easy to guess once you know the email format, so they aren't a secret. Strong passwords and MFA have to do the protecting.",
      "Some sign-in pages give subtly different responses for real and fake accounts. Leaked or guessable usernames make the attacker's list much more accurate.",
      "One guess per account stays under the lockout threshold. That's what makes spraying hard to spot one account at a time: you have to look across all accounts at once.",
      "Waiting between rounds keeps the attacker under lockout counters. Lots of single failures from the same source over time is the pattern to hunt for.",
      "One weak password on one account without MFA is enough. Old shared and service accounts are often forgotten, which is exactly why attackers love them.",
      "Downloading a whole mailbox gives the attacker years of material to use in later attacks. A large sync from an unusual location is worth investigating straight away."
    ]
  },
  "sqli": {
    steps: [
      "A database error shown to the user is a clue for the attacker that input is reaching the database unfiltered. Websites should never show raw errors to the public.",
      "True and false tests confirm the attacker controls the query. From here it's just a question of what they choose to ask for.",
      "UNION queries let the attacker bolt their own question onto the website's. Listing the tables shows them where the valuable data lives.",
      "A response suddenly several times larger than usual is a useful detection signal. Normal product pages don't return thousands of rows of user data.",
      "Unsalted, fast hashes like MD5 crack quickly on ordinary hardware. Slow, salted algorithms like bcrypt turn hours into years.",
      "Logging in with real credentials looks like normal admin activity. That's why the earlier steps, and the database's permissions, are the places to stop it."
    ]
  },
  "xss": {
    steps: [
      "If formatting typed by a user is shown as formatting, the site is trusting user input. Real scripts are the next step.",
      "Stored XSS sits on the page and runs for every visitor, so one comment can attack everyone who reads it, including admins.",
      "The browser trusts the site, so it runs anything the site sends it. That's why the fix belongs on the website, not in the browser.",
      "Stealing the session cookie gives the attacker the admin's signed-in session. Marking cookies HttpOnly stops scripts from reading them at all.",
      "With a stolen session, the attacker is the admin as far as the site knows. Tying sessions to devices and keeping them short limits the damage."
    ]
  },
  "arp-poison": {
    steps: [
      "Knowing what normal looks like is what lets you spot the change. Here the gateway's real hardware address is the baseline.",
      "ARP has no way to check that an answer is true. Any device on the same network can claim to be the gateway, which is why switch-level protection matters.",
      "Two IP addresses suddenly sharing one MAC address is the tell-tale sign of ARP poisoning, and it's something switches and monitoring tools can alert on.",
      "Forwarding the traffic on keeps everything working, so nobody notices. Attacks that don't break anything are the hardest to spot.",
      "Unencrypted logins can be read by anyone in the middle. Using HTTPS everywhere means even a successful man-in-the-middle sees only scrambled data."
    ]
  },
  "dns-poison": {
    steps: [
      "Normal lookups are cached for a while, set by the TTL, which keeps DNS fast. That same caching is what lets a poisoned answer spread.",
      "Lookups for lots of random, made-up subdomains are unusual. A sudden flood of them is a sign someone is trying to poison the cache.",
      "The attacker needs to guess the query's transaction ID (and port) before the real answer arrives. Randomising both makes this far harder, and DNSSEC makes forged answers fail validation.",
      "A poisoned entry lasts as long as its TTL, so one lucky guess can misdirect everyone for a day.",
      "The address bar shows the right name, so users have no reason to be suspicious. That's why certificate warnings matter.",
      "Clicking through a certificate warning is what lets the attack succeed. Settings like HSTS remove the 'continue anyway' option on important sites."
    ]
  },
  "ransomware": {
    steps: [
      "Internet-facing devices like VPNs are top targets, and published flaws are exploited quickly. Patching them fast is one of the most effective defences there is.",
      "Regular 'check-ins' to an unfamiliar server are a classic command-and-control pattern. EDR and network monitoring can spot beaconing like this.",
      "Admins who log on to ordinary workstations leave credentials in memory. Keeping admin accounts off everyday machines, and protecting LSASS, removes this stepping stone.",
      "Admin credentials turn one infected PC into the whole network. Segmenting the network limits how far an attacker can move.",
      "Attackers delete backups first so you can't simply restore. Immutable or offline backups survive even when an admin account is compromised.",
      "Stealing data first gives the gang a second threat: pay, or it gets published. Large uploads to cloud storage from servers should always raise an alert.",
      "Encryption is the loud, final step, and usually comes days or weeks after the break-in. Every earlier step was a chance to catch it."
    ]
  },
  "cred-replay": {
    steps: [
      "Attackers often sit quietly on a compromised machine, waiting for someone valuable to log in. Patience is part of the attack.",
      "When a Domain Admin logs on to a workstation, their credentials are left in that machine's memory. That's why admin accounts should only log on to admin systems.",
      "With pass-the-hash, the attacker never needs the real password. The hash itself works as the credential, so changing the password is the only way to invalidate it.",
      "NTLM accepts the hash as proof of identity. Restricting NTLM, and watching for admin logons from unusual machines, makes this much harder.",
      "Domain Admin on a domain controller means control of every account and computer. At this point recovery is a major incident, not a quick fix."
    ]
  },
  "supply-chain": {
    steps: [
      "You can't patch your way out of a supplier's breach. Supply chain attacks go around your defences by abusing trust you've already given.",
      "A genuine digital signature only proves who built the software, not that it's safe. That's what makes these backdoors so hard to spot.",
      "Auto-updates are normally a good thing. Here they deliver the attack, which is why monitoring what software does after an update matters too.",
      "Waiting before acting helps the backdoor avoid sandboxes and early checks. Odd DNS patterns from servers that rarely talk to the internet are a key clue.",
      "Monitoring tools often have broad access. Giving them only the permissions they need limits what a compromised agent can reach.",
      "Slow exfiltration over DNS hides in normal traffic. Restricting which servers can talk to the internet, and watching DNS, are the main defences."
    ]
  },
  "kerberoast": {
    steps: [
      "Kerberoasting needs no special rights, just any domain account. That's why even a 'low-value' compromised account matters.",
      "Service accounts are often powerful and have passwords that never change. Listing them is the attacker's way of finding the weakest locks.",
      "Asking for the old RC4 encryption on purpose makes the tickets much easier to crack. Disabling RC4 and spotting requests for it are both strong defences.",
      "Cracking happens offline, so no failed logins are ever logged. Long, random service account passwords, or managed service accounts, make cracking impractical.",
      "A service account logging on from a sales laptop is unusual. 'Temporary' admin rights that were never removed turn a cracked password into a breach.",
      "The end goal is the data. HR records are especially sensitive, so this is likely to be a reportable data breach."
    ]
  },
  "oauth-consent": {
    steps: [
      "Anyone can register an app in their own tenant for free. The name and icon can look completely legitimate.",
      "Because the link really goes to Microsoft, link checkers see it as safe. The danger is in what the user is asked to approve, not where the link points.",
      "Consenting to an app gives it its own access, separate from the user's password. Restricting user consent and requiring admin approval for new apps stops this.",
      "The app reads mail through Microsoft Graph from the attacker's servers. That activity shows in the logs as the app, not as the user signing in.",
      "Resetting the password doesn't remove consent, because the app never used the password. You have to remove the app's permissions to stop it.",
      "The same consent often covers files too. Reviewing which apps have been granted access is an important part of the clean-up."
    ]
  },
  "quishing": {
    steps: [
      "QR codes hide links from email scanners, which look for clickable links. Attackers use them specifically to slip past filters.",
      "Scanning with a personal phone takes the user off the company network and away from its web filtering. The phone becomes the weak point.",
      "This is the same adversary-in-the-middle trick as other phishing: MFA is completed and relayed, so ordinary MFA doesn't help. Phishing-resistant MFA would.",
      "Adding their own MFA method keeps the attacker in, even after a password reset. New MFA registrations need checking after any suspected phish.",
      "Emails from a real colleague are far more convincing, so one compromised account can lead to many more. Fast containment really matters here."
    ]
  },
  "evil-twin": {
    steps: [
      "Laptops join networks by name. Anyone can broadcast the same name, and devices tend to prefer the strongest signal.",
      "Deauthentication messages can be forged on older Wi-Fi. Knocking devices off makes them reconnect, ideally to the attacker's network.",
      "Saved networks reconnect automatically, often without asking. That's how a laptop ends up on a twin with no click from the user.",
      "Captive portals asking for work credentials should always be treated as suspicious. Legitimate venue Wi-Fi doesn't need your company password.",
      "On-path, the attacker sees all unencrypted traffic and DNS lookups. Using the company VPN on untrusted Wi-Fi protects everything else.",
      "A VPN that only needs a password turns a stolen password into network access. Requiring MFA on remote access would stop this step."
    ]
  },
  "insider": {
    steps: [
      "Leavers going to competitors are a known risk window. Many organisations watch data activity more closely during notice periods.",
      "Downloading far more than your normal work, in a short time, is the key signal. Mark normally handled 40 accounts, not all of them.",
      "Encrypted archives stop security tools seeing what's inside. Creating them shortly before copying data out is a strong combined signal.",
      "USB storage is an easy way out of the building. Blocking or controlling removable media closes it.",
      "Uploads to personal cloud storage are another exit route. Data loss prevention tools can block or alert on them, especially for sensitive files."
    ]
  }
};
