/* Breachwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — the plain-English layer.
   Written for someone who has never seen these attacks before.
   intro:  one or two sentences shown at the top of the overview
   steps:  one entry per step, in order
     what: what is going on, in everyday words
     spot: how someone could notice it, in everyday words
   The original technical text (steps[].text, .defender, .facts) still shows under "Technical detail". */
window.PLAIN = {

"phish-bec": {
  intro: "A criminal tricks someone in Finance into logging in on a fake Microsoft page, takes over their email, then uses it to ask a customer to pay into the wrong bank account.",
  steps: [
    {what: "The criminal buys a web address that looks almost the same as the company's real one, and builds a fake copy of the Microsoft login page on it.",
     spot: "Nothing to see inside the company yet. Some security services watch for brand-new lookalike websites being set up."},
    {what: "Priya in Finance gets an email saying an invoice has been shared with her. It looks real, and it passes the basic email checks because the criminal set up their fake address properly.",
     spot: "The email comes from someone nobody has heard from before, on a website that's only two days old, and it asks you to log in. That mix is a big warning sign."},
    {what: "Priya clicks the link and logs in. The fake page quietly passes everything she types, including her MFA approval, to the real Microsoft. Microsoft hands back a 'you're logged in' pass, and the criminal keeps a copy.",
     spot: "The login records show Priya signing in from a data centre in another country instead of her office."},
    {what: "The criminal uses that copied pass to open Priya's mailbox. They don't need her password or her phone, because the pass says she's already logged in.",
     spot: "Someone is using Priya's mailbox from a new place and a new browser, without a matching login. One pass being used from two places is the giveaway."},
    {what: "The criminal sets up a hidden email rule. Any email mentioning invoices, payments or bank details gets moved out of sight, so Priya never sees the replies.",
     spot: "A brand-new rule that hides money-related emails in an odd folder is one of the clearest signs an account has been taken over."},
    {what: "Writing from Priya's real mailbox, in a real email thread, the criminal tells a customer 'our bank details have changed'. Because it truly comes from the company, every email check passes.",
     spot: "Very hard to spot by tech alone. The fix is a simple rule: always phone the supplier on a number you already know before changing bank details."}
  ]
},

"mfa-fatigue": {
  intro: "A criminal already knows someone's password. They keep sending 'approve this login?' alerts to the person's phone until, tired and confused, the person taps Approve.",
  steps: [
    {what: "J. Patel's password was stolen by malware on a home laptop and sold online. The criminal tries it from abroad, it works, and Microsoft asks for the second check on her phone.",
     spot: "The right password being used from a data centre abroad, half an hour after she logged in from London, already looks wrong."},
    {what: "The criminal keeps trying to log in. Each try sends an 'approve this login?' alert to her phone. She gets 17 in 7 minutes.",
     spot: "Lots of rejected phone approvals for one person in a few minutes is a loud alarm, as long as someone is watching for it."},
    {what: "Then a call arrives from 'IT support': 'We're fixing a fault. Approve the next alert and they'll stop.' It's the criminal.",
     spot: "This happens on a phone call, so the computer systems see nothing. Staff need to know IT will never ask them to approve an alert they didn't start."},
    {what: "Worn down and reassured, she taps Approve. The criminal is now logged in as her.",
     spot: "A successful login straight after a pile of rejections, from the same odd location, is the classic pattern."},
    {what: "Within two minutes the criminal adds their own phone to her account, so they can log in again whenever they like without her.",
     spot: "A new phone or app being added to an account right after a suspicious login is a very reliable alarm."},
    {what: "They set up a rule that secretly sends a copy of every email she receives to an outside address.",
     spot: "Rules that forward email outside the company, set up from a suspicious login, should be blocked and flagged."}
  ]
},

"password-spray": {
  intro: "Instead of guessing lots of passwords for one person, the criminal tries one common password on everyone. They only need one person to have used it.",
  steps: [
    {what: "The criminal collects staff names from LinkedIn and the company website, and works out the email format, like first.last@contoso.com.",
     spot: "You can't see this happening. Assume your staff email addresses are public."},
    {what: "Some login pages answer slightly differently for real and made-up accounts. The criminal uses that to find which 237 addresses are real.",
     spot: "Usually invisible. Login pages should give the same answer whether or not the account exists."},
    {what: "They try one popular password, 'Winter2026!', once on every account. One wrong guess each isn't enough to lock anyone out.",
     spot: "Hundreds of different people each getting one wrong password, all from the same place within minutes. That pattern is a password spray."},
    {what: "The criminal waits 45 minutes so the 'wrong password' counters reset, then goes again.",
     spot: "A burst of failures, a quiet spell, then another burst from the same place."},
    {what: "Round two tries 'Welcome1'. It works on an old shared account that was never given MFA. One weak spot is all it takes.",
     spot: "One success in the middle of hundreds of failures from the same place means someone got in. Act on it straight away."},
    {what: "Logged in, the criminal downloads the whole mailbox: years of invoices and an old spreadsheet listing VPN accounts.",
     spot: "A whole mailbox being downloaded from an anonymous network is easy to alert on. Better still, no account should be left without MFA."}
  ]
},

"sqli": {
  intro: "A shop website puts whatever you type straight into its database command. The criminal types database commands of their own, pulls out everyone's passwords and logs in as the admin.",
  steps: [
    {what: "The criminal adds one odd character, a single quote, to the web address. The website breaks and shows an error message from its database.",
     spot: "Error pages that show database messages are a red flag. Customers should never see them."},
    {what: "They add a 'this is true' test and a 'this is false' test to the address. The page changes depending on which they use, which proves they can control the database.",
     spot: "The same page being requested over and over with little logic tests added on the end."},
    {what: "They tack their own question onto the website's: 'list all your tables'. The product page now shows table names like users, orders and payments.",
     spot: "Database words like UNION SELECT in a web address are obvious. A web application firewall catches this instantly."},
    {what: "They ask for the users table, and get every username and scrambled password back. The page is six times bigger than usual.",
     spot: "A page that's suddenly much bigger than normal means data is leaving."},
    {what: "At home, the criminal unscrambles the passwords with a gaming graphics card. Seven in ten crack within the hour, including the admin's.",
     spot: "This happens on their computer, so you'll never see it. The only defence is storing passwords in a way that's very slow to crack."},
    {what: "They log in to the admin area with the real admin password and now control products, prices and orders.",
     spot: "An admin login from the same place that was attacking the site minutes earlier."}
  ]
},

"xss": {
  intro: "A forum shows comments exactly as people type them, code included. The criminal hides code in a comment, and when the admin reads it, the code quietly sends the admin's login pass to the criminal.",
  steps: [
    {what: "The criminal posts a test comment with a formatting code for bold text. It appears in bold, so the forum is running code that users type in.",
     spot: "A comment containing code is a small warning sign on its own, but worth recording."},
    {what: "They post a comment with hidden code inside. Anyone whose browser shows the comment will run the code without knowing.",
     spot: "Comments containing script code should be blocked, or at least flagged."},
    {what: "The forum admin opens the thread to check it. Their browser trusts the forum, so it runs the hidden code.",
     spot: "Nothing looks odd. It's just a normal page view, and the harm happens inside the browser."},
    {what: "The code grabs the admin's 'already logged in' pass and sends it to the criminal's website.",
     spot: "The admin's browser contacting a brand-new website straight after opening that thread."},
    {what: "The criminal loads the pass into their own browser and walks into the admin area. No password needed.",
     spot: "The same login pass being used from two places at once."}
  ]
},

"arp-poison": {
  intro: "On a local network, devices ask 'who is the router?' and believe whoever answers. A criminal on the same network keeps answering 'me!', so everyone's traffic goes through their laptop.",
  steps: [
    {what: "Normal behaviour: the victim's computer sends internet traffic to the real router, which it found earlier.",
     spot: "This is what 'normal' looks like. Remember the router's real hardware address, because it's about to change."},
    {what: "The criminal keeps telling the victim 'I'm the router', and telling the router 'I'm the victim'. Nothing on the network checks whether that's true.",
     spot: "Network monitoring can spot one device claiming to be the router, and answers nobody asked for."},
    {what: "Both the victim and the router believe the lie. Each now sends its traffic to the criminal's laptop.",
     spot: "Two different devices appearing to share the same hardware address is the classic sign."},
    {what: "The criminal passes everything on to the real router, so the internet still works and nobody notices they're in the middle.",
     spot: "Network switch logs may show traffic for the router suddenly coming from the wrong port."},
    {what: "The victim logs in to an old internal website that doesn't use encryption. The username and password go straight past the criminal in plain text.",
     spot: "Passwords being sent without encryption is worth fixing even if nobody is attacking."}
  ]
},

"dns-poison": {
  intro: "DNS is the internet's phone book: it turns names into addresses. The criminal plants a fake entry, so staff type the bank's correct address and still end up on the criminal's fake site.",
  steps: [
    {what: "Normal behaviour: a laptop asks the company's phone book for the bank's address and gets the real one. The phone book remembers it for an hour.",
     spot: "The weakness here is that this phone book answers anyone on the internet, not just staff."},
    {what: "From outside, the criminal floods the company's phone book with lookups for made-up names. Each one makes it go and ask the bank's server.",
     spot: "A flood of nonsense lookups from one outside address should never happen."},
    {what: "Each time, the criminal fires off lots of fake answers, pretending to be the bank, and hoping one arrives before the real answer. Eventually one gets lucky.",
     spot: "Lots of answers that don't match any question asked is a sign someone is trying this."},
    {what: "The fake answer is accepted and remembered for a whole day. Everyone who looks up the bank now gets the criminal's address.",
     spot: "Comparing what the phone book remembers with the bank's real answer shows the mismatch."},
    {what: "A finance user types the correct bank address, but is sent to the criminal's server.",
     spot: "Web logs show visits to the bank going to an address the bank doesn't own, with security certificate errors."},
    {what: "The browser shows a security warning. The user clicks 'continue anyway' and types their banking login into the fake site.",
     spot: "Train people to never click past a security warning on a bank or login page."}
  ]
},

"ransomware": {
  intro: "A criminal gang gets in through a security update that was never installed, takes over the admin accounts, deletes the backups, steals data, and only then locks every file and demands money.",
  steps: [
    {what: "A serious flaw in the company's VPN box was made public two months ago, with a fix. The fix was never installed, so the gang uses the flaw to get in.",
     spot: "Security scans had been flagging the missing fix for 60 days. Patching it was the real defence."},
    {what: "The gang installs remote-control software on a Finance computer. It checks in with them every minute, waiting for orders.",
     spot: "Security software sees an unknown program starting from a temp folder, talking to the same outside address like clockwork."},
    {what: "An IT admin logged in to that computer last week and never signed out. Their login details are still in memory, and the gang copies them.",
     spot: "Any program poking around in the part of Windows that stores logins is a top-priority alert."},
    {what: "Now using admin powers, the gang hops from that computer to the main servers.",
     spot: "A normal desk computer logging in to servers as a top-level admin, and new services appearing, is a sign of an intruder spreading."},
    {what: "Before doing anything noisy, they delete the backups so the company can't simply restore its files.",
     spot: "Backups being deleted is one of the last warnings before files get locked. Treat it as an emergency."},
    {what: "They copy 80 GB of Finance and HR files to an online storage service, so they can threaten to leak it.",
     spot: "A server uploading huge amounts of data to a consumer cloud service at night."},
    {what: "Finally, every file on every computer is scrambled and a ransom note appears in each folder.",
     spot: "By now it's loud and obvious, but it's very late. The earlier steps were the chances to stop it."}
  ]
},

"cred-replay": {
  intro: "On Windows networks, a scrambled copy of a password can sometimes be used instead of the real password. The criminal steals that copy from a computer's memory and uses it to log in everywhere.",
  steps: [
    {what: "The criminal already has secret control of a helpdesk computer from an earlier phishing email. They wait for someone important to log in.",
     spot: "An earlier alert on this computer was dismissed as harmless adware. Small alerts on IT computers deserve a second look."},
    {what: "An IT admin logs in to that computer to fix a printer, using a powerful admin account. Windows keeps a scrambled copy of that account's password in memory.",
     spot: "Top-level admin accounts shouldn't be used on ordinary computers at all. It should be blocked, or at least alerted on."},
    {what: "The admin disconnects without signing out. The criminal copies the scrambled password from memory. They never learn the real password, and don't need to.",
     spot: "Security software should catch any program reading the part of Windows that stores logins."},
    {what: "The criminal uses the scrambled copy to log in to the file server as the admin. The server accepts it as if it were the real password.",
     spot: "A top-level admin logging in to a server from a helpdesk computer, using an older login method."},
    {what: "The same trick works on the main server that controls every account. The criminal now controls the whole network.",
     spot: "Admin powers being used from a desk computer, plus a new service on the main server, means the network is taken over."}
  ]
},

"supply-chain": {
  intro: "The criminal never attacks you directly. They break into a software company you trust, hide a backdoor in a genuine update, and your server installs it automatically.",
  steps: [
    {what: "The criminal tricks a developer at the software company and uses their access to reach the system that builds the software.",
     spot: "Nothing to see on your side. Checking how well your suppliers protect themselves is the only lever you have."},
    {what: "They sneak a backdoor into the next update. The software company's own system signs it as genuine.",
     spot: "Still nothing. The update really is signed by the supplier, so every check passes."},
    {what: "Your monitoring server downloads and installs the update overnight, exactly as it's set up to do.",
     spot: "Your software list shows a new version. That's normal on its own, but useful later to work out what was affected."},
    {what: "The backdoor stays quiet for 12 days to avoid being caught, then starts sending messages to the criminal hidden inside ordinary internet lookups.",
     spot: "A server regularly looking up a rare, brand-new web address, even from 'trusted' software."},
    {what: "Through the backdoor, the criminal uses the software's powerful account to list every user and admin in the company.",
     spot: "An account that normally does one job suddenly reading the whole company directory."},
    {what: "Over a week, the stolen information leaves in tiny pieces hidden inside internet lookups, slowly enough to look like background noise.",
     spot: "One computer making an unusual number of odd-looking internet lookups."}
  ]
},

"kerberoast": {
  intro: "In Windows networks, any normal user can ask for a 'ticket' for a service account, and part of that ticket is locked with the account's password. The criminal takes the tickets home and cracks the weak passwords.",
  steps: [
    {what: "The criminal has secret control of an ordinary sales person's computer. No admin rights, and for this attack they don't need any.",
     spot: "Nothing new yet. The point is that none of the next steps need special powers."},
    {what: "They ask the network for a list of 'service accounts': accounts that run background systems, and often have very old passwords.",
     spot: "A sales user listing every service account in the company is unusual, and identity security tools flag it."},
    {what: "They ask for a ticket for each one, deliberately choosing an old, weaker lock. Any user is allowed to ask, so the network hands them over.",
     spot: "One user asking for lots of tickets at once, using the old lock type when everything else uses the modern one."},
    {what: "At home, the criminal cracks the tickets. One service account's password, unchanged for seven years, falls in 40 minutes.",
     spot: "This happens on their computer, so you'll never see it. Only long, random service account passwords protect you."},
    {what: "They log in with that service account from the sales laptop. Years ago it was given admin rights on the database server 'temporarily'.",
     spot: "A service account logging in from a normal laptop is never normal."},
    {what: "They export the HR database: 2,300 staff records with home addresses, salaries and bank details.",
     spot: "Database records show a service account doing a huge export with a tool it has never used before."}
  ]
},

"oauth-consent": {
  intro: "No password is stolen. The criminal gets someone to click 'Accept' on a real Microsoft screen, giving a fake app permission to read their email and files.",
  steps: [
    {what: "The criminal creates an app called 'DocuView Pro' with a document icon. It asks for permission to read email and files, and to stay connected.",
     spot: "Nothing to see yet. This happens in the criminal's own account."},
    {what: "Sam gets an email: 'The signed NDA is ready, view it in DocuView.' The link really does go to Microsoft, so link checkers think it's safe.",
     spot: "A Microsoft link that asks you to approve an unknown app, in an email from someone new, is a strong warning sign."},
    {what: "Sam logs in on the genuine Microsoft page, does his MFA, then sees 'DocuView Pro wants to read your mail and files'. He clicks Accept. The app now has its own access.",
     spot: "The admin logs record Sam approving an unknown app that wants to read email and files. That's the alert to set up."},
    {what: "From the criminal's server, the app reads through Sam's mailbox: contracts, settlements, everything the legal team is working on.",
     spot: "Email being read by an app you've never seen before, from a data centre."},
    {what: "The helpdesk notices and resets Sam's password. It makes no difference: the app never used his password, so it keeps working.",
     spot: "The app is still active after the reset, which proves you have to remove the app's permission, not just change the password."},
    {what: "The app also downloads 1,400 files from Sam's OneDrive and the legal team's shared folders.",
     spot: "An outside app downloading that many files should be switched off automatically."}
  ]
},

"quishing": {
  intro: "The phishing link is hidden inside a QR code, so email filters can't see it. The victim scans it with their own phone, away from all the company's protection.",
  steps: [
    {what: "Dan and 40 colleagues get an email: 'Re-register your MFA by Friday'. It has a PDF with a QR code in it and no clickable links, so the email scanner has nothing to check.",
     spot: "A new sender, a lookalike address and a PDF with just a picture in it. An urgent 'do this now' email with no links is suspicious in itself."},
    {what: "Dan scans the QR code with his personal phone. It opens the fake website over mobile data, outside every company protection.",
     spot: "Nothing to see. That's the whole trick: it happens on a phone and network the company can't watch."},
    {what: "The fake page passes Dan's password and MFA approval straight to the real Microsoft, and keeps a copy of his 'already logged in' pass.",
     spot: "Login records show Dan signing in from a data centre on a computer he doesn't own."},
    {what: "Using that pass, the criminal adds their own authenticator app to Dan's account, so they can log in again any time.",
     spot: "A new authenticator added minutes after a suspicious login is a very reliable alarm."},
    {what: "From Dan's real mailbox, the criminal sends the same QR email to 600 colleagues. Coming from a real colleague, it's much more convincing.",
     spot: "One person suddenly emailing the same attachment to hundreds of colleagues."}
  ]
},

"evil-twin": {
  intro: "At a conference, the criminal sets up Wi-Fi with exactly the same name as the venue's. Laptops join it, a fake login page asks for work passwords, and all the traffic goes through the criminal's laptop.",
  steps: [
    {what: "Two rows back, the criminal's laptop starts broadcasting Wi-Fi with exactly the venue's name, and a stronger signal.",
     spot: "Nothing to see on the company network. Only a Wi-Fi survey would show two networks with the same name."},
    {what: "The criminal sends fake 'disconnect' messages pretending to be the venue's Wi-Fi. Ellie's laptop believes them and drops off.",
     spot: "Wireless monitoring would see a flood of disconnect messages. On the laptop it just looks like a dropped connection."},
    {what: "Ellie's laptop reconnects straight away, picking the strongest signal with that name: the criminal's.",
     spot: "The laptop's Wi-Fi log shows the same network name as this morning, but different hardware."},
    {what: "A 'Welcome to ConfHall Wi-Fi' page asks Ellie to sign in with her work email and password. She does.",
     spot: "The laptop sending a login form, unencrypted, to a network the company doesn't own."},
    {what: "All her traffic now goes through the criminal's laptop. Anything not encrypted can be read or changed.",
     spot: "Internet lookups being answered by a device on a network you don't own."},
    {what: "That evening, the criminal logs in to the company's old VPN with Ellie's password. It only asks for a password, so they're straight in.",
     spot: "A VPN login for Ellie from somewhere she isn't, while her laptop is online at the hotel."}
  ]
},

"insider": {
  intro: "Mark is leaving to join a competitor. In his last two weeks he quietly takes the customer list and pricing, using access he's genuinely allowed to have.",
  steps: [
    {what: "Mark hands in his notice. He's joining a competitor in two weeks, and keeps all his access until his last day.",
     spot: "HR knows he's leaving, but does the security team? Leavers are one of the strongest risk signals, if the information gets shared."},
    {what: "In one lunch break he downloads the whole Sales team site: every customer's contracts, prices and contacts, not just his own 40 accounts.",
     spot: "A leaver downloading over 100 times more than usual is the textbook warning sign."},
    {what: "He packs everything into one password-protected zip file, so security tools can't look inside.",
     spot: "Security software sees a large, password-protected zip being made from company folders."},
    {what: "He copies the zip to a USB stick he brought from home.",
     spot: "Device logs show 2.4 GB copied to a USB stick never seen on a company laptop before."},
    {what: "To be safe, he also uploads it to his personal cloud storage from the office network.",
     spot: "The web filter sees a 2.4 GB upload to a personal storage site."}
  ]
}
};

/* Friendly names for the kill-chain phases (ph 1..7) */
window.PLAIN_PHASE = ["Getting ready", "Getting in", "Settling in", "Stealing logins", "Spreading out", "Taking data", "Doing the damage"];

/* Jargon buster: shown under a step when the term appears in it.
   [label, pattern (case-insensitive), plain meaning] */
window.GLOSSARY = [
  ["MFA", "\\bMFA\\b|multi-factor|second check|authenticator", "Multi-factor authentication: a second check after your password, like approving an alert on your phone."],
  ["Phishing", "phish", "A fake message designed to trick you into clicking a link, logging in or opening something."],
  ["Session cookie", "session cookie|logged in.{0,3} pass|login pass|the pass\\b|copied pass|the cookie", "A small file your browser keeps after you log in so you don't have to log in again on every page. Whoever has it can act as you."],
  ["Adversary-in-the-middle", "in-the-middle|relay|passes everything|passes .{0,30} straight", "A fake site that sits between you and the real one, passing everything along while keeping a copy."],
  ["Lookalike domain", "lookalike|looks almost the same", "A web address made to look like a real one, for example contoso-sharepoint.example instead of contoso.sharepoint.com."],
  ["SPF / DKIM / DMARC", "\\bSPF\\b|\\bDKIM\\b|\\bDMARC\\b|basic email checks|email checks", "Email checks that confirm a message really came from the domain it claims. They don't tell you whether that domain is trustworthy."],
  ["Inbox rule", "inbox rule|email rule|forwards every|rule that", "An automatic instruction in a mailbox, like 'move emails containing X to folder Y'. Attackers use them to hide or copy mail."],
  ["Entra ID", "Entra", "Microsoft's login system for work accounts (it used to be called Azure AD)."],
  ["Infostealer", "infostealer|stolen by malware", "Malware that grabs saved passwords and logins from a computer and sends them to criminals."],
  ["Password spray", "spray", "Trying one common password against lots of accounts, instead of lots of passwords against one account."],
  ["Account lockout", "lock(ed)? out|lockout", "A safety feature that blocks an account after too many wrong passwords."],
  ["SQL", "\\bSQL\\b|database command|database", "The language websites use to talk to their database."],
  ["Hash", "\\bhash|scrambled", "A scrambled, one-way version of a password. Websites store these instead of the real password."],
  ["Salt", "unsalted|\\bsalt", "Random extra data added to each password before scrambling, so identical passwords don't look identical and are slower to crack."],
  ["WAF", "\\bWAF\\b|web application firewall", "Web application firewall: a filter in front of a website that blocks known attack patterns."],
  ["XSS", "\\bXSS\\b|hidden code|\\bscript", "Cross-site scripting: sneaking code into a website so it runs in other visitors' browsers."],
  ["ARP", "\\bARP\\b|who is the router|I'm the router", "The way devices on a local network find each other's hardware addresses. It believes any answer it gets."],
  ["MAC address", "\\bMAC\\b|hardware address", "A device's hardware address on the local network."],
  ["Router / gateway", "router|gateway", "The device that connects a local network to the internet."],
  ["Plain text / HTTP", "\\bHTTP\\b|plain text|cleartext|unencrypted|without encryption", "Data sent without encryption, so anyone in the path can read it."],
  ["DNS", "\\bDNS\\b|phone book|internet lookups|lookups", "The internet's phone book: it turns names like bank.example into the numeric addresses computers use."],
  ["Certificate warning", "certificate|security warning", "Your browser's warning that a site can't prove it is who it says it is. On a login page, stop."],
  ["VPN", "\\bVPN\\b", "Virtual private network: a secure tunnel into the company network from outside."],
  ["Patch", "\\bpatch|fix was never|update that fixes", "A software update that fixes a security flaw."],
  ["CVE", "\\bCVE\\b|serious flaw|made public", "A publicly listed security flaw with an ID number. Once listed, attackers go looking for anyone who hasn't patched."],
  ["C2 (command and control)", "\\bC2\\b|checks in|remote-control|sending messages to the criminal", "The channel malware uses to check in with the attacker and get orders."],
  ["LSASS", "LSASS|stores logins|login details are still in memory|in memory", "The part of Windows that holds the logins of people currently signed in. Attackers love reading it."],
  ["Domain Admin", "Domain Admin|top-level admin|controls every account", "The most powerful account type in a Windows network. It controls everything."],
  ["Lateral movement", "lateral|hops from|spreading", "Moving from one computer to others inside a network after getting in."],
  ["Backups", "backup", "Copies of data kept so it can be restored. Ransomware gangs delete them first."],
  ["Exfiltration", "exfiltrat|leaves in|leave in|data is leaving|copy .{0,20} to an online|uploads", "Taking data out of the organisation."],
  ["Ransomware", "ransom", "Malware that scrambles files and demands payment to unscramble them."],
  ["Pass-the-hash", "pass-the-hash|scrambled copy", "Logging in with the scrambled copy of a password instead of the password itself."],
  ["Supply chain attack", "supply chain|software company", "Attacking a trusted supplier so their product carries the attack to you."],
  ["Code signing", "signs it|signed by|signed as genuine|signed\\.", "A digital stamp proving software came from its maker. It can't tell you whether the maker was hacked."],
  ["Backdoor", "backdoor", "Hidden access that lets an attacker get back in whenever they want."],
  ["Service account", "service account", "An account used by a system or app rather than a person. Often powerful, often forgotten."],
  ["Kerberos ticket", "ticket|Kerberos", "A pass Windows networks hand out so you can use a service without typing your password again."],
  ["OAuth app consent", "OAuth|consent|'Accept'|clicks Accept|permission to read|wants to read", "Clicking 'Accept' to let an app access your account. The app gets its own key that survives password changes."],
  ["Token", "\\btoken|its own access", "A digital key issued after login. Apps use them instead of your password."],
  ["QR code phishing", "QR", "Hiding a phishing link in a QR code so email filters can't read it and you open it on your phone."],
  ["Evil twin", "same name|venue's name|evil twin", "A fake Wi-Fi network with the same name as a real one."],
  ["Captive portal", "captive portal|Welcome to ConfHall", "The login page some Wi-Fi networks show before letting you online."],
  ["Insider threat", "insider|leaver|his notice", "Risk from someone who already has legitimate access, like a member of staff."],
  ["DLP", "\\bDLP\\b|security tools can't look inside", "Data loss prevention: tools that spot sensitive data leaving the company."],
  ["Social engineering", "social engineering|a call arrives|IT support'", "Manipulating people, rather than computers, into doing what the attacker wants."]
];
