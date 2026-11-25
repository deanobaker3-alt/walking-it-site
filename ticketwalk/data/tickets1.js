/* Ticketwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — tickets 1–4. (5–8 are in tickets2.js.)

   HOW A TICKET IS DESCRIBED
   {
     id, cat, name, sub          id is also the #hash that opens it
     impact                      who's affected (shown as a chip)
     systems: ["Entra ID", ...]  the systems involved
     cause                       one-line root cause (also used in Diagnose mode)
     fail                        what the user sees when it isn't fixed (banner + debrief)
     ticket: {ref, from, via, text}
     intro                       plain-English summary
     summary                     technical summary (under "Technical detail")
     facts: [[k, v], ...]
     nodes: [{id, kind, label, sub, x, y, ghost?, hostile?}]
             kinds: user, agent, caller (hostile), laptop, phone, server, dc, idp, mail, db, cloud, printer, ap
     links, lanes                as Breachwalk
     stage: 1..7                 the ticket stage where it goes wrong if nobody finds the real cause
     steps: [STEP, ...]          the broken run, ending with the problem still there
     fixed: [n | STEP, ...]      the working run: a number reuses steps[n]
     fixes: [{id, kind: "fix"|"herring", name, short, desc, result, at, ev}]
             fix:     plays the fixed run; ev shows at fixed-run step `at`
             herring: the run still fails; result + ev show at broken-run step `at`
     verify, triage, notes: [{t, ok?, why}] × 3   the "Your call" questions; exactly one ok each
     debrief: {check: [], fix: [], prevent: []}
     tell                        the giveaway clues, for Diagnose mode
   }
   STEP = {title, sub, ph (1..7), what, check, tech, facts?, msgs: [{from, to, label, kind, lost?}],
           callout?, focus?, fault?: [nodeIds], cmds?: {win: PowerShell, nix: where to click}, evidence: [EV]}
     msg kinds: normal (blue), data (amber, replies), bad (red, the problem), fix (green)
   EV = {t, src, title, sev: err|warn|clue|info|ok, kind: ticket|cmd|log|email|screen, fields: [[name, value, meaning]], raw}
        t is when the service desk sees it, so times always run forwards; the raw text keeps the original timestamps.

   Every company, person, phone number, IP address and domain is made up. Phone numbers are from the UK's
   drama range (07700 900xxx), IPs are private or documentation ranges, MACs are 00:00:5e:00:53:xx. */
(function () {
const R = String.raw;
window.TICKETS = (window.TICKETS || []).concat([

/* ============ 1. REPEAT LOCKOUTS ============ */
{
  id: "lockout", cat: "accounts", name: "Locked out every morning", sub: "Something keeps trying the old password",
  impact: "One user · Finance", systems: ["Active Directory", "NPS (Wi-Fi sign-in)", "Staff Wi-Fi", "Tom's phone"],
  cause: "His phone keeps joining the staff Wi-Fi with his old password",
  fail: "Locked out again at 09:31",
  ticket: {ref: "INC-31872", from: "Tom Reed · Finance", via: "Phone call", text: "I'm locked out AGAIN. Third morning running. I changed my password on Monday like the reminder told me to and it's been a nightmare ever since. You unlocked me yesterday!"},
  intro: "Tom changed his password on Monday. His laptop knows the new one, but his phone is still set up to join the staff Wi-Fi with the old one. Every morning when he walks in, the phone quietly tries the old password a few times, and Active Directory locks his account. Unlocking it only lasts until the phone tries again.",
  summary: "The staff Wi-Fi uses 802.1X (PEAP with MSCHAPv2), with NPS01 checking each sign-in against Active Directory. Tom's phone still has a saved CORP-STAFF profile holding his old password. Every time it reconnects, each attempt counts as a bad password in AD. With a lockout threshold of 5 and a 15-minute lockout, the account locks soon after he arrives, unlocks itself, then locks again on the next retry. Event 4740 on the PDC emulator names NPS01 as the caller computer, and NPS event 6273 (reason code 16) gives the phone's MAC address as the Calling Station Identifier.",
  facts: [["Symptom", "Locked out every morning, around ten to nine"], ["Root cause", "Old password saved in the phone's Wi-Fi profile"], ["Who's affected", "One user"], ["Key evidence", "4740 caller = NPS01; 6273 reason 16 from the phone's MAC"]],
  nodes: [
    {id: "desk", kind: "agent", label: "Service desk", sub: "You · 1st line", x: 130, y: 170},
    {id: "tom", kind: "user", label: "Tom Reed", sub: "Finance", x: 130, y: 450},
    {id: "phone", kind: "phone", label: "Tom's phone", sub: "Saved Wi-Fi: old password", x: 380, y: 520},
    {id: "ap", kind: "ap", label: "Office Wi-Fi", sub: "CORP-STAFF · 802.1X", x: 600, y: 450},
    {id: "nps", kind: "server", label: "NPS01", sub: "Wi-Fi sign-in (RADIUS)", x: 820, y: 520},
    {id: "dc", kind: "dc", label: "DC01", sub: "Domain controller (PDC)", x: 860, y: 230}
  ],
  links: [["desk", "tom"], ["tom", "phone"], ["phone", "ap"], ["ap", "nps"], ["nps", "dc"], ["desk", "dc"], ["desk", "nps"]],
  lanes: ["desk", "tom", "phone", "ap", "nps", "dc"],
  stage: 5,
  steps: [
    {title: "Tom rings the desk", sub: "Third lockout this week", ph: 1,
     what: "Tom calls from his desk phone. He's locked out of his PC again, for the third morning running. Yesterday someone unlocked him and closed the ticket. The day before, the same.",
     check: "Before you touch anything, look at his ticket history. Two 'unlocked, closed' tickets in two days means something is causing this, and unlocking alone won't stop it.",
     tech: "The ticket links to INC-31744 (Tuesday) and INC-31790 (Wednesday), both closed as 'Account unlocked'. Repeat lockouts at the same time of day almost always mean a device or service is replaying a stored, out-of-date password.",
     msgs: [{from: "tom", to: "desk", label: "Locked out again!", kind: "normal"}],
     evidence: [{t: "08:58:10", src: "Service desk · ticket", title: "INC-31872 logged: locked out, 3rd time this week", sev: "info", kind: "ticket",
       fields: [["Caller", "Tom Reed, Finance", "Ringing from his desk phone, ext 4417"], ["Category", "Accounts › Lockout", ""], ["Related", "INC-31744 (Tue), INC-31790 (Wed)", "Both closed as 'Account unlocked'"]],
       raw: R`INC-31872   Logged 26/11/2026 08:58   Service Desk
Caller:    Tom Reed (Finance)   ext 4417
Channel:   Phone
Category:  Accounts › Lockout
Summary:   Locked out again. 3rd morning in a row.
Related:   INC-31744  Tue 24/11  "Account unlocked."   Closed
           INC-31790  Wed 25/11  "Unlocked again."     Closed

Caller says: changed password Mon 23/11 when prompted.
Locked out every morning since, around ten to nine.`}]},
    {title: "Check it's really Tom", sub: "Call back on the number on file", ph: 2,
     what: "Unlocking an account gives it straight back to whoever is on the phone, so you check it's Tom first. You ring him back on the mobile number held in the staff directory, and he answers.",
     check: "A callback to a number you already hold is the simplest strong check. Questions like 'what's your employee ID?' are easy to find out, so they don't prove much.",
     tech: "Callback to the mobile on file (07700 900412) from the directory, not the number the caller gives. Note it on the ticket so the next person can see how identity was confirmed.",
     msgs: [{from: "desk", to: "tom", label: "Calling back on his mobile on file", kind: "normal"}, {from: "tom", to: "desk", label: "It's me, answering", kind: "data"}],
     evidence: [{t: "09:00:40", src: "Service desk · ticket note", title: "Identity confirmed by callback to the mobile on file", sev: "ok", kind: "ticket",
       fields: [["Method", "Callback", "To 07700 900412, from the staff directory"], ["Result", "Tom answered", "Identity confirmed"]],
       raw: R`26/11/2026 09:00  Service Desk
Identity check: callback to mobile on file (07700 900412, staff directory).
Tom answered. Verified.`}]},
    {title: "Triage", sub: "One person, can't work, keeps happening", ph: 3,
     what: "One person is affected and he can't work, so it's a P3 on most service desks. Because it's the third time, you link the earlier tickets and decide to find out why, not just unlock it again.",
     check: "Priority comes from impact (how many people) and urgency (how badly it stops them). Repeats are a reason to investigate, not to rush.",
     tech: "Impact low (1 user), urgency high (cannot sign in) → P3. Linking INC-31744 and INC-31790 turns three closed-and-forgotten tickets into a visible pattern.",
     msgs: [], focus: ["desk"], callout: "P3 · 3rd lockout: find the cause",
     evidence: [{t: "09:01:30", src: "Service desk · ticket", title: "Priority P3, linked to 2 earlier lockouts", sev: "info", kind: "ticket",
       fields: [["Priority", "P3", "One user, can't sign in"], ["Linked", "INC-31744, INC-31790", "Same symptom, same time of day"]],
       raw: R`26/11/2026 09:01  Service Desk
Priority: P3 (impact: 1 user, urgency: high)
Linked: INC-31744, INC-31790. Investigating cause before unlocking.`}]},
    {title: "What locked it?", sub: "Event 4740 names the culprit", ph: 4,
     what: "You ask the domain controller who locked Tom's account. Every lockout is logged with the name of the machine that sent the bad passwords. It isn't Tom's laptop. It's NPS01, the server that signs people in to the Wi-Fi.",
     check: "Look for event 4740 on the domain controller that holds the PDC role and read 'Caller Computer Name'. That's the machine the bad passwords came through.",
     tech: "Get-ADUser shows LockedOut True, BadLogonCount 5 and LastBadPasswordAttempt 08:51:58, with PasswordLastSet on Monday. Event 4740 at 08:52:03 lists Caller Computer Name NPS01, so the failures came in through RADIUS, not an interactive sign-in.",
     msgs: [{from: "desk", to: "dc", label: "Who locked tom.reed?", kind: "normal"}, {from: "dc", to: "desk", label: "4740 · caller: NPS01", kind: "data"}],
     cmds: {win: R`Get-ADUser tom.reed -Properties LockedOut, BadLogonCount, LastBadPasswordAttempt, PasswordLastSet |
  Format-List Name, LockedOut, BadLogonCount, LastBadPasswordAttempt, PasswordLastSet

# Which machine locked it? Ask the PDC emulator for event 4740
Get-WinEvent -ComputerName DC01 -FilterHashtable @{LogName='Security'; Id=4740} -MaxEvents 5 |
  Format-List TimeCreated, Message`, nix: R`Active Directory Users and Computers
  › find tom.reed › Properties › Account tab
  ("Unlock account" is ticked if it's locked)

Event Viewer on DC01 (the PDC emulator)
  › Windows Logs › Security › Filter Current Log
  › Event ID 4740 › read "Caller Computer Name"`},
     evidence: [{t: "09:04:12", src: "DC01 · PowerShell", title: "Locked out at 08:52; event 4740 says the caller was NPS01", sev: "clue", kind: "cmd",
       fields: [["LockedOut", "True", "Five bad passwords in a row"], ["PasswordLastSet", "23/11/2026 09:14", "Monday: when the trouble started"], ["Caller Computer Name", "NPS01", "The Wi-Fi sign-in server, not Tom's laptop"]],
       raw: R`PS C:\> Get-ADUser tom.reed -Properties LockedOut,BadLogonCount,LastBadPasswordAttempt,PasswordLastSet | fl Name,LockedOut,BadLogonCount,LastBadPasswordAttempt,PasswordLastSet

Name                   : Tom Reed
LockedOut              : True
BadLogonCount          : 5
LastBadPasswordAttempt : 26/11/2026 08:51:58
PasswordLastSet        : 23/11/2026 09:14:36

PS C:\> Get-WinEvent -ComputerName DC01 -FilterHashtable @{LogName='Security';Id=4740} -MaxEvents 1 | fl TimeCreated,Message

TimeCreated : 26/11/2026 08:52:03
Message     : A user account was locked out.

              Subject:
                Security ID:        S-1-5-18
                Account Name:       DC01$
                Account Domain:     CORP

              Account That Was Locked Out:
                Account Name:       tom.reed

              Additional Information:
                Caller Computer Name:   NPS01`}]},
    {title: "Behind the scenes: the phone", sub: "Old password, saved in the Wi-Fi settings", ph: 5,
     what: "NPS01's log shows failed Wi-Fi sign-ins as tom.reed, all from one device: his phone. When he changed his password on Monday, his phone kept the old one saved for the staff Wi-Fi. Every morning it walks into range, tries the old password over and over, and locks him out.",
     check: "On the NPS server, look for event 6273 with reason code 16 (wrong user name or password). The Calling Station Identifier is the MAC address of the device doing it.",
     tech: "Event 6273, Reason Code 16: 'Authentication failed due to a user credentials mismatch.' Authentication type PEAP / EAP-MSCHAP v2, Calling Station Identifier 00-00-5E-00-53-2A, which matches Tom's phone in the device inventory. Each attempt is forwarded to AD as a bad password.",
     msgs: [{from: "desk", to: "nps", label: "Show failed sign-ins", kind: "normal"}, {from: "nps", to: "desk", label: "Reason 16 · from Tom's phone", kind: "data"}, {from: "phone", to: "ap", label: "Join Wi-Fi: old password", kind: "bad"}, {from: "nps", to: "dc", label: "Bad password ×5 → lock", kind: "bad"}],
     callout: "Old password saved on the phone", fault: ["phone"],
     cmds: {win: R`# On NPS01: failed Wi-Fi sign-ins for Tom today
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=6273; StartTime=(Get-Date).Date} |
  Where-Object Message -match 'tom.reed' |
  Format-List TimeCreated, Message`, nix: R`Event Viewer on NPS01
  › Custom Views › Server Roles › Network Policy and Access Services
  › look for Event ID 6273
  › Reason Code 16 = wrong user name or password
  › Calling Station Identifier = the device's MAC address`},
     evidence: [{t: "09:06:55", src: "NPS01 · Security log", title: "Event 6273: Wi-Fi sign-in refused, reason 16, from MAC 00-00-5E-00-53-2A", sev: "err", kind: "log",
       fields: [["Account", "CORP\\tom.reed", ""], ["Calling Station Identifier", "00-00-5E-00-53-2A", "Tom's phone, from the device inventory"], ["Authentication", "PEAP · EAP-MSCHAP v2", "Username and password Wi-Fi"], ["Reason Code", "16", "Wrong user name or password"]],
       raw: R`Log Name:      Security
Event ID:      6273
Task Category: Network Policy Server
Keywords:      Audit Failure
Computer:      NPS01.corp.contoso.com
Logged:        26/11/2026 08:51:58
Network Policy Server denied access to a user.

User:
	Account Name:			tom.reed
	Account Domain:			CORP
Client Machine:
	Calling Station Identifier:	00-00-5E-00-53-2A
NAS:
	NAS Identifier:			WLC01
Authentication Details:
	Network Policy Name:		CORP-STAFF Wi-Fi
	Authentication Type:		PEAP
	EAP Type:			Microsoft: Secured password (EAP-MSCHAP v2)
	Reason Code:			16
	Reason:				Authentication failed due to a user credentials mismatch. Either the user name provided does not map to an existing user account or the password was incorrect.`}]},
    {title: "Locked out again", sub: "09:31, and nothing has changed", ph: 7,
     what: "A lockout here lasts 15 minutes, then clears itself. As soon as it does, the phone tries the old password again and locks Tom out again at 09:31. Whatever you do at the desk, as long as the phone has the old password saved, the ticket keeps coming back.",
     check: "If the bad password count climbs again after an unlock, the cause is still out there. Don't close the ticket until it stays at zero.",
     tech: "Second 4740 of the morning at 09:31:18, caller NPS01 again. Lockout threshold 5, duration 15 minutes, observation window 15 minutes (Default Domain Policy).",
     msgs: [{from: "phone", to: "ap", label: "Retry: old password", kind: "bad"}, {from: "ap", to: "nps", label: "RADIUS: tom.reed", kind: "normal"}, {from: "dc", to: "nps", label: "Account locked out", kind: "bad"}],
     callout: "Locked out again", fault: ["phone"],
     evidence: [{t: "09:31:20", src: "DC01 · Security log", title: "Event 4740 again: tom.reed locked out, caller NPS01", sev: "err", kind: "log",
       fields: [["Time", "09:31:18", "The lockout cleared itself at 09:07, then the phone tried again"], ["Caller Computer Name", "NPS01", "Same source as before"]],
       raw: R`26/11/2026 09:31:18  Event 4740  A user account was locked out.
  Account That Was Locked Out:  tom.reed
  Caller Computer Name:         NPS01`}]}
  ],
  fixed: [0, 1, 2, 3, 4,
    {title: "Fix the phone, then unlock", sub: "Take the old password off the phone", ph: 6,
     what: "You talk Tom through forgetting the CORP-STAFF Wi-Fi on his phone and joining it again with his new password. Then, and only then, you unlock his account. This time NPS01 lets the phone in, because the password is right.",
     check: "On NPS01 you should now see event 6272 (access granted) for tom.reed from the same MAC address, and no more 6273s.",
     tech: "Phone rejoins CORP-STAFF with current credentials; NPS logs 6272 'Network Policy Server granted access to a user' for Calling Station Identifier 00-00-5E-00-53-2A. Unlock-ADAccount resets lockout; BadLogonCount stays at 0.",
     msgs: [{from: "desk", to: "tom", label: "Forget CORP-STAFF, rejoin", kind: "fix"}, {from: "phone", to: "ap", label: "Join Wi-Fi: new password", kind: "fix"}, {from: "nps", to: "dc", label: "Check password", kind: "normal"}, {from: "dc", to: "nps", label: "Correct ✓", kind: "data"}],
     callout: "New password on the phone",
     cmds: {win: R`# Only unlock once the device with the old password is sorted
Unlock-ADAccount -Identity tom.reed
Get-ADUser tom.reed -Properties LockedOut, BadLogonCount | Format-List Name, LockedOut, BadLogonCount`, nix: R`On Tom's phone (wording varies by make):
  Settings › Wi-Fi › CORP-STAFF › Forget this network
  › join CORP-STAFF again › sign in with the NEW password

Then in Active Directory Users and Computers:
  tom.reed › Properties › Account › tick "Unlock account"`},
     evidence: [{t: "09:14:20", src: "NPS01 · Security log", title: "Event 6272: Wi-Fi access granted to tom.reed from his phone", sev: "ok", kind: "log",
       fields: [["Event", "6272", "Access granted"], ["Calling Station Identifier", "00-00-5E-00-53-2A", "The same phone, now with the right password"]],
       raw: R`26/11/2026 09:14:19  Event 6272
Network Policy Server granted access to a user.
	Account Name:			tom.reed
	Calling Station Identifier:	00-00-5E-00-53-2A
	Network Policy Name:		CORP-STAFF Wi-Fi
	Authentication Type:		PEAP`}]},
    {title: "Still fine an hour later", sub: "Confirm with Tom, then close", ph: 7,
     what: "An hour later the account is still unlocked and the bad password count is still zero. You check with Tom, who's been working all morning, and close the ticket with a note explaining what was really going on.",
     check: "Look again after the time the lockouts used to happen. If the count stays at zero, the cause has gone.",
     tech: "Get-ADUser at 10:20: LockedOut False, BadLogonCount 0. No 4740 or 6273 events for tom.reed since 09:14.",
     msgs: [{from: "desk", to: "dc", label: "Still OK?", kind: "normal"}, {from: "dc", to: "desk", label: "Unlocked · 0 bad passwords", kind: "fix"}, {from: "tom", to: "desk", label: "All good, thanks", kind: "data"}],
     evidence: [{t: "10:20:00", src: "DC01 · PowerShell", title: "LockedOut False, BadLogonCount 0; ticket resolved", sev: "ok", kind: "cmd",
       fields: [["LockedOut", "False", ""], ["BadLogonCount", "0", "Nothing's sending the old password any more"]],
       raw: R`PS C:\> Get-ADUser tom.reed -Properties LockedOut,BadLogonCount | fl Name,LockedOut,BadLogonCount

Name          : Tom Reed
LockedOut     : False
BadLogonCount : 0

INC-31872  Resolved 10:22  (Tom confirmed by phone)`}]}
  ],
  fixes: [
    {id: "unlock", kind: "herring", name: "Unlock the account", short: "Unlock", at: 5,
     desc: "Tick 'Unlock account' and tell Tom he's good to go.",
     result: "Tom's back in for a few minutes, then his phone reconnects to the Wi-Fi, sends the old password again and the count starts climbing. Unlocking treats the symptom; the phone is still doing it.",
     ev: {t: "09:12:30", src: "DC01 · PowerShell", title: "Unlocked, but the bad password count is already climbing", sev: "warn", kind: "cmd", fields: [["BadLogonCount", "2", "Two minutes after the unlock"]], raw: R`PS C:\> Unlock-ADAccount tom.reed
PS C:\> Get-ADUser tom.reed -Properties LockedOut,BadLogonCount | fl Name,LockedOut,BadLogonCount

Name          : Tom Reed
LockedOut     : False
BadLogonCount : 2`}},
    {id: "reset", kind: "herring", name: "Reset his password again", short: "Reset again", at: 5,
     desc: "Set a brand new password and read it out to Tom.",
     result: "Now there are two passwords the phone doesn't know. It keeps sending the old one, the lockouts carry on, and Tom has yet another password to remember.",
     ev: {t: "09:13:40", src: "NPS01 · Security log", title: "After the reset: the phone is still failing (6273, reason 16)", sev: "warn", kind: "log", fields: [["Calling Station Identifier", "00-00-5E-00-53-2A", "Still the phone, still the old password"]], raw: R`26/11/2026 09:13:38  Event 6273  Network Policy Server denied access to a user.
	Account Name:			tom.reed
	Calling Station Identifier:	00-00-5E-00-53-2A
	Reason Code:			16`}},
    {id: "phonewifi", kind: "fix", name: "Forget the staff Wi-Fi on Tom's phone, rejoin, then unlock", short: "Fix the phone's Wi-Fi", at: 6,
     desc: "Remove the saved CORP-STAFF network from his phone, join again with the new password, then unlock his account.",
     result: "With the old password gone from the phone, nothing is sending bad passwords any more. The account is unlocked and stays unlocked.",
     ev: {t: "09:12:30", src: "Service desk · ticket note", title: "Talked Tom through forgetting CORP-STAFF on his phone", sev: "info", kind: "ticket", fields: [["Action", "Forget network, rejoin with new password", "Then unlock"]], raw: R`26/11/2026 09:12  Service Desk
Cause: phone (MAC 00-00-5E-00-53-2A) saving the old password for CORP-STAFF.
Talked Tom through Forget network + rejoin. Unlocking once the phone is on.`}}
  ],
  verify: [
    {t: "Ring him back on the mobile number in the staff directory, not the number he's calling from", ok: true, why: "A callback to a number you already hold shows the person on the line really has Tom's phone. Unlocking is lower risk than a reset, but it still hands an account to whoever's on the call, so it's worth thirty seconds."},
    {t: "Ask for his employee ID and date of birth", why: "Both are easy to find out: they're on payslips and badges, colleagues know them, and they turn up in data breaches. Questions like these feel like a check but prove very little."},
    {t: "No check needed: an unlock doesn't change the password", why: "An unlock hands the account straight back to whoever is on the phone. If someone had been guessing Tom's password, you'd have just helped them."}
  ],
  triage: [
    {t: "P3 · one person can't work. Keep it at the service desk, link the earlier lockout tickets and find the cause", ok: true, why: "Impact is one user and urgency is high (he can't sign in), which is a P3 on most matrices. Linking the earlier tickets turns 'another lockout' into a pattern worth investigating."},
    {t: "P4 · it's just an unlock, sort it in two minutes and close", why: "That's how it got to lockout number three. The same ticket coming back again and again means there's a cause nobody's found."},
    {t: "P1 · possible password-guessing attack, escalate to security now", why: "Worth a quick look at where the bad passwords come from, but one user locking at the same time every morning from your own Wi-Fi server is a stale password, not an attack. P1 is for outages hitting lots of people."}
  ],
  notes: [
    {t: "Repeat lockout (3rd: INC-31744, INC-31790). Event 4740 on DC01 named NPS01; NPS showed failed Wi-Fi sign-ins (6273, reason 16) from Tom's phone (00-00-5E-00-53-2A) using his old password after Monday's change. Phone: forgot CORP-STAFF, rejoined with new password. Account unlocked 09:14. BadLogonCount 0 at 10:20, Tom confirmed. KB suggestion: 'After changing your password, update your phone's Wi-Fi and email'.", ok: true, why: "It says what happened, how you proved it, what you changed and how you know it's fixed, and it links the earlier tickets. Whoever gets the next lockout ticket can fix it in five minutes."},
    {t: "Account unlocked. User advised to take more care typing his password.", why: "It blames Tom for something he didn't do and records nothing about the real cause. The next person will just unlock it again."},
    {t: "Fixed.", why: "Fixed how? If it comes back, nobody can tell what was done or what to try next."}
  ],
  debrief: {
    check: ["Get-ADUser: LockedOut, BadLogonCount, LastBadPasswordAttempt and PasswordLastSet", "Event 4740 on the PDC emulator: 'Caller Computer Name' says where the bad passwords came from", "If the caller is a server (NPS, VPN, mail), check that server's logs to find the device"],
    fix: ["Find the device still using the old password and update or remove it", "Then unlock the account and check the bad password count stays at zero"],
    prevent: ["Add 'update your phone's Wi-Fi and email' to the password change reminder and the KB", "Certificate-based Wi-Fi (EAP-TLS) means phones never store a password at all", "Rule of thumb: the second lockout in a week gets investigated, not just unlocked"]
  },
  tell: "The lockout happens at the same time every day, event 4740 names the Wi-Fi server NPS01 as the caller, and NPS shows failed sign-ins (reason 16) from a phone's MAC address."
},

/* ============ 2. NEW PHONE, NO MFA ============ */
{
  id: "mfa-newphone", cat: "accounts", name: "New phone, no MFA", sub: "Authenticator was on the old one",
  impact: "One user · Marketing", systems: ["Entra ID", "Microsoft Authenticator", "Conditional Access"],
  cause: "Her only MFA method is the Authenticator app on a phone she's traded in",
  fail: "Still stuck at the MFA prompt",
  ticket: {ref: "INC-31880", from: "Grace Lin · Marketing", via: "Walk-up to the IT desk", text: "Got a new phone at the weekend and traded the old one in. Now Outlook and Teams want me to approve a sign-in on the old phone, which I haven't got any more. Can you just turn MFA off for me for today?"},
  intro: "Grace's account is fine and her password is right. The problem is the second step: Microsoft 365 keeps sending approval requests to the Authenticator app on her old phone, which she traded in at the weekend. She has no other way of proving it's her registered, and she can't set up the new phone without signing in first.",
  summary: "Entra ID shows a single registered method: Microsoft Authenticator (push) on 'iPhone 13'. Sign-ins hit the Conditional Access policy 'Require MFA for all users', get interrupted with 50074 (Strong Authentication is required), then fail with 500121 (Authentication failed during strong authentication request) when nobody answers the push. Registering a new device needs a session that has already done MFA. The supported way out is to verify her identity properly, remove the stale method and issue a Temporary Access Pass, which counts as strong authentication so she can register Authenticator on the new phone.",
  facts: [["Symptom", "Approval requests go to a phone she no longer has"], ["Root cause", "Only MFA method is on the traded-in phone"], ["Who's affected", "One user"], ["Key evidence", "Sign-in log 500121; one Authenticator method, on 'iPhone 13'"]],
  nodes: [
    {id: "desk", kind: "agent", label: "Service desk", sub: "You · IT desk", x: 120, y: 170},
    {id: "grace", kind: "user", label: "Grace Lin", sub: "Marketing", x: 120, y: 450},
    {id: "lap", kind: "laptop", label: "Grace's laptop", sub: "Outlook · Teams", x: 370, y: 450},
    {id: "newph", kind: "phone", label: "New phone", sub: "No Authenticator yet", x: 520, y: 640},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "Sign-in + MFA", x: 650, y: 330},
    {id: "oldph", kind: "phone", label: "Old phone", sub: "Traded in at the weekend", x: 900, y: 170, ghost: true},
    {id: "m365", kind: "cloud", label: "Microsoft 365", sub: "Outlook · Teams", x: 920, y: 500}
  ],
  links: [["desk", "grace"], ["grace", "lap"], ["grace", "newph"], ["lap", "entra"], ["entra", "oldph"], ["entra", "newph"], ["entra", "m365"], ["desk", "entra"]],
  lanes: ["desk", "grace", "lap", "newph", "entra", "oldph", "m365"],
  stage: 5,
  steps: [
    {title: "Grace walks up to the desk", sub: "\"Can you turn MFA off?\"", ph: 1,
     what: "Grace comes to the IT desk with her laptop and her shiny new phone. Every sign-in asks her to approve it on her old phone, which has gone back to the shop. She'd like MFA switched off, just for today.",
     check: "Note exactly what she's asking for and what she's seeing. 'Turn MFA off' is a request you'll politely decline, but it tells you the real problem: she can't complete the second step.",
     tech: "Request logged as Accounts › MFA. The 'disable MFA' request is declined under policy: Conditional Access exclusions are a common way accounts end up protected by a password alone.",
     msgs: [{from: "grace", to: "desk", label: "Can you turn MFA off?", kind: "normal"}],
     evidence: [{t: "09:20:05", src: "Service desk · ticket", title: "INC-31880 logged: MFA prompts going to a traded-in phone", sev: "info", kind: "ticket",
       fields: [["Caller", "Grace Lin, Marketing", "Walk-up to the IT desk"], ["Category", "Accounts › MFA", ""], ["Request", "Disable MFA for today", "Declined: against policy"]],
       raw: R`INC-31880   Logged 27/11/2026 09:20   IT Desk
Caller:    Grace Lin (Marketing)   walk-up
Category:  Accounts › MFA
Summary:   New phone, old phone traded in. MFA prompts go to the old one.
Asked for MFA to be turned off for the day: declined (policy), will
re-register her on the new phone instead.`}]},
    {title: "Is it really Grace?", sub: "MFA resets get the strongest check", ph: 2,
     what: "Resetting someone's MFA is exactly what an attacker would want, so it needs a stronger check than an unlock. Grace is here in person, so you compare her photo ID with her directory photo, and ring her manager, Ben, on his number from the directory to confirm.",
     check: "Two independent checks: something about the person (photo ID, in person) and someone who knows them (their manager, reached on a number you already hold).",
     tech: "Policy: authentication method resets need two verification factors that don't depend on the account itself. Photo ID matched the HR photo; manager Ben Ortiz confirmed by callback on ext 4310.",
     msgs: [{from: "desk", to: "grace", label: "Photo ID vs directory photo", kind: "normal"}, {from: "grace", to: "desk", label: "Shows her badge", kind: "data"}],
     evidence: [{t: "09:22:40", src: "Service desk · ticket note", title: "Verified: photo ID in person + manager callback", sev: "ok", kind: "ticket",
       fields: [["Check 1", "Photo ID matches directory photo", "In person"], ["Check 2", "Manager Ben Ortiz confirmed", "Callback on ext 4310 from the directory"]],
       raw: R`27/11/2026 09:22  IT Desk
Identity: photo ID checked against directory photo (in person).
Manager Ben Ortiz confirmed by callback, ext 4310 (directory).
Two-factor verification complete for MFA method reset.`}]},
    {title: "Triage", sub: "One person, can't work", ph: 3,
     what: "One person can't get into email or Teams. That's a P3, and it stays with the service desk: re-registering MFA is a standard job once you know how.",
     check: "Ask whether anyone else is affected. If lots of people suddenly couldn't do MFA, that would be an outage and a much higher priority.",
     tech: "Impact low (1 user), urgency high → P3. No service-wide MFA issue on the Microsoft 365 service health page.",
     msgs: [], focus: ["desk"], callout: "P3 · service desk owns it",
     evidence: [{t: "09:23:30", src: "Service desk · ticket", title: "Priority P3; no wider MFA problem", sev: "info", kind: "ticket",
       fields: [["Priority", "P3", "One user, can't work"], ["Service health", "No MFA incidents", "It's just Grace"]],
       raw: R`27/11/2026 09:23  IT Desk
Priority: P3. Service health: no Entra ID / MFA incidents. Single user.`}]},
    {title: "Watch her sign in", sub: "Password fine, MFA goes nowhere", ph: 4,
     what: "Grace signs in on her laptop. The password step works. Then Entra ID sends an approval request to the Authenticator app on her old phone. Nobody answers, because the phone's in a recycling depot, and the sign-in fails.",
     check: "In the sign-in logs, a password that succeeds followed by an MFA failure points away from the password and towards the second step.",
     tech: "Sign-in log: first-factor authentication succeeded; interrupted with 50074 'Strong Authentication is required' (Conditional Access 'Require MFA for all users'), then failure 500121 'Authentication failed during strong authentication request': push notification sent to Microsoft Authenticator, no response.",
     msgs: [{from: "lap", to: "entra", label: "Sign in: password ✓", kind: "normal"}, {from: "entra", to: "oldph", label: "Approve sign-in?", kind: "normal", lost: "No reply"}, {from: "entra", to: "lap", label: "MFA failed (500121)", kind: "bad"}],
     fault: ["oldph"],
     cmds: {win: R`Connect-MgGraph -Scopes "AuditLog.Read.All"
Get-MgAuditLogSignIn -Filter "userPrincipalName eq 'grace.lin@contoso.com'" -Top 5 |
  Select-Object CreatedDateTime, AppDisplayName,
    @{n='Error';e={$_.Status.ErrorCode}}, @{n='Reason';e={$_.Status.FailureReason}}`, nix: R`Entra admin centre
  › Users › Grace Lin › Sign-in logs
  › pick the failed sign-in
  › Basic info: failure reason
  › Authentication Details: which step failed, and which method`},
     evidence: [{t: "09:25:10", src: "Entra ID · sign-in log", title: "Password succeeded, MFA failed: 500121, no answer from Authenticator", sev: "err", kind: "log",
       fields: [["First factor", "Password: succeeded", "Her password is fine"], ["Error", "500121", "Authentication failed during strong authentication request"], ["Method", "Microsoft Authenticator notification", "Sent to the old phone; nobody answered"]],
       raw: R`Date:            27/11/2026 09:24:51
User:            grace.lin@contoso.com
Application:     Microsoft Teams
Status:          Failure
Sign-in error:   500121
Failure reason:  Authentication failed during strong authentication request.
Conditional Access: Require MFA for all users (Success: MFA required)

Authentication details
  Password                         Succeeded   First factor
  Mobile app notification          Failed      No response from user`}]},
    {title: "Find the cause", sub: "One method, on one phone that's gone", ph: 5,
     what: "You look at Grace's registered sign-in methods. There's exactly one: Authenticator, on a phone called 'iPhone 13'. That's the old phone. There's no backup method at all, so there's nowhere else for the approval to go.",
     check: "Look at the user's authentication methods. If the only method is on a device they no longer have, they're locked out of MFA until an admin helps them re-register.",
     tech: "Get-MgUserAuthenticationMethod returns the password method and one microsoftAuthenticatorAuthenticationMethod (displayName 'iPhone 13'). No phone number, FIDO2 key or second Authenticator registration.",
     msgs: [{from: "desk", to: "entra", label: "List Grace's MFA methods", kind: "normal"}, {from: "entra", to: "desk", label: "1 method: Authenticator on 'iPhone 13'", kind: "data"}],
     callout: "Only method: the old phone",
     cmds: {win: R`Connect-MgGraph -Scopes "UserAuthenticationMethod.Read.All"
Get-MgUserAuthenticationMethod -UserId grace.lin@contoso.com |
  Select-Object Id, @{n='Type';e={$_.AdditionalProperties['@odata.type']}},
    @{n='Device';e={$_.AdditionalProperties['displayName']}}`, nix: R`Entra admin centre
  › Users › Grace Lin › Authentication methods
  › see every registered method and the device it's on`},
     evidence: [{t: "09:27:30", src: "Entra ID · PowerShell", title: "One MFA method registered: Authenticator on 'iPhone 13' (the old phone)", sev: "clue", kind: "cmd",
       fields: [["Methods", "Password + Microsoft Authenticator", "Nothing else to fall back on"], ["Device", "iPhone 13", "The phone she traded in"]],
       raw: R`PS> Get-MgUserAuthenticationMethod -UserId grace.lin@contoso.com | Select Id,Type,Device

Id                                   Type                                              Device
--                                   ----                                              ------
28c10230-6103-485e-b985-444c60001490 #microsoft.graph.passwordAuthenticationMethod
3e7a8c11-52d0-4b6f-9a7e-0c1f5d2e8b44 #microsoft.graph.microsoftAuthenticatorAuthenticationMethod iPhone 13`}]},
    {title: "Still stuck", sub: "The approval goes to the recycling depot", ph: 7,
     what: "Grace tries again from Outlook. Same result: the approval request goes to the old phone, nobody answers, and she can't get in. Until a new method is registered, nothing at her end will change.",
     check: "If the sign-in log still shows the same 500121 against the same device, the fix hasn't touched the real problem.",
     tech: "Repeat 500121 at 09:41, method Microsoft Authenticator notification, device 'iPhone 13'.",
     msgs: [{from: "lap", to: "entra", label: "Sign in again", kind: "normal"}, {from: "entra", to: "oldph", label: "Approve sign-in?", kind: "normal", lost: "No reply"}],
     callout: "Still can't sign in", fault: ["oldph"],
     evidence: [{t: "09:41:00", src: "Entra ID · sign-in log", title: "500121 again: approval sent to the old phone", sev: "err", kind: "log",
       fields: [["Error", "500121", "Same as before"], ["Application", "Outlook", ""]],
       raw: R`Date:           27/11/2026 09:40:47
User:           grace.lin@contoso.com
Application:    Microsoft Outlook
Sign-in error:  500121  Authentication failed during strong authentication request.
  Mobile app notification   Failed   No response from user`}]}
  ],
  fixed: [0, 1, 2, 3, 4,
    {title: "A Temporary Access Pass", sub: "Remove the old phone, register the new one", ph: 6,
     what: "You delete the Authenticator registration for the old phone and create a Temporary Access Pass for Grace: a one-time code that works for an hour. She signs in on her new phone with it, sets up Authenticator, and the new phone is now her MFA method.",
     check: "The audit log should show the old method deleted by an admin, a Temporary Access Pass created, and 'User registered security info' from Grace a few minutes later.",
     tech: "Remove-MgUserAuthenticationMicrosoftAuthenticatorMethod for the 'iPhone 13' registration; New-MgUserAuthenticationTemporaryAccessPassMethod with lifetimeInMinutes 60, isUsableOnce $true. The TAP satisfies MFA for the registration session; Authenticator is registered on the new device.",
     msgs: [{from: "desk", to: "entra", label: "Remove old phone · issue TAP", kind: "fix"}, {from: "desk", to: "grace", label: "One-time pass, valid 1 hour", kind: "fix"}, {from: "newph", to: "entra", label: "Sign in with TAP · add Authenticator", kind: "fix"}, {from: "entra", to: "newph", label: "Registered ✓", kind: "data"}],
     callout: "New phone registered",
     cmds: {win: R`Connect-MgGraph -Scopes "UserAuthenticationMethod.ReadWrite.All"
# 1. Remove the Authenticator registration on the old phone (Id from Get-MgUserAuthenticationMethod)
Remove-MgUserAuthenticationMicrosoftAuthenticatorMethod -UserId grace.lin@contoso.com -MicrosoftAuthenticatorAuthenticationMethodId 3e7a8c11-52d0-4b6f-9a7e-0c1f5d2e8b44
# 2. One-time Temporary Access Pass, valid for an hour
New-MgUserAuthenticationTemporaryAccessPassMethod -UserId grace.lin@contoso.com -BodyParameter @{ lifetimeInMinutes = 60; isUsableOnce = $true }`, nix: R`Entra admin centre › Users › Grace Lin › Authentication methods
  › old Authenticator entry › Delete
  › + Add authentication method › Temporary Access Pass
  › set it to one-time use, 60 minutes › give her the code in person

Grace, on her new phone: sign in with the pass, then add
Microsoft Authenticator when asked (or at My Sign-ins › Security info)`},
     evidence: [{t: "09:36:40", src: "Entra ID · audit log", title: "User registered security info: Authenticator on the new phone", sev: "ok", kind: "log",
       fields: [["Activity", "User registered security info", "Done by Grace herself, using the pass"], ["Device", "iPhone 16", "The new phone"]],
       raw: R`27/11/2026 09:31:02  Admin deleted security info     (by: servicedesk.admin)  Target: grace.lin
27/11/2026 09:31:40  Admin registered security info   (by: servicedesk.admin)  Target: grace.lin   Method: Temporary Access Pass
27/11/2026 09:36:31  User registered security info    (by: grace.lin)          Method: Microsoft Authenticator · iPhone 16`}]},
    {title: "Sign in and confirm", sub: "Approve it on the phone in her hand", ph: 7,
     what: "Grace signs in to Teams. This time the approval pops up on her new phone, she types the number shown on her laptop, and she's in. You check the sign-in log, Grace confirms everything works, and you close the ticket.",
     check: "A successful sign-in with 'Mobile app notification: Succeeded' against the new device is your proof.",
     tech: "Sign-in success at 09:38:02, MFA satisfied by Microsoft Authenticator (number matching) on 'iPhone 16'. The TAP has been used and is no longer usable.",
     msgs: [{from: "lap", to: "entra", label: "Sign in: password ✓", kind: "normal"}, {from: "entra", to: "newph", label: "Approve sign-in? (number 47)", kind: "normal"}, {from: "newph", to: "entra", label: "Approved: 47", kind: "data"}, {from: "entra", to: "m365", label: "Signed in", kind: "fix"}],
     evidence: [{t: "09:38:10", src: "Entra ID · sign-in log", title: "Sign-in succeeded with Authenticator on the new phone", sev: "ok", kind: "log",
       fields: [["Status", "Success", ""], ["MFA", "Mobile app notification: Succeeded", "On the new phone, with number matching"]],
       raw: R`Date:          27/11/2026 09:38:02
User:          grace.lin@contoso.com
Application:   Microsoft Teams
Status:        Success
  Password                      Succeeded
  Mobile app notification       Succeeded   (iPhone 16)

INC-31880  Resolved 09:40  (Grace confirmed in person)`}]}
  ],
  fixes: [
    {id: "reset", kind: "herring", name: "Reset her password", short: "Reset password", at: 5,
     desc: "Give her a new password in case the old one's the problem.",
     result: "Her password was never the problem: the sign-in log shows the password step succeeding. After the reset she types the new password and gets the same approval request sent to the old phone.",
     ev: {t: "09:31:00", src: "Entra ID · sign-in log", title: "New password accepted, MFA still fails (500121)", sev: "warn", kind: "log", fields: [["Password", "Succeeded", "As it did before"], ["MFA", "Failed: no response", "Still the old phone"]], raw: R`27/11/2026 09:30:44  grace.lin  Outlook  Failure 500121
  Password                   Succeeded
  Mobile app notification    Failed   No response from user`}},
    {id: "app", kind: "herring", name: "Get her to install Authenticator on the new phone and add her account", short: "Install the app", at: 5,
     desc: "Install the app and add her work account on the new phone.",
     result: "Adding a work account means signing in, and that sign-in needs MFA... on the old phone. You need MFA to set up MFA. Without an admin step, she's going round in circles.",
     ev: {t: "09:34:20", src: "Grace's new phone · Authenticator", title: "Adding the account asks for approval on the other device", sev: "warn", kind: "screen", fields: [["Screen", "Approve sign-in request", "Sent to the old phone again"]], raw: R`Microsoft Authenticator › Add work or school account
  grace.lin@contoso.com  ·  password ✓
  "Approve sign-in request"
  "Open your Authenticator app, and enter the number shown to sign in."
  (request delivered to: iPhone 13)`}},
    {id: "tap", kind: "fix", name: "Remove the old phone and issue a Temporary Access Pass", short: "Temporary Access Pass", at: 6,
     desc: "Delete the old Authenticator registration, give her a one-time pass for an hour, and let her set up the app on her new phone.",
     result: "The pass counts as strong authentication once. Grace signs in with it, registers Authenticator on her new phone, and from then on approvals go to the phone in her hand.",
     ev: {t: "09:31:45", src: "Entra ID · PowerShell", title: "Old method removed; one-time Temporary Access Pass created (60 min)", sev: "info", kind: "cmd", fields: [["Lifetime", "60 minutes", ""], ["Usable once", "True", "Can't be reused if it leaks"]], raw: R`PS> Remove-MgUserAuthenticationMicrosoftAuthenticatorMethod -UserId grace.lin@contoso.com -MicrosoftAuthenticatorAuthenticationMethodId 3e7a8c11-52d0-4b6f-9a7e-0c1f5d2e8b44
PS> New-MgUserAuthenticationTemporaryAccessPassMethod -UserId grace.lin@contoso.com -BodyParameter @{ lifetimeInMinutes = 60; isUsableOnce = $true }

IsUsable IsUsableOnce LifetimeInMinutes MethodUsabilityReason TemporaryAccessPass
-------- ------------ ----------------- --------------------- -------------------
True     True         60                EnabledByPolicy       (shown once, given to Grace in person)`}}
  ],
  verify: [
    {t: "She's here in person: check photo ID against her directory photo, and confirm with her manager on a number from the directory", ok: true, why: "Resetting MFA is exactly what an attacker wants, so it gets two checks that don't rely on her account: who she is (photo ID, in person) and someone who knows her (her manager, called on a number you already hold)."},
    {t: "Ask her to approve a test MFA prompt", why: "That's the one thing she can't do: the prompts go to the phone she no longer has."},
    {t: "She knows her password, so she's verified", why: "A password is the very thing that gets phished. If knowing it were enough, nobody would need MFA."}
  ],
  triage: [
    {t: "P3 · one person can't work. Service desk owns it, and politely says no to 'turn MFA off'", ok: true, why: "One user, high urgency: P3. Re-registering MFA is a standard service desk job. Switching MFA off would leave her account protected by a password alone, which is how accounts get taken over."},
    {t: "P2 · there's a campaign launch in Marketing today", why: "Business pressure is worth noting and can move it up your queue, but impact is still one user. If everyone with a deadline gets a P2, P2 stops meaning anything."},
    {t: "Not a fault · she needs to get her old phone back", why: "It's been traded in and wiped. Leaving someone unable to work for days isn't a resolution."}
  ],
  notes: [
    {t: "Grace traded in her old phone, which held her only MFA method (Authenticator on 'iPhone 13'). Verified: photo ID in person + manager Ben Ortiz by callback (ext 4310). Removed old Authenticator method, issued one-time Temporary Access Pass (60 min). Grace registered Authenticator on her new phone; test sign-in approved 09:38. Advised: add a second method, and move Authenticator before changing phones. Request to disable MFA declined, as per policy.", ok: true, why: "Records how you verified her (the first thing a security review will ask), what you removed and added, the proof it works, and the advice that stops it happening again."},
    {t: "Turned off MFA for Grace so she can work. Will turn it back on next week.", why: "Leaves her account protected by a password alone, and 'next week' is how temporary exclusions become permanent."},
    {t: "Reset MFA.", why: "Doesn't say how you checked it was her, which is the part that matters most for an MFA reset, or what she's using now."}
  ],
  debrief: {
    check: ["Sign-in logs: does the password step succeed while MFA fails (50074, 500121)?", "Entra ID › Users › Authentication methods: what's registered, and on which device?", "Ask what changed: new phone, reinstalled app, travelling?"],
    fix: ["Verify identity strongly (two independent checks), then remove the stale method", "Issue a one-time Temporary Access Pass and have the user register the new phone"],
    prevent: ["Encourage two methods (Authenticator plus a security key or a second device)", "KB: 'Getting a new phone? Move Authenticator first'", "Never exclude people from MFA policies as a quick fix"]
  },
  tell: "The password step succeeds, MFA fails with 500121 because nobody answers the prompt, and the only registered method is Authenticator on a phone the user no longer has."
},

/* ============ 3. VISHING: "IT'S THE CEO" ============ */
{
  id: "vishing-ceo", cat: "security", name: "\"It's the CEO\"", sub: "An urgent call for a password and MFA reset",
  impact: "The CEO's account · the whole company at risk", systems: ["Phone system", "Entra ID", "Exchange Online"],
  cause: "The caller isn't the CEO: it's an attacker using public details to talk the desk into a reset",
  fail: "Account taken over",
  ticket: {ref: "INC-31901", from: "Caller says: Helen Marsh · CEO", via: "Phone call · number not on file", text: "It's Helen Marsh. I'm at the airport, my phone's died and I've borrowed this one. I'm about to board and I need to approve a payment before we take off. Reset my password and the authenticator thing NOW please, I really don't have time for this."},
  intro: "Someone rings the desk claiming to be Helen Marsh, the CEO. She's in a rush, she's stressed, she's on a borrowed phone and she wants her password and MFA reset right now. It isn't Helen. It's an attacker who found her name, role and staff details online, and is betting the desk will be too worried about upsetting the boss to check properly.",
  summary: "Classic help-desk social engineering, the technique behind several big breaches in recent years: urgency, authority and a reason why the usual checks 'can't work' ('my phone died'). The caller knows Helen's employee ID and start date from an old org chart and a breached HR export. If the desk resets the password and MFA, the attacker registers their own Authenticator, signs in from 203.0.113.58, creates an inbox rule to hide replies and emails Finance about an urgent payment. The control that breaks the chain is a callback to the number already on file, which reaches the real Helen.",
  facts: [["Symptom", "Urgent reset request from an unknown number"], ["Root cause", "Impersonation (vishing)"], ["Who's affected", "The CEO's account, and Finance"], ["Key evidence", "Number not on file; real Helen, called back, hasn't called"]],
  nodes: [
    {id: "caller", kind: "caller", label: "Caller: \"Helen\"", sub: "Borrowed phone · unknown number", x: 110, y: 430},
    {id: "desk", kind: "agent", label: "Service desk", sub: "You · 1st line", x: 370, y: 290},
    {id: "helen", kind: "user", label: "Helen Marsh (real)", sub: "CEO · in a board meeting", x: 370, y: 610},
    {id: "sec", kind: "agent", label: "Security team", sub: "SOC on call", x: 630, y: 610},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "Helen's account", x: 650, y: 290},
    {id: "mail", kind: "mail", label: "Exchange Online", sub: "Helen's mailbox", x: 900, y: 290},
    {id: "fin", kind: "user", label: "Finance team", sub: "Accounts payable", x: 900, y: 580}
  ],
  links: [["caller", "desk"], ["desk", "helen"], ["desk", "entra"], ["desk", "sec"], ["sec", "entra"], ["caller", "entra"], ["entra", "mail"], ["mail", "fin"]],
  lanes: ["caller", "desk", "helen", "sec", "entra", "mail", "fin"],
  stage: 2,
  steps: [
    {title: "An urgent call", sub: "\"It's Helen. Reset me NOW.\"", ph: 1,
     what: "A call comes in from a mobile number that isn't in the directory. The caller says she's Helen Marsh, the CEO, at the airport with a dead phone. She needs her password and her MFA reset before she boards, and she's not happy about being kept waiting.",
     check: "Notice the pattern before you notice the person: unknown number, urgency, authority, and a reason why your normal checks won't work. Those four together are the shape of a social engineering call.",
     tech: "Inbound call 13:42 from +44 7700 900731, not associated with any staff record. Requested: password reset and MFA method reset for the CEO's account, the highest-value target in the company.",
     msgs: [{from: "caller", to: "desk", label: "It's Helen. Reset me NOW.", kind: "bad"}],
     evidence: [{t: "13:42:20", src: "Phone system · call log", title: "Inbound call from 07700 900731: not on file for any member of staff", sev: "clue", kind: "log",
       fields: [["From", "+44 7700 900731", "Not Helen's number, not anyone's in the directory"], ["Asked for", "Password + MFA reset", "Everything needed to take over the account"]],
       raw: R`27/11/2026 13:42:07  Inbound  +44 7700 900731  →  Service Desk queue
  Directory match: none

INC-31901   Logged 13:42   Caller states: Helen Marsh (CEO)
Request:    Reset password AND authenticator. "Boarding in 10 minutes."`}]},
    {title: "The checks she passes", sub: "Knowledge questions, answered perfectly", ph: 2,
     what: "You ask the usual questions. The caller rattles off Helen's employee ID and start date without a pause, and sounds increasingly annoyed. It feels like she's passed. But both answers are things an attacker can find: on an old org chart, a leaked HR file or LinkedIn.",
     check: "Ask yourself: could someone who isn't Helen know this? If the answer is yes, it isn't verification. A callback to the number already on file is.",
     tech: "Employee ID E10442 and start date both appear in a breached HR export circulating since 2025. The caller refused a callback ('my phone's dead, that's the whole point').",
     msgs: [{from: "desk", to: "caller", label: "Employee ID? Start date?", kind: "normal"}, {from: "caller", to: "desk", label: "E10442 · March 2019 · hurry!", kind: "bad"}],
     callout: "Knowledge questions passed",
     evidence: [{t: "13:44:10", src: "Service desk · ticket note", title: "Verified by knowledge questions only; caller refused a callback", sev: "warn", kind: "ticket",
       fields: [["Employee ID", "Correct", "Findable"], ["Start date", "Correct", "Findable"], ["Callback", "Refused", "'My phone's dead'"]],
       raw: R`27/11/2026 13:44  Service Desk
Caller gave employee ID and start date correctly.
Offered callback, caller refused (says own phone is dead).`}]},
    {title: "Triage under pressure", sub: "VIP, angry, in a hurry", ph: 3,
     what: "It's the CEO, she's cross, and she's about to board a plane. The ticket gets marked P1 VIP and the pressure is all about speed. Nobody stops to ask whether this is a security incident instead.",
     check: "When the pressure goes up, the checks should get stronger, not weaker. That's exactly the lever this kind of caller pulls.",
     tech: "Ticket priority set to P1 (VIP). No security escalation. The decision being made is 'how fast', not 'should we'.",
     msgs: [], focus: ["desk"], callout: "P1 VIP · just do it",
     evidence: [{t: "13:45:30", src: "Service desk · ticket", title: "Priority P1 (VIP); no security escalation", sev: "warn", kind: "ticket",
       fields: [["Priority", "P1 · VIP", "Set by urgency, not risk"], ["Security", "Not informed", ""]],
       raw: R`27/11/2026 13:45  Service Desk
Priority: P1 (VIP). Proceeding with reset.`}]},
    {title: "The reset", sub: "Password and MFA, handed over", ph: 6,
     what: "You reset Helen's password, remove her Authenticator registration so she can 'set up the borrowed phone', and read the new password to the caller. Everything an attacker needs to own the CEO's account has just been handed over the phone.",
     check: "The audit log will show exactly who did this and when. That's the line a breach review starts from.",
     tech: "Entra audit: 'Reset user password' and 'Admin deleted security info' on helen.marsh by servicedesk.admin. The account now has no MFA method, so the next sign-in will be prompted to register one, on whatever phone is to hand.",
     msgs: [{from: "desk", to: "entra", label: "Reset password + MFA", kind: "bad"}, {from: "desk", to: "caller", label: "Here's the new password", kind: "bad"}],
     evidence: [{t: "13:46:30", src: "Entra ID · audit log", title: "Password reset and MFA method deleted for helen.marsh", sev: "warn", kind: "log",
       fields: [["Activity", "Reset user password", "By the service desk"], ["Activity", "Admin deleted security info", "Her real Authenticator is gone"]],
       raw: R`27/11/2026 13:46:02  Reset user password            by: servicedesk.admin   Target: helen.marsh@contoso.com
27/11/2026 13:46:21  Admin deleted security info     by: servicedesk.admin   Target: helen.marsh@contoso.com`}]},
    {title: "Ticket closed, attacker in", sub: "New Authenticator, new inbox rule", ph: 7,
     what: "The ticket is closed as resolved. Five minutes later the 'CEO' signs in from an unfamiliar internet address, registers their own Authenticator, and creates an inbox rule that quietly moves any reply mentioning 'payment' or 'invoice' out of sight.",
     check: "A sign-in straight after a reset, from somewhere new, followed by a new inbox rule, is a textbook account takeover.",
     tech: "Sign-in success from 203.0.113.58 (unfamiliar country, new device), 'User registered security info' with a new Authenticator, then New-InboxRule 'Archive' moving messages containing 'payment' or 'invoice' to RSS Feeds and marking them read.",
     msgs: [{from: "caller", to: "entra", label: "Sign in · register own Authenticator", kind: "bad"}, {from: "entra", to: "mail", label: "Access to Helen's mailbox", kind: "bad"}],
     fault: ["entra", "mail"],
     evidence: [
       {t: "13:47:10", src: "Service desk · ticket", title: "INC-31901 resolved: 'password and MFA reset for CEO'", sev: "info", kind: "ticket", fields: [["Status", "Resolved", ""]], raw: R`27/11/2026 13:47  INC-31901 Resolved: password and MFA reset for CEO (urgent).`},
       {t: "13:51:05", src: "Entra ID · sign-in log", title: "Sign-in as helen.marsh from 203.0.113.58, new device, new country", sev: "err", kind: "log",
        fields: [["IP address", "203.0.113.58", "Never seen for Helen before"], ["Device", "Unregistered · Windows", "Not a Contoso laptop"], ["Then", "User registered security info", "The attacker's Authenticator is now her MFA"]],
        raw: R`27/11/2026 13:50:58  helen.marsh@contoso.com  Office 365 Exchange Online  Success
  IP: 203.0.113.58   Location: unfamiliar   Device: Windows (not registered)
27/11/2026 13:51:40  User registered security info  (Microsoft Authenticator · "Pixel 7")`},
       {t: "13:53:40", src: "Exchange Online · unified audit log", title: "New-InboxRule 'Archive': hides mail about payments", sev: "err", kind: "log",
        fields: [["Rule", "Archive", "Innocent-sounding name"], ["Condition", "Subject or body contains 'payment', 'invoice'", ""], ["Action", "Move to RSS Feeds, mark as read", "Helen won't see the replies"]],
        raw: R`27/11/2026 13:53:31  New-InboxRule  UserId: helen.marsh@contoso.com  ClientIP: 203.0.113.58
  Name:                   Archive
  SubjectOrBodyContainsWords: payment;invoice
  MoveToFolder:           RSS Feeds
  MarkAsRead:             True`}]},
    {title: "The real damage", sub: "\"Urgent payment before I board\"", ph: 7,
     what: "From Helen's real mailbox, the attacker emails Finance asking for an urgent payment to a 'new supplier' before she boards. It looks completely genuine, because it is her mailbox. An hour later the real Helen comes out of her board meeting and rings the desk: why can't she sign in?",
     check: "This is how account takeovers turn into fraud. The earliest and cheapest place to stop it was the phone call at the start.",
     tech: "Email from helen.marsh@contoso.com to ap@contoso.com, 14:02, requesting a same-day transfer to a new payee. Replies are hidden by the inbox rule. The real Helen's Authenticator was deleted, so her own sign-ins fail.",
     msgs: [{from: "mail", to: "fin", label: "URGENT: pay new supplier today", kind: "bad"}, {from: "helen", to: "desk", label: "Why can't I sign in?", kind: "normal"}],
     callout: "Account taken over", fault: ["fin"],
     evidence: [
       {t: "14:02:15", src: "Exchange Online · message trace", title: "From helen.marsh to Finance: 'urgent payment before I board'", sev: "err", kind: "email",
        fields: [["From", "helen.marsh@contoso.com", "Genuinely her mailbox"], ["To", "ap@contoso.com", "Accounts payable"], ["Subject", "Urgent – new supplier payment today", ""]],
        raw: R`From:    Helen Marsh <helen.marsh@contoso.com>
To:      Accounts Payable <ap@contoso.com>
Date:    27/11/2026 14:02
Subject: Urgent – new supplier payment today

Hi both, I'm about to board. Please set up the new supplier on the
attached and pay today, it's confidential so keep it between us.
Reply to me only. Thanks, H`},
       {t: "15:20:00", src: "Service desk · ticket", title: "The real Helen calls: can't sign in, didn't ask for a reset", sev: "err", kind: "ticket", fields: [["Caller", "Helen Marsh, from her directory number", "The real one"]], raw: R`27/11/2026 15:20  INC-31922  Helen Marsh (CEO), from 07700 900118 (directory)
"I've been in the board meeting since 1. Why doesn't my password work?
I haven't called IT today."`}]}
  ],
  fixed: [0,
    {title: "Call back on the number on file", sub: "Whatever the caller says", ph: 2,
     what: "You tell the caller you'll ring her straight back on the number the company holds for her. She protests: no time, phone's dead, just do it. You stay polite and ring the directory number anyway. The real Helen answers, from a board meeting downstairs. She hasn't called IT.",
     check: "A callback to a number you already hold reaches the real person. An attacker can know every fact about Helen, but they can't answer her real phone.",
     tech: "Callback to +44 7700 900118 (directory). Helen confirms no request was made. Caller on the original line hangs up. No changes made to the account.",
     msgs: [{from: "desk", to: "caller", label: "I'll ring you back on your number", kind: "fix"}, {from: "caller", to: "desk", label: "No time! Just do it!", kind: "bad"}, {from: "desk", to: "helen", label: "Calling 07700 900118", kind: "fix"}, {from: "helen", to: "desk", label: "I haven't called IT", kind: "data"}],
     callout: "It wasn't Helen", fault: ["caller"],
     evidence: [{t: "13:45:50", src: "Service desk · ticket note", title: "Real Helen, reached on her directory number, hasn't called IT", sev: "ok", kind: "ticket",
       fields: [["Callback", "+44 7700 900118", "From the directory"], ["Helen says", "Not me", "She's in a board meeting"], ["Original caller", "Hung up", ""]],
       raw: R`27/11/2026 13:45  Service Desk
Callback to directory number 07700 900118. Helen Marsh answered:
she has NOT contacted IT. Original caller (07700 900731) hung up.
No changes made.`}]},
    {title: "Triage: a security incident", sub: "Escalate, don't fix", ph: 3,
     what: "This isn't a password ticket any more. Someone just tried to take over the CEO's account. You escalate to the security team straight away, with the caller's number, the time, what they knew and what they asked for.",
     check: "Your job at this point is to stop and hand over fast, with good notes. The security team decides what happens next.",
     tech: "INC-31901 converted to security incident SEC-0217, priority P2 (attempted compromise of a privileged account, no confirmed access). Caller number added to the desk's watch list.",
     msgs: [{from: "desk", to: "sec", label: "Escalate: impersonation of CEO", kind: "fix"}],
     callout: "Security incident",
     evidence: [{t: "13:47:00", src: "Service desk · ticket", title: "Escalated to Security as SEC-0217", sev: "ok", kind: "ticket",
       fields: [["Escalated to", "Security (SEC-0217)", ""], ["Handed over", "Number, time, what they knew, what they asked for", "Everything security needs"]],
       raw: R`27/11/2026 13:47  INC-31901 → SEC-0217 (Security)
Impersonation attempt: caller claimed to be Helen Marsh (CEO).
From: +44 7700 900731 at 13:42. Knew employee ID + start date.
Requested password + MFA reset. Refused callback. Real Helen confirmed
not her. No changes made.`}]},
    {title: "Investigate: what else?", sub: "They'd already tried her password", ph: 4,
     what: "The security team checks Helen's sign-ins. Earlier that day there were three failed attempts from 203.0.113.58, the same address range seen in other attacks. The phone call was plan B, after guessing the password failed.",
     check: "One attempt often comes with others. Check the account's recent sign-ins and look for other calls to the desk.",
     tech: "Three failures (50126, invalid username or password) at 13:30 from 203.0.113.58. Conditional Access would have required MFA even if the password had been right.",
     msgs: [{from: "sec", to: "entra", label: "Helen's sign-ins today?", kind: "normal"}, {from: "entra", to: "sec", label: "3 failed from 203.0.113.58", kind: "data"}],
     evidence: [{t: "13:58:20", src: "Entra ID · sign-in log", title: "Three failed sign-ins for helen.marsh from 203.0.113.58 at 13:30", sev: "clue", kind: "log",
       fields: [["IP address", "203.0.113.58", "Same source the attacker would have used"], ["Error", "50126", "Invalid username or password"]],
       raw: R`27/11/2026 13:30:12  helen.marsh@contoso.com  Failure 50126  IP 203.0.113.58
27/11/2026 13:30:40  helen.marsh@contoso.com  Failure 50126  IP 203.0.113.58
27/11/2026 13:31:05  helen.marsh@contoso.com  Failure 50126  IP 203.0.113.58`}]},
    {title: "Close it out", sub: "No compromise, lessons shared", ph: 7,
     what: "Security blocks the address range, Helen changes her own password as a precaution, and the desk team is briefed in case the same caller tries again as someone else. The ticket closes with a full record of what happened.",
     check: "Brief the rest of the desk: attackers who fail once often ring back and try a different person.",
     tech: "Named location blocking 203.0.113.0/24; Helen's password changed by Helen (self-service, MFA-verified); sign-in risk dismissed after review. SEC-0217 closed: attempted, not successful.",
     msgs: [{from: "sec", to: "entra", label: "Block 203.0.113.0/24", kind: "fix"}, {from: "helen", to: "entra", label: "Changes her own password", kind: "fix"}],
     evidence: [{t: "14:30:00", src: "Security · incident", title: "SEC-0217 closed: impersonation attempt, no compromise", sev: "ok", kind: "ticket",
       fields: [["Outcome", "No access gained", "Stopped at the callback"], ["Follow-up", "Desk briefed; number on watch list", ""]],
       raw: R`27/11/2026 14:30  SEC-0217 closed.
Outcome: attempted account takeover of CEO via service desk. Stopped
at verification (callback). No changes to the account by the attacker.
Actions: 203.0.113.0/24 blocked; Helen changed own password; desk
briefed; 07700 900731 on watch list.`}]}
  ],
  fixes: [
    {id: "knowsid", kind: "herring", name: "They knew her employee ID and start date, so go ahead", short: "Trust the answers", at: 2,
     desc: "The answers were right, so treat her as verified.",
     result: "Employee IDs and start dates turn up on payslips, badges, old org charts and in data breaches. Knowing them proves nothing. The reset goes through and the attacker is in.",
     ev: {t: "13:44:40", src: "Service desk · ticket note", title: "Treated as verified on knowledge questions", sev: "warn", kind: "ticket", fields: [["Verified by", "Employee ID + start date", "Both findable"]], raw: R`27/11/2026 13:44  Verified (employee ID, start date). Proceeding.`}},
    {id: "stressed", kind: "herring", name: "She sounds genuinely stressed and it's the CEO: make an exception just this once", short: "Make an exception", at: 2,
     desc: "Skip the callback this one time, given who it is and how urgent it is.",
     result: "Urgency and authority are the two levers social engineers pull hardest. 'Just this once, for the CEO' is exactly what this call was designed to get.",
     ev: {t: "13:45:00", src: "Service desk · ticket note", title: "Callback skipped: 'exception for CEO, travelling'", sev: "warn", kind: "ticket", fields: [["Policy", "Callback required", "Skipped"]], raw: R`27/11/2026 13:45  Callback skipped: exception for CEO, travelling.`}},
    {id: "callback", kind: "fix", name: "Hang up and call back on the number in the directory", short: "Callback", at: 2,
     desc: "Tell the caller you'll ring back on the number on file. Real staff don't mind; attackers can't take that call.",
     result: "The directory number reaches the real Helen, in a board meeting downstairs, who has never called IT. No reset happens, and the call becomes a security incident instead of a breach.",
     ev: {t: "13:45:20", src: "Service desk · ticket note", title: "Declined to reset without a callback to the number on file", sev: "info", kind: "ticket", fields: [["Policy", "No reset without callback", "Applied, even for the CEO"]], raw: R`27/11/2026 13:45  Told caller: we'll call you back on the number on file.
No reset without callback (policy SD-07).`}}
  ],
  verify: [
    {t: "Hang up and call back on the number in the directory, whatever the caller says", ok: true, why: "A callback to a number you already hold reaches the real person. An attacker can know every fact about Helen, but they can't answer her real phone. Good desks apply this to everyone, and the CEO most of all."},
    {t: "Ask for her employee ID, start date and manager's name", why: "All findable on LinkedIn, old org charts or in a breached HR file. That's exactly what this caller is relying on."},
    {t: "Text a code to the mobile she's calling from", why: "That only proves she has the phone she's calling from, which is the attacker's phone."}
  ],
  triage: [
    {t: "Security incident · don't reset anything, escalate to the security team now with the details", ok: true, why: "An unverifiable request to reset the CEO's password and MFA is a likely attack on the most valuable account you have. The desk's job here is to stop and hand over fast, not to fix it."},
    {t: "P1 VIP · the CEO can't work, do whatever she asks, fast", why: "VIP status raises the stakes for checking, not lowers them. Attackers pick executives precisely because desks rush for them."},
    {t: "P4 · tell her to sort it out when she lands", why: "If it really is Helen she needs help; if it isn't, the security team needs to know now. Either way, parking it is wrong."}
  ],
  notes: [
    {t: "Caller claimed to be Helen Marsh (CEO), from +44 7700 900731 (not on file), 13:42. Asked for urgent password + MFA reset: 'phone dead, boarding a flight'. Knew employee ID and start date. Refused callback. Called directory number 07700 900118: real Helen confirmed she had not contacted IT. No changes made. Escalated to Security as SEC-0217 with call time and number. Security found 3 failed sign-ins from 203.0.113.58 earlier. Desk briefed.", ok: true, why: "Captures everything the security team and the next desk analyst need: the number, the time, what the caller knew, what they asked for, how it was caught and where it went. If they ring again as someone else, this note is how you'll spot them."},
    {t: "Caller couldn't verify. Hung up.", why: "Throws the evidence away: the number, the time, what they knew and what they wanted. Security needs all of it, and other desk analysts may get the same call tomorrow."},
    {t: "Reset done for CEO as urgent; verification skipped due to travel.", why: "Records that the control was skipped, which is the line a breach review will start from. The reset itself was the breach."}
  ],
  debrief: {
    check: ["Is the request for something an attacker wants: a password reset, an MFA reset, a new device?", "Is there pressure: urgency, authority, a reason the usual checks 'can't work'?", "Can you reach the person on a number you already hold?"],
    fix: ["Call back on the number on file. No callback, no reset", "A refused or failed callback is a security incident: escalate with the details"],
    prevent: ["A written, no-exceptions verification policy for resets, backed by senior leaders (the CEO most of all)", "Phishing-resistant MFA (security keys, passkeys) for executives and admins", "Brief the whole desk after any attempt: attackers often ring back and try a different person"]
  },
  tell: "An unknown number, urgency and authority, a reason the usual checks 'can't work', and a request for both a password and an MFA reset. The real person, called on the number on file, hasn't called."
},

/* ============ 4. SHARED MAILBOX NOT SHOWING ============ */
{
  id: "shared-missing", cat: "mail", name: "Shared mailbox not showing", sub: "She has access, Outlook doesn't show it",
  impact: "One user · Sales", systems: ["Exchange Online", "Outlook", "Mail-enabled security group"],
  cause: "Her access comes through a group, and Outlook only adds mailboxes automatically when access is given to you directly",
  fail: "Still not in her Outlook",
  ticket: {ref: "INC-31915", from: "Jo Pike · Sales", via: "Self-service portal", text: "Started in Sales on Monday. My manager said I'd see the sales@ mailbox in Outlook but it's not there. Everyone else in the team has it. I can't keep up with customer emails!"},
  intro: "Jo has been given access to the Sales shared mailbox, but it never appears in her Outlook. The access is real: it came from being added to the Sales mailbox group. The catch is that Outlook only adds a mailbox to your folder list by itself (automapping) when the permission is given to you directly. Everyone else in the team was added one by one years ago; Jo was added to the group.",
  summary: "sales@contoso.com grants FullAccess to the mail-enabled security group SG-Sales-Mailbox and, from before the group existed, to six users directly. Automapping relies on the shared mailbox's msExchDelegateListLink attribute, which Exchange only fills in for users granted FullAccess directly (with AutoMapping on). Jo's Autodiscover response therefore has no AlternativeMailbox entry for Sales. She can open it manually, but it won't appear on its own. The fix is to grant FullAccess directly with -AutoMapping $true (or add it manually); longer term, pick one model.",
  facts: [["Symptom", "Shared mailbox missing from Outlook"], ["Root cause", "Full Access granted through a group: no automapping"], ["Who's affected", "One user (any future group member too)"], ["Key evidence", "Get-MailboxPermission shows the group, not Jo; no AlternativeMailbox in Autodiscover"]],
  nodes: [
    {id: "desk", kind: "agent", label: "Service desk", sub: "You · 1st line", x: 120, y: 170},
    {id: "jo", kind: "user", label: "Jo Pike", sub: "Sales · started Monday", x: 120, y: 450},
    {id: "lap", kind: "laptop", label: "Jo's laptop", sub: "Outlook", x: 380, y: 450},
    {id: "exo", kind: "mail", label: "Exchange Online", sub: "sales@ shared mailbox", x: 680, y: 290},
    {id: "grp", kind: "idp", label: "SG-Sales-Mailbox", sub: "Group with Full Access", x: 700, y: 580}
  ],
  links: [["desk", "jo"], ["jo", "lap"], ["lap", "exo"], ["exo", "grp"], ["desk", "exo"], ["desk", "grp"]],
  lanes: ["desk", "jo", "lap", "exo", "grp"],
  stage: 5,
  steps: [
    {title: "Jo logs a ticket", sub: "\"Everyone else has sales@\"", ph: 1,
     what: "Jo raises a ticket through the portal. She started in Sales on Monday and her manager added her to the Sales mailbox. Everyone else in the team sees it in Outlook. She doesn't.",
     check: "'Everyone else has it' is a useful clue: something about how Jo was set up is different from the rest of the team.",
     tech: "Portal ticket, authenticated as jo.pike@contoso.com (MFA). Category Mail › Shared mailbox access.",
     msgs: [{from: "jo", to: "desk", label: "Can't see sales@ in Outlook", kind: "normal"}],
     evidence: [{t: "10:05:10", src: "Service desk · ticket", title: "INC-31915 logged via portal: sales@ missing from Outlook", sev: "info", kind: "ticket",
       fields: [["Caller", "Jo Pike, Sales", "Signed in to the portal"], ["Category", "Mail › Shared mailbox", ""]],
       raw: R`INC-31915   Logged 02/12/2026 10:05   Self-service portal (jo.pike, MFA)
Category:  Mail › Shared mailbox
Summary:   sales@ not showing in Outlook. Rest of the team have it.
Started in Sales on Mon 30/11.`}]},
    {title: "Check it's approved", sub: "Access needs the owner's OK", ph: 2,
     what: "For access requests, the question isn't only 'is this really Jo?' (the portal sign-in already proves that) but 'should Jo have this?'. The Sales manager, who owns the mailbox, approved her access on Monday.",
     check: "Look for the mailbox owner's approval on the ticket or the original request. No approval, no access.",
     tech: "Approval recorded on REQ-20871 by Dan Hale (Sales manager, owner of sales@): 'Add Jo Pike to Sales mailbox'. Fulfilled by adding Jo to SG-Sales-Mailbox.",
     msgs: [{from: "desk", to: "jo", label: "Approved by the mailbox owner?", kind: "normal"}, {from: "jo", to: "desk", label: "Dan approved it Monday", kind: "data"}],
     evidence: [{t: "10:07:00", src: "Service desk · request", title: "REQ-20871: Sales manager approved Jo's access to sales@", sev: "ok", kind: "ticket",
       fields: [["Approved by", "Dan Hale (Sales manager)", "Owner of sales@"], ["Fulfilled", "Added to SG-Sales-Mailbox", "That detail will matter"]],
       raw: R`REQ-20871  30/11/2026 09:12  Add Jo Pike to Sales mailbox
Approved:  Dan Hale (Sales manager, mailbox owner)  30/11 09:40
Fulfilled: added jo.pike to SG-Sales-Mailbox  30/11 10:02`}]},
    {title: "Triage", sub: "One user, with a workaround", ph: 3,
     what: "One person is affected and there's a way round it today: Jo can open the Sales mailbox in Outlook on the web, or add it by hand. That makes it a P4, but a quick one.",
     check: "A workaround lowers urgency, not importance. Note it on the ticket so Jo can carry on while you fix it.",
     tech: "Impact low (1 user), urgency low (workaround: Outlook on the web › Open another mailbox) → P4.",
     msgs: [], focus: ["desk"], callout: "P4 · workaround: Outlook on the web",
     evidence: [{t: "10:08:20", src: "Service desk · ticket", title: "Priority P4; workaround given", sev: "info", kind: "ticket",
       fields: [["Priority", "P4", ""], ["Workaround", "Open sales@ in Outlook on the web", "Jo can keep working"]],
       raw: R`02/12/2026 10:08  Priority P4. Workaround sent to Jo: Outlook on the web
› profile picture › Open another mailbox › sales@contoso.com`}]},
    {title: "Check the permissions", sub: "The group has it, Jo doesn't", ph: 4,
     what: "You look at who has access to sales@. Six people are listed by name, plus the group SG-Sales-Mailbox. Jo isn't listed herself, but she is in the group. So she really does have access, just through the group.",
     check: "Read the permission list carefully: is the person there by name, or only through a group?",
     tech: "Get-MailboxPermission sales@ shows FullAccess for six users and for CONTOSO SG-Sales-Mailbox. Get-DistributionGroupMember SG-Sales-Mailbox includes Jo Pike.",
     msgs: [{from: "desk", to: "exo", label: "Who has Full Access to sales@?", kind: "normal"}, {from: "exo", to: "desk", label: "6 users + SG-Sales-Mailbox", kind: "data"}, {from: "desk", to: "grp", label: "Is Jo in the group?", kind: "normal"}, {from: "grp", to: "desk", label: "Yes", kind: "data"}],
     cmds: {win: R`Connect-ExchangeOnline
Get-MailboxPermission sales@contoso.com |
  Where-Object { $_.User -notlike "NT AUTHORITY*" } |
  Format-Table User, AccessRights, IsInherited

Get-DistributionGroupMember SG-Sales-Mailbox | Format-Table Name, PrimarySmtpAddress`, nix: R`Exchange admin centre
  › Recipients › Mailboxes › Sales
  › Delegation › Read and manage (Full Access) › Edit
  (shows users AND groups, so check which one Jo is)`},
     evidence: [{t: "10:12:40", src: "Exchange Online · PowerShell", title: "Full Access: six named users and the group SG-Sales-Mailbox; Jo only via the group", sev: "clue", kind: "cmd",
       fields: [["Jo by name", "Not listed", ""], ["SG-Sales-Mailbox", "FullAccess", "Jo is a member"]],
       raw: R`PS> Get-MailboxPermission sales@contoso.com | ? {$_.User -notlike "NT AUTHORITY*"} | ft User,AccessRights,IsInherited

User                         AccessRights IsInherited
----                         ------------ -----------
amy.cole@contoso.com         {FullAccess} False
ravi.shah@contoso.com        {FullAccess} False
dan.hale@contoso.com         {FullAccess} False
lee.ward@contoso.com         {FullAccess} False
mo.ahmed@contoso.com         {FullAccess} False
kate.sims@contoso.com        {FullAccess} False
SG-Sales-Mailbox             {FullAccess} False

PS> Get-DistributionGroupMember SG-Sales-Mailbox | ft Name

Name
----
Jo Pike`}]},
    {title: "Why Outlook doesn't show it", sub: "No automapping through groups", ph: 5,
     what: "When Outlook starts, it asks Exchange which mailboxes to show. Exchange only lists mailboxes you've been given access to directly. Group access works if you open the mailbox yourself, but Outlook will never add it for you. So Jo's Outlook only ever shows her own mailbox.",
     check: "In Outlook's Test E-mail AutoConfiguration, look in the XML for an AlternativeMailbox entry. If sales@ isn't there, Outlook won't add it on its own.",
     tech: "Automapping is driven by msExchDelegateListLink on the shared mailbox, which is only populated for direct FullAccess grants with AutoMapping $true. Jo's Autodiscover response contains her own mailbox and no AlternativeMailbox element.",
     msgs: [{from: "lap", to: "exo", label: "Autodiscover: my mailboxes?", kind: "normal"}, {from: "exo", to: "lap", label: "Just your own", kind: "bad"}],
     callout: "Groups don't automap", fault: ["lap"],
     cmds: {win: R`# Is Jo on the Full Access list by name? (No output = only through a group,
# which means no automapping)
Get-MailboxPermission sales@contoso.com -User jo.pike@contoso.com
# The quickest proof is on Jo's PC: see the other tab`, nix: R`On Jo's PC:
  hold Ctrl and right-click the Outlook icon in the system tray
  › Test E-mail AutoConfiguration
  › untick the Guessmart options › Test
  › XML tab: look for <AlternativeMailbox> for sales@`},
     evidence: [{t: "10:16:05", src: "Jo's PC · Outlook", title: "Autodiscover XML: no AlternativeMailbox entry for sales@", sev: "err", kind: "screen",
       fields: [["AlternativeMailbox", "None", "So Outlook adds nothing"], ["Mailboxes returned", "jo.pike@contoso.com only", ""]],
       raw: R`Test E-mail AutoConfiguration · XML (extract)

<Account>
  <AccountType>email</AccountType>
  <Action>settings</Action>
  <MicrosoftOnline>True</MicrosoftOnline>
  <ConsumerMailbox>False</ConsumerMailbox>
  <Protocol>
    <Type>mapiHttp</Type>
    ...
  </Protocol>
  <!-- no <AlternativeMailbox> elements -->
</Account>`}]},
    {title: "Jo checks again", sub: "Still not there", ph: 7,
     what: "Jo restarts Outlook, then restarts her laptop for good measure. Sales still isn't there, and it never will be, because nothing about the way she was given access has changed.",
     check: "If nothing changed on the server side, nothing will change in Outlook. Restarts only help after the permission is set the right way.",
     tech: "No change to msExchDelegateListLink; Autodiscover response unchanged.",
     msgs: [{from: "lap", to: "exo", label: "Autodiscover again", kind: "normal"}, {from: "exo", to: "lap", label: "Just your own", kind: "bad"}, {from: "jo", to: "desk", label: "Still not there", kind: "normal"}],
     callout: "Still missing",
     evidence: [{t: "10:40:00", src: "Service desk · ticket", title: "Jo: restarted twice, sales@ still not showing", sev: "err", kind: "ticket",
       fields: [["Update from", "Jo Pike", ""], ["Says", "Restarted Outlook and laptop", "No change"]],
       raw: R`02/12/2026 10:40  Jo Pike (portal reply)
Restarted Outlook and then my laptop. Still no Sales folder.`}]}
  ],
  fixed: [0, 1, 2, 3, 4,
    {title: "Outlook picks it up", sub: "Now Autodiscover lists sales@", ph: 6,
     what: "With Jo given Full Access by name, Exchange records her as someone the Sales mailbox should be added for. Next time Outlook asks which mailboxes to show, sales@ is on the list, and the folder appears under her own mailbox.",
     check: "Run Test E-mail AutoConfiguration again: there should now be an AlternativeMailbox entry for sales@. It can take up to an hour, plus an Outlook restart.",
     tech: "Add-MailboxPermission with AutoMapping $true populates msExchDelegateListLink for Jo. Autodiscover now returns <AlternativeMailbox><Type>Delegate</Type><SmtpAddress>sales@contoso.com</SmtpAddress>.",
     msgs: [{from: "lap", to: "exo", label: "Autodiscover: my mailboxes?", kind: "normal"}, {from: "exo", to: "lap", label: "Yours + sales@", kind: "fix"}],
     callout: "Sales appears",
     evidence: [{t: "10:48:00", src: "Jo's PC · Outlook", title: "Autodiscover XML now includes sales@ as an AlternativeMailbox", sev: "ok", kind: "screen",
       fields: [["AlternativeMailbox", "Sales · sales@contoso.com", "Outlook adds it automatically"]],
       raw: R`<AlternativeMailbox>
  <Type>Delegate</Type>
  <DisplayName>Sales</DisplayName>
  <SmtpAddress>sales@contoso.com</SmtpAddress>
  <OwnerSmtpAddress>sales@contoso.com</OwnerSmtpAddress>
</AlternativeMailbox>`}]},
    {title: "Jo confirms", sub: "Sales is in her folder list", ph: 7,
     what: "Jo restarts Outlook and the Sales mailbox is there under her own. She can see the shared inbox and keep up with customers. You close the ticket, and flag that Sales uses a mix of group and direct permissions, which will catch the next starter out too.",
     check: "Ask the user to open a message in the shared mailbox, not just see the folder.",
     tech: "Mixed model on sales@ (6 direct, 1 group) noted as problem PRB-0088 for a decision on one approach.",
     msgs: [{from: "jo", to: "desk", label: "It's there, thanks!", kind: "data"}],
     evidence: [{t: "10:55:00", src: "Service desk · ticket", title: "INC-31915 resolved; mixed permission model raised as PRB-0088", sev: "ok", kind: "ticket",
       fields: [["Status", "Resolved", "Jo confirmed"], ["Follow-up", "PRB-0088", "Pick one permission model for team mailboxes"]],
       raw: R`02/12/2026 10:55  INC-31915 Resolved (Jo confirmed).
PRB-0088 raised: sales@ mixes direct grants and a group; new starters
added via the group won't automap.`}]}
  ],
  fixes: [
    {id: "profile", kind: "herring", name: "Rebuild her Outlook profile", short: "New profile", at: 5,
     desc: "Create a fresh Outlook profile so it 'picks up the mailbox'.",
     result: "A fresh profile asks Autodiscover again, and gets the same answer: no extra mailboxes. Half an hour of re-downloading mail later, sales@ still isn't there.",
     ev: {t: "10:25:00", src: "Jo's PC · Outlook", title: "New profile created; still only Jo's own mailbox", sev: "warn", kind: "screen", fields: [["Mailboxes", "jo.pike@contoso.com", "No Sales"]], raw: R`Control Panel › Mail › Show Profiles › Add "Outlook2"
Autodiscover: jo.pike@contoso.com  ·  AlternativeMailbox: none
Folder list: Jo Pike (only)`}},
    {id: "sendas", kind: "herring", name: "Grant her Send As on sales@", short: "Send As", at: 5,
     desc: "Give Jo Send As permission on the Sales mailbox.",
     result: "Send As is about sending from the mailbox, not seeing it. It may be useful later, but Outlook still doesn't show the mailbox.",
     ev: {t: "10:27:10", src: "Exchange Online · PowerShell", title: "Send As granted; sales@ still not in Outlook", sev: "warn", kind: "cmd", fields: [["AccessRights", "SendAs", "A different permission"]], raw: R`PS> Add-RecipientPermission sales@contoso.com -Trustee jo.pike@contoso.com -AccessRights SendAs -Confirm:$false

Identity Trustee              AccessControlType AccessRights
-------- -------              ----------------- ------------
Sales    jo.pike@contoso.com  Allow             {SendAs}`}},
    {id: "direct", kind: "fix", name: "Give Jo Full Access directly, with automapping on", short: "Direct Full Access", at: 6,
     desc: "Add Jo herself (not the group) to the mailbox's Full Access list, with AutoMapping switched on.",
     result: "Exchange records Jo as a direct delegate, Autodiscover now lists sales@ for her, and Outlook adds it, usually within the hour and after a restart.",
     ev: {t: "10:20:30", src: "Exchange Online · PowerShell", title: "Full Access granted to Jo directly (AutoMapping on)", sev: "info", kind: "cmd", fields: [["User", "jo.pike@contoso.com", "By name, not through the group"], ["AutoMapping", "$true", ""]], raw: R`PS> Add-MailboxPermission sales@contoso.com -User jo.pike@contoso.com -AccessRights FullAccess -InheritanceType All -AutoMapping $true

Identity User                  AccessRights IsInherited Deny
-------- ----                  ------------ ----------- ----
Sales    jo.pike@contoso.com   {FullAccess} False       False`}}
  ],
  verify: [
    {t: "Check the request came from Jo's own signed-in account, and that the mailbox owner (her manager) approved it", ok: true, why: "For access requests the risk is less about impersonation and more about people getting access they shouldn't have. The portal sign-in proves it's Jo; the owner's approval proves she should see Sales' customer mail."},
    {t: "Ask for her employee ID", why: "Proves nothing about whether she should be reading the Sales team's customer emails."},
    {t: "No check needed: everyone in Sales has it", why: "'Everyone has it' is how people who've moved teams or left end up still reading mailboxes. Access gets the owner's approval, every time."}
  ],
  triage: [
    {t: "P4 · one user, and there's a workaround (open sales@ in Outlook on the web) while you fix it", ok: true, why: "Impact is one person and she can keep working through the web today. Low urgency, low impact: P4, though it's a quick one to fix properly."},
    {t: "P2 · customers are waiting on replies", why: "The rest of the team is still answering customers, and Jo can too, through the web. Impact is one user with a workaround."},
    {t: "Escalate to the Exchange team straight away", why: "Once you know the automapping rule it's a standard permissions fix the service desk can do. Escalating just puts it in another queue."}
  ],
  notes: [
    {t: "sales@ not showing in Jo's Outlook. Jo had Full Access only through SG-Sales-Mailbox; Autodiscover returned no AlternativeMailbox because automapping only applies to direct grants. Added Jo directly: Add-MailboxPermission sales@contoso.com -User jo.pike -AccessRights FullAccess -AutoMapping $true. Appeared after Outlook restart 10:48; Jo confirmed. sales@ mixes direct and group permissions: raised PRB-0088 to pick one model.", ok: true, why: "Explains the cause (group vs direct), the exact change, the proof, and the bigger problem that will catch the next starter. Someone searching 'shared mailbox not showing' will learn the rule from this."},
    {t: "Recreated Outlook profile, now working.", why: "That isn't what fixed it. The next person will copy it and lose half an hour."},
    {t: "Added user to mailbox.", why: "Which mailbox, which permission, and which way? The direct-versus-group detail is the whole lesson here."}
  ],
  debrief: {
    check: ["Get-MailboxPermission: is access granted to the user directly, or only through a group?", "Outlook › Test E-mail AutoConfiguration: is there an AlternativeMailbox entry for the shared mailbox?", "Can they open it by hand (Outlook on the web › Open another mailbox)?"],
    fix: ["Grant Full Access to the user directly with AutoMapping on, or add the mailbox by hand in Outlook", "Allow up to an hour and an Outlook restart"],
    prevent: ["Pick one model per mailbox: direct grants (automap) or groups (easier to manage, but added by hand)", "If you use groups, put 'add the mailbox in Outlook' in the joiner instructions", "Write the model down in the mailbox's notes for the next admin"]
  },
  tell: "The permission is there but only through a group, the user can open the mailbox by hand, and the Autodiscover XML has no AlternativeMailbox entry for it."
}

]);
})();
