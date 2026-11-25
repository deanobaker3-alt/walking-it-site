/* Ticketwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — tickets 5–8.
   The format is documented at the top of tickets1.js. */
(function () {
const R = String.raw;
window.TICKETS = (window.TICKETS || []).concat([

/* ============ 5. CAN'T SEND AS SALES ============ */
{
  id: "send-as", cat: "mail", name: "Can't send as Sales", sub: "Full Access isn't permission to send",
  impact: "One user · Sales", systems: ["Exchange Online", "Outlook"],
  cause: "He has Full Access to the mailbox but no Send As permission",
  fail: "Bounced again: SendAsDenied",
  ticket: {ref: "INC-31927", from: "Ravi Shah · Sales", via: "Email", text: "When I send from sales@ I get a bounce back saying I'm not allowed. I can see and read all the emails fine. Customers must only ever see 'Sales', not my name (Dan's rule)."},
  intro: "Ravi can open the Sales mailbox and read everything, because he has Full Access. But Full Access only lets you look and manage: it doesn't let you send as the mailbox. That's a separate permission called Send As. Every time he sends from sales@, Exchange refuses and bounces it back.",
  summary: "Ravi has FullAccess on sales@contoso.com but no SendAs entry in Get-RecipientPermission. Messages he submits with From: sales@ are rejected: '554 5.2.252 SendAsDenied; ravi.shah@contoso.com not allowed to send as sales@contoso.com'. Send on Behalf (GrantSendOnBehalfTo) would deliver, but recipients would see 'Ravi Shah on behalf of Sales', which breaks the team's rule. The fix is Add-RecipientPermission -AccessRights SendAs, which can take up to an hour to apply.",
  facts: [["Symptom", "Bounce: 554 5.2.252 SendAsDenied"], ["Root cause", "Full Access but no Send As"], ["Who's affected", "One user"], ["Key evidence", "Get-RecipientPermission: no SendAs for Ravi"]],
  nodes: [
    {id: "desk", kind: "agent", label: "Service desk", sub: "You · 1st line", x: 120, y: 170},
    {id: "ravi", kind: "user", label: "Ravi Shah", sub: "Sales", x: 120, y: 450},
    {id: "lap", kind: "laptop", label: "Ravi's laptop", sub: "Outlook · From: sales@", x: 380, y: 450},
    {id: "exo", kind: "mail", label: "Exchange Online", sub: "sales@ shared mailbox", x: 660, y: 290},
    {id: "cust", kind: "user", label: "Customer", sub: "orders@client.example", x: 900, y: 480}
  ],
  links: [["desk", "ravi"], ["ravi", "lap"], ["lap", "exo"], ["exo", "cust"], ["desk", "exo"]],
  lanes: ["desk", "ravi", "lap", "exo", "cust"],
  stage: 5,
  steps: [
    {title: "Ravi emails the desk", sub: "With the bounce attached", ph: 1,
     what: "Ravi emails the desk with the bounce message attached. He can read everything in the Sales mailbox, but anything he sends from it comes straight back.",
     check: "Always ask for (or find) the bounce message. The code in it usually tells you exactly what's wrong.",
     tech: "Email to servicedesk@ with the non-delivery report attached. Category Mail › Shared mailbox › Sending.",
     msgs: [{from: "ravi", to: "desk", label: "Bounces when I send as Sales", kind: "normal"}],
     evidence: [{t: "11:02:00", src: "Service desk · ticket", title: "INC-31927 logged: sending from sales@ bounces", sev: "info", kind: "ticket",
       fields: [["Caller", "Ravi Shah, Sales", "By email from his own mailbox"], ["Attachment", "Non-delivery report", "Gold dust"]],
       raw: R`INC-31927   Logged 02/12/2026 11:02   Email (ravi.shah@contoso.com)
Category:  Mail › Shared mailbox › Sending
Summary:   Sending from sales@ bounces. Reading is fine.
Note:      Customers must see "Sales" only (Dan Hale's rule).
Attached:  Undeliverable: Your order 4471.msg`}]},
    {title: "Check it's approved", sub: "Sending as the team needs sign-off", ph: 2,
     what: "Sending as sales@ means speaking for the company, so it needs the mailbox owner's approval, not just Ravi asking. You check with Dan, the Sales manager, who approves it on the ticket.",
     check: "The email came from Ravi's own signed-in mailbox, which shows it's him. The owner's approval shows he should have it.",
     tech: "Approval from Dan Hale (owner of sales@) recorded on INC-31927 at 11:04.",
     msgs: [{from: "desk", to: "ravi", label: "Need Dan's approval", kind: "normal"}, {from: "ravi", to: "desk", label: "Dan's approved it", kind: "data"}],
     evidence: [{t: "11:04:30", src: "Service desk · ticket note", title: "Mailbox owner Dan Hale approved Send As for Ravi", sev: "ok", kind: "ticket",
       fields: [["Approved by", "Dan Hale (Sales manager)", "Owner of sales@"]],
       raw: R`02/12/2026 11:04  Dan Hale (approval): "Yes, Ravi should send as Sales."`}]},
    {title: "Triage", sub: "One user, core part of his job", ph: 3,
     what: "One person can't do a core part of his job: replying to customers as Sales. Replying from his own address breaks the team's rule, so there's no real workaround. That's a P3.",
     check: "Ask whether the 'workaround' is actually acceptable to the business. Here it isn't.",
     tech: "Impact low (1 user), urgency medium-high (customer replies blocked, no acceptable workaround) → P3.",
     msgs: [], focus: ["desk"], callout: "P3 · no clean workaround",
     evidence: [{t: "11:05:10", src: "Service desk · ticket", title: "Priority P3", sev: "info", kind: "ticket",
       fields: [["Priority", "P3", "Can't reply to customers as Sales"]],
       raw: R`02/12/2026 11:05  Priority P3. Workaround (send from own address) not acceptable to the business.`}]},
    {title: "Watch a send fail", sub: "554 5.2.252 SendAsDenied", ph: 4,
     what: "Ravi sends a test from sales@ while you watch. Exchange checks whether he's allowed to send as the Sales mailbox, finds he isn't, and bounces it with a message that says exactly that: SendAsDenied.",
     check: "Read the code in the bounce: 5.2.252 SendAsDenied, and the line 'not allowed to send as'. That names the missing permission.",
     tech: "Submission rejected: '554 5.2.252 SendAsDenied; ravi.shah@contoso.com not allowed to send as sales@contoso.com; STOREDRV.Submission.Exception:SendAsDeniedException.MapiExceptionSendAsDenied'.",
     msgs: [{from: "lap", to: "exo", label: "From: sales@ · To: customer", kind: "normal"}, {from: "exo", to: "lap", label: "554 5.2.252 SendAsDenied", kind: "bad"}],
     evidence: [{t: "11:08:20", src: "Ravi's Outlook · bounce", title: "NDR: 554 5.2.252 SendAsDenied: not allowed to send as sales@", sev: "err", kind: "email",
       fields: [["Code", "554 5.2.252", "A permanent failure"], ["Reason", "SendAsDenied", "No Send As permission"], ["Says", "ravi.shah not allowed to send as sales@", "Couldn't be clearer"]],
       raw: R`Undeliverable: Test from Sales

Delivery has failed to these recipients or groups:
orders@client.example

Diagnostic information for administrators:
Remote Server returned '554 5.2.252 SendAsDenied; ravi.shah@contoso.com not
allowed to send as sales@contoso.com; STOREDRV.Submission.Exception:
SendAsDeniedException.MapiExceptionSendAsDenied; Failed to process message
due to a permanent exception with message [BeginDiagnosticData]Cannot submit
message.'`}]},
    {title: "Check his permissions", sub: "Full Access yes, Send As no", ph: 5,
     what: "You check what Ravi can do on sales@. He has Full Access, which is why he can read everything. But there's no Send As entry for him at all. They're two different permissions, granted separately, and he only ever got the first one.",
     check: "Full Access is checked with Get-MailboxPermission. Send As lives somewhere else: Get-RecipientPermission. Check both.",
     tech: "Get-MailboxPermission: ravi.shah {FullAccess}. Get-RecipientPermission -Trustee ravi.shah: no entries. GrantSendOnBehalfTo: empty.",
     msgs: [{from: "desk", to: "exo", label: "Ravi's permissions on sales@?", kind: "normal"}, {from: "exo", to: "desk", label: "Full Access ✓ · Send As ✗", kind: "data"}],
     callout: "Full Access ≠ Send As", fault: ["exo"],
     cmds: {win: R`Connect-ExchangeOnline
Get-MailboxPermission sales@contoso.com -User ravi.shah@contoso.com      # reading
Get-RecipientPermission sales@contoso.com -Trustee ravi.shah@contoso.com # Send As
(Get-Mailbox sales@contoso.com).GrantSendOnBehalfTo                     # Send on Behalf`, nix: R`Exchange admin centre
  › Recipients › Mailboxes › Sales › Delegation
  › three separate lists:
      Read and manage (Full Access)
      Send as
      Send on behalf`},
     evidence: [{t: "11:11:00", src: "Exchange Online · PowerShell", title: "Ravi: FullAccess on sales@, but no Send As entry", sev: "clue", kind: "cmd",
       fields: [["Full Access", "Yes", "Why he can read"], ["Send As", "None", "Why sending bounces"], ["Send on Behalf", "None", ""]],
       raw: R`PS> Get-MailboxPermission sales@contoso.com -User ravi.shah@contoso.com

Identity User                   AccessRights IsInherited Deny
-------- ----                   ------------ ----------- ----
Sales    ravi.shah@contoso.com  {FullAccess} False       False

PS> Get-RecipientPermission sales@contoso.com -Trustee ravi.shah@contoso.com
PS>                                    # (nothing: no Send As)`}]},
    {title: "Another bounce", sub: "A customer's still waiting", ph: 7,
     what: "Ravi tries again to answer a customer's order query. It bounces again, exactly the same way. Nothing will change until he's given the permission that's actually missing.",
     check: "Same code, same message: the cause hasn't been touched.",
     tech: "Repeat 554 5.2.252 SendAsDenied at 11:39.",
     msgs: [{from: "lap", to: "exo", label: "From: sales@ (order 4471)", kind: "normal"}, {from: "exo", to: "lap", label: "SendAsDenied again", kind: "bad"}],
     callout: "Bounced again",
     evidence: [{t: "11:40:00", src: "Ravi's Outlook · bounce", title: "SendAsDenied again on a real customer reply", sev: "err", kind: "email",
       fields: [["Subject", "RE: Your order 4471", "A real customer, still waiting"]],
       raw: R`Undeliverable: RE: Your order 4471
Remote Server returned '554 5.2.252 SendAsDenied; ravi.shah@contoso.com not
allowed to send as sales@contoso.com; ...'`}]}
  ],
  fixed: [0, 1, 2, 3, 4,
    {title: "Send again", sub: "From: Sales, and nothing else", ph: 6,
     what: "Once Send As has had time to apply, Ravi sends from sales@ again. Exchange accepts it, and the customer receives an email from 'Sales' with no mention of Ravi anywhere.",
     check: "A message trace should show the message delivered with sales@ as the sender. Ask Ravi to check what the recipient sees.",
     tech: "Get-MessageTraceV2 shows Status Delivered, SenderAddress sales@contoso.com. No Sender header naming Ravi, so no 'on behalf of'.",
     msgs: [{from: "lap", to: "exo", label: "From: sales@ · order 4471", kind: "normal"}, {from: "exo", to: "cust", label: "From: Sales <sales@contoso.com>", kind: "fix"}],
     callout: "Delivered as Sales",
     cmds: {win: R`Get-MessageTraceV2 -SenderAddress sales@contoso.com -StartDate (Get-Date).AddHours(-1) -EndDate (Get-Date) |
  Format-Table Received, SenderAddress, RecipientAddress, Subject, Status`, nix: R`Exchange admin centre
  › Mail flow › Message trace › Start a trace
  › Senders: sales@contoso.com › last hour
  › Status should say Delivered`},
     evidence: [{t: "11:52:10", src: "Exchange Online · message trace", title: "RE: Your order 4471: delivered, sender sales@contoso.com", sev: "ok", kind: "cmd",
       fields: [["Sender", "sales@contoso.com", "Customers see Sales only"], ["Status", "Delivered", ""]],
       raw: R`PS> Get-MessageTraceV2 -SenderAddress sales@contoso.com -StartDate (Get-Date).AddHours(-1) -EndDate (Get-Date) | ft Received,SenderAddress,RecipientAddress,Subject,Status

Received             SenderAddress       RecipientAddress       Subject               Status
--------             -------------       ----------------       -------               ------
02/12/2026 11:51:58  sales@contoso.com   orders@client.example  RE: Your order 4471   Delivered`}]},
    {title: "Ravi confirms", sub: "Customers see 'Sales' only", ph: 7,
     what: "Ravi checks with the customer: the reply arrived from Sales, with no mention of him. You close the ticket, noting who approved the permission.",
     check: "Confirm against the business requirement, not just 'it sent'. Here that's 'customers only see Sales'.",
     tech: "Resolved with approval reference recorded for audit.",
     msgs: [{from: "ravi", to: "desk", label: "Customer sees Sales only, thanks", kind: "data"}],
     evidence: [{t: "11:58:00", src: "Service desk · ticket", title: "INC-31927 resolved: Send As granted, approved by Dan Hale", sev: "ok", kind: "ticket",
       fields: [["Status", "Resolved", "Ravi confirmed"]],
       raw: R`02/12/2026 11:58  INC-31927 Resolved. Send As on sales@ for ravi.shah (approved: Dan Hale).`}]}
  ],
  fixes: [
    {id: "behalf", kind: "herring", name: "Give him Send on Behalf instead", short: "Send on Behalf", at: 5,
     desc: "Add Ravi to the mailbox's Send on Behalf list.",
     result: "The message goes, but the customer sees 'Ravi Shah on behalf of Sales'. That breaks the team's rule that customers only ever see Sales, so the ticket comes straight back.",
     ev: {t: "11:20:10", src: "Customer's view · message header", title: "Delivered, but shows 'Ravi Shah on behalf of Sales'", sev: "warn", kind: "email", fields: [["From", "Sales <sales@contoso.com>", ""], ["Sender", "Ravi Shah <ravi.shah@contoso.com>", "Shown to the customer as 'on behalf of'"]], raw: R`PS> Set-Mailbox sales@contoso.com -GrantSendOnBehalfTo @{Add="ravi.shah@contoso.com"}

From:    Sales <sales@contoso.com>
Sender:  Ravi Shah <ravi.shah@contoso.com>
Shown as: "Ravi Shah on behalf of Sales"`}},
    {id: "readd", kind: "herring", name: "Remove and re-add his Full Access", short: "Re-add Full Access", at: 5,
     desc: "Take Full Access away and give it back, in case it 'didn't apply properly'.",
     result: "Full Access never includes sending, however many times you grant it. Same permission, same bounce.",
     ev: {t: "11:22:40", src: "Ravi's Outlook · bounce", title: "Full Access re-added; still 554 5.2.252 SendAsDenied", sev: "warn", kind: "email", fields: [["Code", "554 5.2.252 SendAsDenied", "Unchanged"]], raw: R`PS> Remove-MailboxPermission sales@contoso.com -User ravi.shah@contoso.com -AccessRights FullAccess -Confirm:$false
PS> Add-MailboxPermission sales@contoso.com -User ravi.shah@contoso.com -AccessRights FullAccess

(test send) Remote Server returned '554 5.2.252 SendAsDenied; ravi.shah@contoso.com not allowed to send as sales@contoso.com'`}},
    {id: "sendas", kind: "fix", name: "Grant Ravi Send As on sales@", short: "Send As", at: 6,
     desc: "Add Ravi to the mailbox's Send As list.",
     result: "Exchange now accepts messages from Ravi with From: sales@. Customers see Sales and nothing else. It can take up to an hour to kick in.",
     ev: {t: "11:18:30", src: "Exchange Online · PowerShell", title: "Send As granted to Ravi on sales@", sev: "info", kind: "cmd", fields: [["AccessRights", "SendAs", "The missing permission"]], raw: R`PS> Add-RecipientPermission sales@contoso.com -Trustee ravi.shah@contoso.com -AccessRights SendAs -Confirm:$false

Identity Trustee                AccessControlType AccessRights
-------- -------                ----------------- ------------
Sales    ravi.shah@contoso.com  Allow             {SendAs}`}}
  ],
  verify: [
    {t: "It came from his own signed-in mailbox, so it's him; get the mailbox owner's approval before granting Send As", ok: true, why: "Send As lets someone speak as the company. Ravi's own mailbox shows the request is from him; the owner's approval shows he should have it, and the ticket records who said yes."},
    {t: "Ring him back on his mobile on file", why: "That proves it's Ravi, but not that he should be allowed to send as Sales. For permissions, the owner's approval is the check that matters."},
    {t: "No check needed: he already has Full Access, so Send As is the same thing", why: "It isn't. Full Access lets you read; Send As lets you speak as the company. They're approved separately for a reason."}
  ],
  triage: [
    {t: "P3 · one user can't do a core part of his job and there's no acceptable workaround. Service desk fixes it", ok: true, why: "One person, but they can't reply to customers in the way the business needs. P3, and a standard permissions fix the desk can do."},
    {t: "P4 · he can reply from his own mailbox for now", why: "That breaks the business rule and puts his personal address on customer threads. It isn't really a workaround."},
    {t: "P2 · email is broken", why: "Email works fine for everyone else, and even for Ravi apart from this one permission."}
  ],
  notes: [
    {t: "Ravi got NDR 554 5.2.252 SendAsDenied when sending from sales@. He had FullAccess (read) but no SendAs. Approved by Dan Hale (mailbox owner). Ran Add-RecipientPermission sales@contoso.com -Trustee ravi.shah -AccessRights SendAs. Test at 11:52 delivered; customer sees 'Sales' only, no 'on behalf of'. Ravi confirmed.", ok: true, why: "The bounce code, the missing permission, who approved it, the exact change and the proof it meets the business rule. That's a ready-made knowledge article."},
    {t: "Gave Ravi more permissions on Sales.", why: "Which ones? 'More permissions' is how mailboxes end up with nobody knowing who can do what."},
    {t: "Gave Send on Behalf, working now.", why: "It doesn't meet the requirement (customers see Ravi's name), and it records the wrong fix for the next person."}
  ],
  debrief: {
    check: ["Read the bounce: 5.2.252 SendAsDenied names exactly which permission is missing", "Get-RecipientPermission for Send As; GrantSendOnBehalfTo on the mailbox for Send on Behalf", "Ask what the recipient should see: just the mailbox, or 'X on behalf of'"],
    fix: ["Add-RecipientPermission … -AccessRights SendAs", "Allow up to an hour, then test with a real send"],
    prevent: ["For team mailboxes, request Full Access and Send As together in the joiner process", "Record who approved each Send As"]
  },
  tell: "Reading the mailbox works, sending from it bounces with 554 5.2.252 SendAsDenied, and the permissions show Full Access but no Send As."
},

/* ============ 6. MAILBOX FULL ============ */
{
  id: "mailbox-full", cat: "mail", name: "Mailbox full", sub: "49.6 GB and nowhere to put it",
  impact: "One user · Legal", systems: ["Exchange Online", "Retention policy", "Outlook"],
  cause: "Her mailbox is over the 49.5 GB sending limit and her online archive was never switched on",
  fail: "Still can't send: mailbox full",
  ticket: {ref: "INC-31933", from: "Maria Costa · Legal", via: "Phone call", text: "Outlook says my mailbox is full and I can't send anything. I can't delete anything either: it's all case correspondence I have to keep. I've got a contract to send by 3!"},
  intro: "Maria has kept every email for eleven years, because in Legal she has to. Her mailbox has grown to 49.6 GB. At 49.5 GB, Exchange stops her sending; at 50 GB she'll stop receiving too, and clients' emails will bounce. She doesn't need to delete anything: she needs somewhere to keep old mail that doesn't count towards the limit.",
  summary: "Microsoft 365 Business Standard mailboxes have IssueWarningQuota 49 GB, ProhibitSendQuota 49.5 GB and ProhibitSendReceiveQuota 50 GB. Maria's TotalItemSize is 49.61 GB, so sending is blocked. ArchiveStatus is None. Enabling the included online archive lets the Default MRM Policy's 'Default 2 year move to archive' tag move older items once the Managed Folder Assistant processes the mailbox (Start-ManagedFolderAssistant gets it going). Archived mail stays searchable, backed up and under retention.",
  facts: [["Symptom", "Can't send; Outlook says the mailbox is full"], ["Root cause", "Over the 49.5 GB send limit, no archive"], ["Who's affected", "One user (soon her clients too)"], ["Key evidence", "TotalItemSize 49.61 GB; ArchiveStatus None"]],
  nodes: [
    {id: "desk", kind: "agent", label: "Service desk", sub: "You · 1st line", x: 120, y: 170},
    {id: "maria", kind: "user", label: "Maria Costa", sub: "Legal", x: 120, y: 450},
    {id: "lap", kind: "laptop", label: "Maria's laptop", sub: "Outlook", x: 380, y: 450},
    {id: "exo", kind: "mail", label: "Exchange Online", sub: "Maria's mailbox · 49.6 GB", x: 660, y: 290},
    {id: "arch", kind: "db", label: "Online archive", sub: "Not switched on", x: 660, y: 590},
    {id: "client", kind: "user", label: "Client", sub: "Waiting for a contract", x: 900, y: 450}
  ],
  links: [["desk", "maria"], ["maria", "lap"], ["lap", "exo"], ["exo", "arch"], ["exo", "client"], ["desk", "exo"]],
  lanes: ["desk", "maria", "lap", "exo", "arch", "client"],
  stage: 5,
  steps: [
    {title: "Maria rings the desk", sub: "Contract due at 3", ph: 1,
     what: "Maria calls: Outlook says her mailbox is full, nothing will send, and she has a contract to get to a client by three. She can't just delete old mail, because it's case correspondence she's required to keep.",
     check: "Note the deadline and the constraint ('can't delete') on the ticket. They shape which fixes are acceptable.",
     tech: "Outlook InfoBar: mailbox full. Legal correspondence is under the firm's retention requirements, so deleting isn't an option.",
     msgs: [{from: "maria", to: "desk", label: "Mailbox full, contract due at 3", kind: "normal"}],
     evidence: [{t: "13:05:00", src: "Service desk · ticket", title: "INC-31933 logged: mailbox full, can't send; deadline 15:00", sev: "info", kind: "ticket",
       fields: [["Caller", "Maria Costa, Legal", ""], ["Deadline", "15:00 today", "Contract to a client"], ["Constraint", "Can't delete", "Case correspondence must be kept"]],
       raw: R`INC-31933   Logged 03/12/2026 13:05   Phone
Caller:    Maria Costa (Legal)  ext 4251
Category:  Mail › Mailbox size
Summary:   "Mailbox full", can't send. Contract due to client 15:00.
           Can't delete: case correspondence (retention).`}]},
    {title: "A quick check", sub: "Low-risk change, light-touch verification", ph: 2,
     what: "Nothing about Maria's sign-in or access is going to change, so a light check is enough: she's ringing from her own extension, and her name and team match the directory.",
     check: "Match the check to the risk. Resets and permissions get strong checks; a storage change on her own mailbox doesn't need a callback and a manager.",
     tech: "Caller ID ext 4251 matches Maria Costa in the directory. No credential, MFA or permission change planned.",
     msgs: [{from: "desk", to: "maria", label: "Name and extension match", kind: "normal"}],
     evidence: [{t: "13:06:30", src: "Service desk · ticket note", title: "Caller matches the directory (ext 4251); no access change planned", sev: "ok", kind: "ticket",
       fields: [["Check", "Directory match", "Proportionate: no access changes"]],
       raw: R`03/12/2026 13:06  Caller ID ext 4251 = Maria Costa (directory). Storage change only.`}]},
    {title: "Triage", sub: "One user, a hard deadline", ph: 3,
     what: "One person is affected, so on the matrix it's a P3. But there's a hard deadline at three and, once she hits 50 GB, clients' emails will start bouncing. So it gets worked now, and the deadline goes on the ticket.",
     check: "Priority comes from the matrix; what you pick up next can also depend on deadlines. Write them down.",
     tech: "Impact low (1 user), urgency high (deadline, about to stop receiving) → P3, worked immediately.",
     msgs: [], focus: ["desk"], callout: "P3 · work it now: deadline 15:00",
     evidence: [{t: "13:07:10", src: "Service desk · ticket", title: "Priority P3, worked now: deadline 15:00", sev: "info", kind: "ticket",
       fields: [["Priority", "P3", ""], ["Deadline", "15:00", "On the ticket"]],
       raw: R`03/12/2026 13:07  Priority P3. Deadline 15:00 (client contract). Working now.`}]},
    {title: "How full is it?", sub: "49.61 GB against a 49.5 GB send limit", ph: 4,
     what: "Maria's mailbox is 49.61 GB. Her licence gives her 50 GB, but sending stops at 49.5 GB, and that's where she is now. At 50 GB, she'd stop receiving too.",
     check: "Compare the mailbox size with its quotas. Sending stops first, then receiving.",
     tech: "Get-MailboxStatistics TotalItemSize 49.61 GB. Get-Mailbox: IssueWarningQuota 49 GB, ProhibitSendQuota 49.5 GB, ProhibitSendReceiveQuota 50 GB (Business Standard defaults).",
     msgs: [{from: "desk", to: "exo", label: "How big is Maria's mailbox?", kind: "normal"}, {from: "exo", to: "desk", label: "49.61 GB · send limit 49.5", kind: "data"}],
     cmds: {win: R`Connect-ExchangeOnline
Get-MailboxStatistics maria.costa@contoso.com | Format-List DisplayName, TotalItemSize, ItemCount
Get-Mailbox maria.costa@contoso.com | Format-List IssueWarningQuota, ProhibitSendQuota, ProhibitSendReceiveQuota`, nix: R`Microsoft 365 admin centre
  › Users › Active users › Maria Costa
  › Mail tab › Mailbox storage (shows how full it is)`},
     evidence: [{t: "13:10:20", src: "Exchange Online · PowerShell", title: "49.61 GB used; sending blocked at 49.5 GB", sev: "err", kind: "cmd",
       fields: [["TotalItemSize", "49.61 GB", "Over the send limit"], ["ProhibitSendQuota", "49.5 GB", "Can't send"], ["ProhibitSendReceiveQuota", "50 GB", "390 MB until clients' mail bounces"]],
       raw: R`PS> Get-MailboxStatistics maria.costa@contoso.com | fl DisplayName,TotalItemSize,ItemCount

DisplayName   : Maria Costa
TotalItemSize : 49.61 GB (53,268,331,889 bytes)
ItemCount     : 412,806

PS> Get-Mailbox maria.costa@contoso.com | fl IssueWarningQuota,ProhibitSendQuota,ProhibitSendReceiveQuota

IssueWarningQuota        : 49 GB (52,613,349,376 bytes)
ProhibitSendQuota        : 49.5 GB (53,150,220,288 bytes)
ProhibitSendReceiveQuota : 50 GB (53,687,091,200 bytes)`}]},
    {title: "Find the cause", sub: "Nowhere for old mail to go", ph: 5,
     what: "Maria's licence includes a separate online archive for old mail, and the company's retention policy is set up to move anything over two years old into it automatically. But her archive was never switched on, so for eleven years everything has stayed in the main mailbox.",
     check: "Check ArchiveStatus. 'None' means there's no archive, so the retention policy has nowhere to move old mail.",
     tech: "ArchiveStatus None; RetentionPolicy 'Default MRM Policy' (includes 'Default 2 year move to archive'). With no archive mailbox, the move-to-archive tag has no effect. Deleted Items holds just 0.08 GB.",
     msgs: [{from: "desk", to: "exo", label: "Is there an archive?", kind: "normal"}, {from: "exo", to: "desk", label: "ArchiveStatus: None", kind: "data"}],
     callout: "No archive for old mail", fault: ["arch"],
     cmds: {win: R`Get-Mailbox maria.costa@contoso.com | Format-List ArchiveStatus, RetentionPolicy
Get-MailboxFolderStatistics maria.costa@contoso.com -FolderScope DeletedItems | Format-Table Name, FolderSize`, nix: R`Exchange admin centre
  › Recipients › Mailboxes › Maria Costa
  › Others › Mailbox archive (shows whether it's on)`},
     evidence: [{t: "13:12:00", src: "Exchange Online · PowerShell", title: "ArchiveStatus None: the 2-year move-to-archive policy has nowhere to put anything", sev: "clue", kind: "cmd",
       fields: [["ArchiveStatus", "None", "Never switched on"], ["RetentionPolicy", "Default MRM Policy", "Would move mail over 2 years old, if there were an archive"], ["Deleted Items", "0.08 GB", "She already keeps it tidy"]],
       raw: R`PS> Get-Mailbox maria.costa@contoso.com | fl ArchiveStatus,RetentionPolicy

ArchiveStatus   : None
RetentionPolicy : Default MRM Policy

PS> Get-MailboxFolderStatistics maria.costa@contoso.com -FolderScope DeletedItems | ft Name,FolderSize

Name          FolderSize
----          ----------
Deleted Items 81.4 MB (85,354,906 bytes)`}]},
    {title: "Three o'clock comes", sub: "The contract doesn't go", ph: 7,
     what: "At five to three Maria tries to send the contract. Outlook still says her mailbox is full and the message sits in her Outbox. The client is still waiting.",
     check: "The mailbox size hasn't dropped below 49.5 GB, so sending is still blocked.",
     tech: "Outlook InfoBar: mailbox full. Message held in Outbox. TotalItemSize still above ProhibitSendQuota.",
     msgs: [{from: "lap", to: "exo", label: "Send contract", kind: "normal"}, {from: "exo", to: "lap", label: "Mailbox full: can't send", kind: "bad"}],
     callout: "Can't send the contract", fault: ["exo"],
     evidence: [{t: "14:55:30", src: "Maria's Outlook", title: "Mailbox full: contract stuck in the Outbox at 14:55", sev: "err", kind: "screen",
       fields: [["InfoBar", "Mailbox full", ""], ["Outbox", "1 item", "The contract"]],
       raw: R`Outlook · 03/12/2026 14:55
MAILBOX FULL  Your mailbox is full. You might not be able to send or receive items.
Outbox (1):  "Contract – Harbour Street lease – for signature"`}]}
  ],
  fixed: [0, 1, 2, 3, 4,
    {title: "Old mail moves to the archive", sub: "Mail over two years old, out of the main mailbox", ph: 6,
     what: "With the archive switched on, the retention policy finally has somewhere to put old mail. Exchange starts moving everything over two years old into the archive. Maria's main mailbox shrinks, and nothing is deleted.",
     check: "Watch the main mailbox shrink and the archive grow with Get-MailboxStatistics (add -Archive for the archive). Once it's under 49.5 GB, she can send.",
     tech: "Enable-Mailbox -Archive; Start-ManagedFolderAssistant. By 14:28 the primary mailbox is 41.2 GB and the archive 8.4 GB, still growing. Large moves can take a day or two to finish.",
     msgs: [{from: "exo", to: "arch", label: "Move mail over 2 years old", kind: "fix"}, {from: "arch", to: "exo", label: "8.4 GB moved so far", kind: "data"}],
     callout: "Back under the limit",
     cmds: {win: R`Enable-Mailbox maria.costa@contoso.com -Archive
Start-ManagedFolderAssistant -Identity maria.costa@contoso.com

# Watch it work
Get-MailboxStatistics maria.costa@contoso.com | Format-List TotalItemSize
Get-MailboxStatistics maria.costa@contoso.com -Archive | Format-List TotalItemSize`, nix: R`Exchange admin centre
  › Recipients › Mailboxes › Maria Costa
  › Others › Manage mailbox archive › On › Save

Then in Outlook: the "Online Archive" folder appears under her
mailbox, and old mail starts showing up there.`},
     evidence: [{t: "14:28:00", src: "Exchange Online · PowerShell", title: "Main mailbox down to 41.2 GB; archive 8.4 GB and growing", sev: "ok", kind: "cmd",
       fields: [["Mailbox", "41.2 GB", "Well under 49.5 GB"], ["Archive", "8.4 GB", "Still searchable, still retained"]],
       raw: R`PS> Get-MailboxStatistics maria.costa@contoso.com | fl TotalItemSize
TotalItemSize : 41.2 GB (44,237,162,496 bytes)

PS> Get-MailboxStatistics maria.costa@contoso.com -Archive | fl TotalItemSize
TotalItemSize : 8.4 GB (9,019,431,322 bytes)`}]},
    {title: "The contract goes at 14:35", sub: "Confirm, explain the archive, close", ph: 7,
     what: "Maria sends the contract and the client receives it. You show her where the Online Archive appears in Outlook, so she knows her old mail is still there, then close the ticket. You also check whether anyone else in Legal is heading the same way.",
     check: "Confirm with a real send, and show the user where their old mail has gone, otherwise you'll get a 'my emails have vanished' ticket tomorrow.",
     tech: "Message trace: Delivered 14:35. Report of mailboxes over 45 GB with no archive: three more in Legal, raised as CHG-1142.",
     msgs: [{from: "lap", to: "exo", label: "Send contract", kind: "normal"}, {from: "exo", to: "client", label: "Contract delivered", kind: "fix"}, {from: "maria", to: "desk", label: "Sent! Thank you", kind: "data"}],
     evidence: [{t: "14:35:40", src: "Exchange Online · message trace", title: "Contract delivered to the client at 14:35", sev: "ok", kind: "cmd",
       fields: [["Status", "Delivered", "25 minutes before the deadline"], ["Follow-up", "CHG-1142", "Three more Legal mailboxes over 45 GB"]],
       raw: R`Received             SenderAddress              Subject                                          Status
03/12/2026 14:35:22  maria.costa@contoso.com    Contract – Harbour Street lease – for signature  Delivered

INC-31933 Resolved 14:50 (Maria confirmed). CHG-1142: enable archives for Legal.`}]}
  ],
  fixes: [
    {id: "deleted", kind: "herring", name: "Empty her Deleted Items", short: "Empty Deleted Items", at: 5,
     desc: "Clear out Deleted Items to free up some space.",
     result: "Her Deleted Items folder only holds 81 MB, because she already keeps it tidy. Emptying it leaves her at 49.53 GB: still over the 49.5 GB line, still unable to send.",
     ev: {t: "13:15:30", src: "Exchange Online · PowerShell", title: "Deleted Items emptied: 49.53 GB, still over the send limit", sev: "warn", kind: "cmd", fields: [["TotalItemSize", "49.53 GB", "Still over 49.5 GB"]], raw: R`PS> Get-MailboxStatistics maria.costa@contoso.com | fl TotalItemSize
TotalItemSize : 49.53 GB (53,182,428,569 bytes)`}},
    {id: "pst", kind: "herring", name: "Export her old mail to a PST file on her laptop", short: "Export to PST", at: 5,
     desc: "Export years of old mail to a PST on her laptop, then delete it from the mailbox.",
     result: "The export would take hours, so the contract still doesn't go at three. Worse, eleven years of legal correspondence would end up in a file on one laptop: outside retention, outside backups and invisible to legal searches. That's why company policy blocks PST files.",
     ev: {t: "13:18:10", src: "Intune · Outlook policy", title: "PST files are blocked by policy for all users", sev: "warn", kind: "screen", fields: [["Setting", "Prevent users from adding PSTs to Outlook profiles", "Enabled"], ["Why", "Mail must stay in retention and backup", ""]], raw: R`Configuration profile: Outlook – Data protection
  Prevent users from adding PSTs to Outlook profiles ... Enabled
  Assigned to: All users`}},
    {id: "archive", kind: "fix", name: "Switch on her online archive and run the retention policy", short: "Online archive", at: 6,
     desc: "Enable the archive that comes with her licence; the default policy then moves mail older than two years out of the main mailbox.",
     result: "Within the hour, enough old case mail has moved into the archive, where it's still searchable and still kept, for her mailbox to drop well under the limit and the contract to go. The rest moves over the next day.",
     ev: {t: "13:20:00", src: "Exchange Online · PowerShell", title: "Archive enabled; Managed Folder Assistant started", sev: "info", kind: "cmd", fields: [["ArchiveStatus", "Active", ""], ["Policy", "Default 2 year move to archive", "Now has somewhere to move mail to"]], raw: R`PS> Enable-Mailbox maria.costa@contoso.com -Archive
PS> Start-ManagedFolderAssistant -Identity maria.costa@contoso.com
PS> Get-Mailbox maria.costa@contoso.com | fl ArchiveStatus

ArchiveStatus : Active`}}
  ],
  verify: [
    {t: "Light touch: check her name and extension against the directory. Nothing about her sign-in or access is changing", ok: true, why: "Verification should match the risk. Turning on her archive gives nobody new access, so a quick check is enough. Save the heavy checks for resets and permissions."},
    {t: "Full callback and manager approval, as for an MFA reset", why: "Not wrong, but it costs time she hasn't got for a change that gives nobody new access. Keeping strict checks for risky changes is what keeps them taken seriously."},
    {t: "Ask her to read out her password so you can sign in and look", why: "Never. Nobody at the desk should ever ask for, or know, a user's password."}
  ],
  triage: [
    {t: "P3, worked straight away: one user, but a 3pm deadline and she'll stop receiving client mail at 50 GB", ok: true, why: "Impact is one person, so P3 on the matrix, but the urgency is real. Good desks take a P3 with a deadline next, and write the deadline on the ticket."},
    {t: "P1 · Legal can't send contracts", why: "It's one person in Legal, not the department. P1 is for lots of people or a critical service down."},
    {t: "P4 · tell her to tidy her mailbox", why: "She can't delete: it's case material she has to keep. And she's 390 MB away from clients' emails bouncing."}
  ],
  notes: [
    {t: "Maria couldn't send: mailbox 49.61 GB, over the 49.5 GB send limit (Business Standard, 50 GB max). No archive enabled. Mail must be kept (retention), so no deleting. Enabled online archive and started the Managed Folder Assistant; Default MRM Policy moves items over 2 years old. 14:28: mailbox 41.2 GB, archive 8.4 GB and growing. Contract sent 14:35. Showed Maria the Online Archive folder. Report found 3 more Legal mailboxes over 45 GB without archives: CHG-1142.", ok: true, why: "Numbers, cause, why deleting wasn't an option, the exact fix and the proof, plus the three other mailboxes heading the same way. That last line saves three future tickets."},
    {t: "Cleared some space.", why: "What space? From where? In Legal, 'deleted some mail' is a sentence that gets looked at very closely."},
    {t: "Exported old mail to a PST on her laptop.", why: "Records a fix that moved legal records outside retention and backup. If they're ever needed in a dispute, nobody will be able to find them."}
  ],
  debrief: {
    check: ["Get-MailboxStatistics: TotalItemSize compared with ProhibitSendQuota", "Get-Mailbox … ArchiveStatus: is there an archive?", "Does the mail have to be kept? That rules out deleting"],
    fix: ["Enable-Mailbox -Archive, then Start-ManagedFolderAssistant", "Check the retention policy has a 'move to archive' tag"],
    prevent: ["Switch archives on for everyone as part of the joiner process", "Alert at the 49 GB warning, not at the 49.5 GB hard stop", "Block PSTs: they take mail out of retention and backup"]
  },
  tell: "Outlook says the mailbox is full, the size is over 49.5 GB, and there's no archive enabled. The user can't delete because the mail has to be kept."
},

/* ============ 7. PRINTER OFFLINE ============ */
{
  id: "printer-offline", cat: "printing", name: "Printer says offline", sub: "It's on, it's got paper, it's 'offline'",
  impact: "Floor 2 · about 30 people", systems: ["Print server", "DHCP", "Network printer"],
  cause: "After two weeks switched off, the printer got a new IP address, and the print server still points at the old one",
  fail: "Still offline",
  ticket: {ref: "INC-31950", from: "Chris Bell · Floor 2 office manager", via: "Teams chat", text: "The big printer on Floor 2 got fixed yesterday after being broken for two weeks. Now it says offline for everyone. It's switched on, it's got paper, the screen looks normal. Help!"},
  intro: "The Floor 2 printer was switched off for twelve days waiting for a part. While it was off, its loan of an IP address ran out and the address went to someone else. When the engineer switched it back on, it was given a new address. The print server still sends every job to the old one, where nothing answers, so Windows says the printer is offline.",
  summary: "PRN-FL2-01 is a DHCP client with no reservation. Powered off for 12 days with an 8-day lease, its lease on 10.20.10.40 expired and the address was leased to a visitor laptop. On power-up DHCP offered 10.20.10.163. The shared queue FL2-Mono on PRINT01 uses Standard TCP/IP port IP_10.20.10.40 (RAW, 9100). TCP to 10.20.10.40:9100 fails, jobs back up and the queue shows Offline. Fix: clear the stale lease, reserve 10.20.10.40 for the printer's MAC and power-cycle it (or point the port at the new address and reserve that).",
  facts: [["Symptom", "Printer 'offline' for everyone; jobs stuck"], ["Root cause", "New IP from DHCP; print server port still on the old one"], ["Who's affected", "Floor 2, about 30 people"], ["Key evidence", "Port → 10.20.10.40; printer's screen and DHCP say .163"]],
  nodes: [
    {id: "desk", kind: "agent", label: "Service desk", sub: "You · 1st line", x: 120, y: 170},
    {id: "chris", kind: "user", label: "Chris Bell", sub: "Floor 2 office manager", x: 120, y: 450},
    {id: "pcs", kind: "laptop", label: "Floor 2 PCs", sub: "30 people printing", x: 370, y: 450},
    {id: "prs", kind: "server", label: "PRINT01", sub: "Queue FL2-Mono → 10.20.10.40", x: 620, y: 300},
    {id: "old", kind: "printer", label: "10.20.10.40", sub: "Nothing answers here", x: 880, y: 160, ghost: true},
    {id: "prn", kind: "printer", label: "PRN-FL2-01", sub: "Actually at 10.20.10.163", x: 900, y: 460},
    {id: "dhcp", kind: "dc", label: "DC01", sub: "DHCP server", x: 640, y: 620}
  ],
  links: [["desk", "chris"], ["chris", "pcs"], ["pcs", "prs"], ["prs", "old"], ["prs", "prn"], ["dhcp", "prn"], ["desk", "prs"], ["desk", "dhcp"]],
  lanes: ["desk", "chris", "pcs", "prs", "old", "prn", "dhcp"],
  stage: 5,
  steps: [
    {title: "Chris messages the desk", sub: "\"Offline for everyone\"", ph: 1,
     what: "Chris, the Floor 2 office manager, messages on Teams: the big printer was repaired yesterday after two weeks out of action, and now it says offline on everyone's PC. It's on, it has paper and its screen looks normal.",
     check: "'Everyone' and 'since it was fixed' are your two biggest clues. Something changed with the printer itself, not with thirty PCs.",
     tech: "One ticket logged for the floor; duplicates from other Floor 2 users get linked to it rather than worked separately.",
     msgs: [{from: "chris", to: "desk", label: "Printer offline for everyone", kind: "normal"}],
     evidence: [{t: "09:10:00", src: "Service desk · ticket", title: "INC-31950 logged: Floor 2 printer offline for all users since its repair", sev: "info", kind: "ticket",
       fields: [["Caller", "Chris Bell, Floor 2", "Teams chat"], ["Scope", "Everyone on Floor 2", "Not one PC"], ["Changed", "Repaired yesterday after 2 weeks off", "The big clue"]],
       raw: R`INC-31950   Logged 01/12/2026 09:10   Teams
Caller:    Chris Bell (Floor 2 office manager)
Category:  Printing › Network printer
Summary:   PRN-FL2-01 shows Offline for all of Floor 2.
           Repaired yesterday (fuser) after ~2 weeks out of service.`}]},
    {title: "No identity check needed", sub: "Nobody's access is changing", ph: 2,
     what: "Nothing about anyone's account, password or access is going to change here, so there's nothing to verify. You spend the time on the useful questions instead: which printer, since when, and what does its screen say?",
     check: "Verification protects accounts and access. A printer that's offline for a whole floor isn't a risk to anyone's identity.",
     tech: "No credential, MFA or permission change in scope. Facts gathered instead: printer asset tag PRN-FL2-01, offline since power-on yesterday ~16:40.",
     msgs: [{from: "desk", to: "chris", label: "Which printer? Since when?", kind: "normal"}, {from: "chris", to: "desk", label: "PRN-FL2-01, since yesterday", kind: "data"}],
     evidence: [{t: "09:11:00", src: "Service desk · ticket note", title: "No account change in scope; facts gathered", sev: "ok", kind: "ticket",
       fields: [["Printer", "PRN-FL2-01", ""], ["Since", "Power-on yesterday ~16:40", ""]],
       raw: R`01/12/2026 09:11  No identity verification needed (no account/access change).
Printer PRN-FL2-01, offline since engineer powered it on ~16:40 yesterday.`}]},
    {title: "Triage", sub: "Thirty people, with a workaround", ph: 3,
     what: "Around thirty people can't print, which is a lot of people. But there's a working printer one floor up, so nobody's completely stuck. That makes it a P3, owned by the service desk, with the Floor 3 printer as the workaround.",
     check: "Lots of users raises the impact; a workaround lowers the urgency. Without the Floor 3 printer, this would be a P2.",
     tech: "Impact medium (≈30 users), urgency low-medium (workaround: FL3-Mono) → P3. Duplicate tickets linked to INC-31950.",
     msgs: [], focus: ["desk"], callout: "P3 · workaround: Floor 3 printer",
     evidence: [{t: "09:12:00", src: "Service desk · ticket", title: "Priority P3; workaround FL3-Mono; 4 duplicates linked", sev: "info", kind: "ticket",
       fields: [["Priority", "P3", "Many users, but a workaround"], ["Linked", "4 duplicate tickets", "One ticket for one fault"]],
       raw: R`01/12/2026 09:12  Priority P3. Workaround: print to FL3-Mono (Floor 3).
Linked duplicates: INC-31951, INC-31953, INC-31954, INC-31956.`}]},
    {title: "Follow a print job", sub: "It reaches the server, then goes nowhere", ph: 4,
     what: "You follow one job. It leaves a Floor 2 PC and arrives at the print server fine. The server then tries to send it to the printer at 10.20.10.40, the address it has always used. Nothing answers, the jobs pile up, and the queue shows Offline.",
     check: "On the print server, check the queue's status and which address its port points to, then test whether anything answers on that address on port 9100.",
     tech: "Get-Printer FL2-Mono: PrinterStatus Offline, JobCount 23, PortName IP_10.20.10.40. Test-NetConnection 10.20.10.40 -Port 9100: ping and TCP both fail.",
     msgs: [{from: "pcs", to: "prs", label: "Print: Q3 report", kind: "normal"}, {from: "prs", to: "old", label: "Job → 10.20.10.40:9100", kind: "normal", lost: "No answer"}],
     cmds: {win: R`# On PRINT01
Get-Printer -Name FL2-Mono | Format-List Name, PrinterStatus, PortName, JobCount
Get-PrinterPort -Name IP_10.20.10.40 | Format-List Name, PrinterHostAddress, PortNumber
Test-NetConnection 10.20.10.40 -Port 9100`, nix: R`Print Management on PRINT01
  › Print Servers › PRINT01 › Printers › FL2-Mono
  › Properties › Ports tab (which IP is it sending to?)
  › Open queue (how many jobs are stuck?)`},
     evidence: [{t: "09:15:30", src: "PRINT01 · PowerShell", title: "FL2-Mono offline, 23 jobs stuck; nothing answers at 10.20.10.40:9100", sev: "err", kind: "cmd",
       fields: [["PrinterStatus", "Offline", ""], ["Port", "IP_10.20.10.40", "Where the server sends jobs"], ["TcpTestSucceeded", "False", "Nothing listening at that address"]],
       raw: R`PS C:\> Get-Printer -Name FL2-Mono | fl Name,PrinterStatus,PortName,JobCount

Name          : FL2-Mono
PrinterStatus : Offline
PortName      : IP_10.20.10.40
JobCount      : 23

PS C:\> Test-NetConnection 10.20.10.40 -Port 9100
WARNING: TCP connect to (10.20.10.40 : 9100) failed
WARNING: Ping to 10.20.10.40 failed with status: TimedOut

ComputerName     : 10.20.10.40
RemotePort       : 9100
PingSucceeded    : False
TcpTestSucceeded : False`}]},
    {title: "Where is the printer really?", sub: "It moved address while it was off", ph: 5,
     what: "Chris reads the IP address off the printer's screen: 10.20.10.163. The DHCP server agrees: it gave the printer that address yesterday afternoon. While the printer was off, its loan on 10.20.10.40 ran out and that address went to a visitor's laptop. The printer is fine; it's just living somewhere else.",
     check: "Compare the address on the printer's own screen (or config page) with the address the print server's port uses. If they differ, there's your fault.",
     tech: "Get-DhcpServerv4Lease: PRN-FL2-01 (00-00-5e-00-53-71) Active on 10.20.10.163 since 30/11 16:41. 10.20.10.40 leased to VISITOR-LT07 until 04/12. No reservation exists for the printer.",
     msgs: [{from: "chris", to: "desk", label: "Screen says 10.20.10.163", kind: "data"}, {from: "desk", to: "dhcp", label: "Lease for the printer's MAC?", kind: "normal"}, {from: "dhcp", to: "desk", label: "10.20.10.163 since yesterday", kind: "data"}],
     callout: "It moved address", fault: ["old"],
     cmds: {win: R`Get-DhcpServerv4Lease -ComputerName DC01 -ScopeId 10.20.10.0 |
  Where-Object { $_.ClientId -eq "00-00-5e-00-53-71" -or $_.IPAddress -eq "10.20.10.40" } |
  Format-Table IPAddress, ClientId, HostName, AddressState, LeaseExpiryTime`, nix: R`On the printer: Menu › Network › TCP/IP (or print a config page)

DHCP console on DC01
  › IPv4 › Scope [10.20.10.0] › Address Leases
  › find the printer's MAC address`},
     evidence: [{t: "09:19:40", src: "DC01 · DHCP", title: "Printer now leases 10.20.10.163; .40 belongs to a visitor laptop; no reservation", sev: "clue", kind: "cmd",
       fields: [["PRN-FL2-01", "10.20.10.163", "Since yesterday 16:41"], ["10.20.10.40", "VISITOR-LT07", "The old address went to someone else"], ["Reservation", "None", "Why it could move at all"]],
       raw: R`PS C:\> Get-DhcpServerv4Lease -ComputerName DC01 -ScopeId 10.20.10.0 | ? {...} | ft IPAddress,ClientId,HostName,AddressState,LeaseExpiryTime

IPAddress     ClientId           HostName       AddressState LeaseExpiryTime
---------     --------           --------       ------------ ---------------
10.20.10.40   00-00-5e-00-53-0c  VISITOR-LT07   Active       04/12/2026 11:02:17
10.20.10.163  00-00-5e-00-53-71  PRN-FL2-01     Active       08/12/2026 16:41:05`}]},
    {title: "Still offline", sub: "41 jobs and counting", ph: 7,
     what: "By quarter to ten the queue has 41 jobs in it and Floor 2 is trooping upstairs to print. Every job still heads for 10.20.10.40, and nothing there is a printer.",
     check: "If the port still points at an address nothing answers on, the queue stays offline, whatever else you change.",
     tech: "FL2-Mono PrinterStatus Offline, JobCount 41, port unchanged.",
     msgs: [{from: "pcs", to: "prs", label: "Print again", kind: "normal"}, {from: "prs", to: "old", label: "Job → 10.20.10.40", kind: "normal", lost: "No answer"}],
     callout: "Still offline",
     evidence: [{t: "09:45:00", src: "PRINT01 · PowerShell", title: "FL2-Mono still offline, now 41 jobs queued", sev: "err", kind: "cmd",
       fields: [["JobCount", "41", ""], ["PortName", "IP_10.20.10.40", "Unchanged"]],
       raw: R`PS C:\> Get-Printer -Name FL2-Mono | fl PrinterStatus,PortName,JobCount
PrinterStatus : Offline
PortName      : IP_10.20.10.40
JobCount      : 41`}]}
  ],
  fixed: [0, 1, 2, 3, 4,
    {title: "Back where it belongs", sub: "Reserved address, port matches", ph: 6,
     what: "With the old lease cleared and 10.20.10.40 reserved for the printer's MAC address, you power-cycle the printer. It asks DHCP for an address and gets 10.20.10.40 again, the address the print server expects. Something finally answers on port 9100.",
     check: "Test-NetConnection to 10.20.10.40 on port 9100 should now succeed, and the queue status should change from Offline.",
     tech: "Printer renews and receives the reserved 10.20.10.40. TcpTestSucceeded True; PRINT01 starts sending queued jobs.",
     msgs: [{from: "prn", to: "dhcp", label: "DHCP: address please", kind: "normal"}, {from: "dhcp", to: "prn", label: "10.20.10.40 (reserved)", kind: "fix"}, {from: "prs", to: "prn", label: "Job → 10.20.10.40:9100", kind: "fix"}],
     callout: "Printer back on .40",
     cmds: {win: R`# Clear the old lease, reserve the address for the printer's MAC, then power-cycle the printer
Remove-DhcpServerv4Lease -ComputerName DC01 -IPAddress 10.20.10.40
Add-DhcpServerv4Reservation -ComputerName DC01 -ScopeId 10.20.10.0 -IPAddress 10.20.10.40 -ClientId "00-00-5e-00-53-71" -Name "PRN-FL2-01" -Description "Floor 2 printer"

Test-NetConnection 10.20.10.40 -Port 9100`, nix: R`DHCP console on DC01
  › IPv4 › Scope [10.20.10.0] › Address Leases
  › delete the stale lease on 10.20.10.40
  › Reservations › New Reservation
      IP 10.20.10.40 · MAC 00-00-5e-00-53-71 · Name PRN-FL2-01

Then switch the printer off and on again.`},
     evidence: [{t: "09:36:10", src: "PRINT01 · PowerShell", title: "10.20.10.40:9100 answers: the printer is back", sev: "ok", kind: "cmd",
       fields: [["TcpTestSucceeded", "True", "The printer is listening"], ["Address", "10.20.10.40 (reserved)", "And it'll stay there"]],
       raw: R`PS C:\> Test-NetConnection 10.20.10.40 -Port 9100

ComputerName     : 10.20.10.40
RemotePort       : 9100
PingSucceeded    : True
TcpTestSucceeded : True`}]},
    {title: "Floor 2 prints", sub: "Queue drained, Chris confirms", ph: 7,
     what: "The 23 stuck jobs come out of the printer (Floor 2 has a sort-out), new jobs print straight away, and Chris confirms everyone's printing. You close the main ticket and the duplicates, and raise a change to give the other network printers reservations too.",
     check: "Check the queue is empty and ask someone to print something new, not just watch the backlog clear.",
     tech: "FL2-Mono PrinterStatus Normal, JobCount 0. Audit of network printers: 4 more without reservations → CHG-1150.",
     msgs: [{from: "pcs", to: "prs", label: "Print", kind: "normal"}, {from: "prs", to: "prn", label: "Printing", kind: "fix"}, {from: "chris", to: "desk", label: "Everyone's printing!", kind: "data"}],
     evidence: [{t: "09:48:00", src: "PRINT01 · PowerShell", title: "FL2-Mono Normal, queue empty; INC-31950 and duplicates resolved", sev: "ok", kind: "cmd",
       fields: [["PrinterStatus", "Normal", ""], ["JobCount", "0", "Backlog printed"], ["Follow-up", "CHG-1150", "4 more printers without reservations"]],
       raw: R`PS C:\> Get-Printer -Name FL2-Mono | fl PrinterStatus,JobCount
PrinterStatus : Normal
JobCount      : 0

INC-31950 Resolved 09:50 (Chris confirmed). Linked duplicates closed.
CHG-1150 raised: DHCP reservations for remaining network printers.`}]}
  ],
  fixes: [
    {id: "driver", kind: "herring", name: "Reinstall the printer driver", short: "Reinstall driver", at: 5,
     desc: "Remove and reinstall the driver on the print server and a couple of PCs.",
     result: "The driver turns documents into the printer's language, and that part was working: jobs reached the queue fine. They just can't get from the print server to an address nothing is listening on.",
     ev: {t: "09:25:00", src: "PRINT01 · Print Management", title: "Driver reinstalled; FL2-Mono still offline", sev: "warn", kind: "screen", fields: [["Driver", "Reinstalled", "It was never the problem"], ["Status", "Offline", "Unchanged"]], raw: R`Print Management › Drivers › removed and re-added "Universal Mono PCL6"
FL2-Mono › Status: Offline · Jobs: 31 · Port: IP_10.20.10.40`}},
    {id: "spooler", kind: "herring", name: "Restart the Print Spooler on PRINT01", short: "Restart spooler", at: 5,
     desc: "Restart the Print Spooler service to clear the stuck queue.",
     result: "The service restarts, people print again, and every job heads straight back to 10.20.10.40. Nothing answers, so it's offline again within a minute.",
     ev: {t: "09:27:30", src: "PRINT01 · PowerShell", title: "Spooler restarted; offline again within a minute", sev: "warn", kind: "cmd", fields: [["PrinterStatus", "Offline", "Again"]], raw: R`PS C:\> Restart-Service Spooler
PS C:\> Start-Sleep 60; Get-Printer -Name FL2-Mono | fl PrinterStatus,JobCount
PrinterStatus : Offline
JobCount      : 6`}},
    {id: "reserve", kind: "fix", name: "Reserve the printer's address in DHCP and restart it", short: "DHCP reservation", at: 6,
     desc: "Clear the stale lease on 10.20.10.40, reserve that address for the printer's MAC, then power-cycle the printer so it picks it up.",
     result: "The printer comes back on 10.20.10.40, the address the print server expects. The queue drains, and the reservation means it can never wander off again.",
     ev: {t: "09:31:00", src: "DC01 · DHCP", title: "Stale lease removed; 10.20.10.40 reserved for PRN-FL2-01", sev: "info", kind: "cmd", fields: [["Reservation", "10.20.10.40 → 00-00-5e-00-53-71", "Same address, every time"]], raw: R`PS C:\> Remove-DhcpServerv4Lease -ComputerName DC01 -IPAddress 10.20.10.40
PS C:\> Add-DhcpServerv4Reservation -ComputerName DC01 -ScopeId 10.20.10.0 -IPAddress 10.20.10.40 -ClientId "00-00-5e-00-53-71" -Name "PRN-FL2-01"
(printer power-cycled 09:33)`}}
  ],
  verify: [
    {t: "No identity check needed: nobody's account or access is changing. Just confirm which printer and since when", ok: true, why: "Verification protects accounts and access. A printer offline for a whole floor isn't a risk to anyone's identity, so skip the ceremony and gather the facts."},
    {t: "Call Chris back on her mobile on file before doing anything", why: "Harmless, but wasted time: there's nothing about Chris's account to protect. Spend it on the printer."},
    {t: "Ask Chris for her password so you can test printing as her", why: "Never ask for a password. If you need to test as a user, use a test account, or remote assistance with them at the keyboard."}
  ],
  triage: [
    {t: "P3 · about 30 people affected, but there's a workaround (the Floor 3 printer). Service desk owns it", ok: true, why: "Many users raises the impact, but a working printer one floor up keeps people going. Without the workaround it would be a P2."},
    {t: "P1 · a whole floor can't print", why: "P1 is for critical services down with no workaround: email, the network, a key business app. A walk upstairs is a workaround."},
    {t: "P4 · it's just printing", why: "Thirty people losing time adds up, and it'll be a flood of duplicate tickets by lunch. Log one, link the rest, work it properly."}
  ],
  notes: [
    {t: "PRN-FL2-01 offline for Floor 2 after its repair. Printer was off ~12 days; its DHCP lease expired and it came back on 10.20.10.163. Queue FL2-Mono on PRINT01 points at port IP_10.20.10.40, so jobs failed (TCP 9100, no answer). Removed stale lease on .40, added DHCP reservation .40 → 00-00-5e-00-53-71, power-cycled printer. Test page OK 09:36, queue drained. Chris confirmed. CHG-1150: 4 more network printers have no reservation.", ok: true, why: "Cause, evidence, exact change and proof, plus the four other printers waiting to do the same thing. The next 'printer offline' ticket takes five minutes because of this note."},
    {t: "Restarted spooler and reinstalled driver, printer now working.", why: "Neither of those fixed it. Next time someone will repeat both and lose another hour."},
    {t: "Printer back online.", why: "Why was it offline? The real cause (no reservation) is still there, waiting for the next long power-off."}
  ],
  debrief: {
    check: ["On the printer's screen or config page: what IP address does it actually have?", "On the print server: which IP does the printer's port point to (Get-PrinterPort)?", "Test-NetConnection <port IP> -Port 9100: does anything answer?"],
    fix: ["Give the printer a DHCP reservation (or a static IP outside the pool) and make the port match", "Power-cycle the printer, print a test page, let the queue drain"],
    prevent: ["Every network printer gets a reservation, recorded in the asset register", "Point printer ports at a DNS name rather than a raw IP"]
  },
  tell: "The printer is switched on and healthy, but its real IP address is different from the one the print server's port points at, so jobs queue up and fail to connect on port 9100."
},

/* ============ 8. NEW STARTER, NO EMAIL ============ */
{
  id: "new-starter", cat: "accounts", name: "New starter, no email", sub: "She can sign in, but there's no mailbox",
  impact: "One user · day one, Finance", systems: ["Active Directory", "Entra Connect", "Entra ID licensing", "Exchange Online"],
  cause: "She was never added to the licensing group, so she has no Microsoft 365 licence and no mailbox",
  fail: "Still no mailbox",
  ticket: {ref: "INC-31968", from: "Leah Park · Finance manager", via: "Phone call", text: "My new starter Sam Kaur is sat next to me. She's logged into her laptop fine but Outlook says it can't find her mailbox and Teams won't load. It's her first day, not a great look!"},
  intro: "Sam's account was created on Friday from the new-starter form. Her password works, so she can sign in to her laptop. But Microsoft 365 only creates a mailbox, Teams and OneDrive when the user has a licence, and here licences come from being in a group. Sam was never added to it, so as far as Microsoft 365 is concerned she has no services at all.",
  summary: "Contoso uses group-based licensing: members of the Entra ID group LIC-M365-BusinessStandard get the Microsoft 365 Business Standard licence (SKU O365_BUSINESS_PREMIUM). Sam's AD account, created from the starter form rather than the Finance template, synced to Entra ID via Entra Connect but isn't in the group. Get-MgUserLicenseDetail returns nothing and Get-Mailbox can't find her. Adding her to the group assigns the licence; Exchange Online provisions the mailbox, usually within minutes, and Outlook and Teams work after a restart.",
  facts: [["Symptom", "Signs in fine; Outlook can't find a mailbox, Teams won't load"], ["Root cause", "Not in the licensing group: no licence, no mailbox"], ["Who's affected", "One new starter"], ["Key evidence", "No licences assigned; Get-Mailbox: object couldn't be found"]],
  nodes: [
    {id: "desk", kind: "agent", label: "Service desk", sub: "You · 1st line", x: 120, y: 170},
    {id: "leah", kind: "user", label: "Leah Park", sub: "Finance manager", x: 120, y: 450},
    {id: "sam", kind: "user", label: "Sam Kaur", sub: "New starter · day 1", x: 330, y: 640},
    {id: "lap", kind: "laptop", label: "Sam's laptop", sub: "Windows sign-in ✓", x: 380, y: 400},
    {id: "ad", kind: "dc", label: "DC01", sub: "Account created Friday", x: 640, y: 170},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "Synced · no licence", x: 640, y: 450},
    {id: "exo", kind: "mail", label: "Exchange Online", sub: "No mailbox for Sam", x: 900, y: 450}
  ],
  links: [["desk", "leah"], ["leah", "sam"], ["sam", "lap"], ["lap", "ad"], ["ad", "entra"], ["lap", "entra"], ["entra", "exo"], ["desk", "entra"]],
  lanes: ["desk", "leah", "sam", "lap", "ad", "entra", "exo"],
  stage: 5,
  steps: [
    {title: "Leah rings the desk", sub: "\"It's her first day\"", ph: 1,
     what: "Leah, a Finance manager, calls with her new starter Sam sat beside her. Sam signed in to her laptop without a problem, but Outlook says it can't find her mailbox and Teams won't load. It's day one.",
     check: "'Signs in fine, but no mailbox' already rules out the password and the account itself. Something is missing on the Microsoft 365 side.",
     tech: "Account sam.kaur created Fri 27/11 from the new-starter form. Windows sign-in OK (AD). Outlook: cannot find mailbox. Teams: unlicensed.",
     msgs: [{from: "leah", to: "desk", label: "New starter has no email", kind: "normal"}],
     evidence: [{t: "09:32:00", src: "Service desk · ticket", title: "INC-31968 logged: new starter signs in but has no mailbox or Teams", sev: "info", kind: "ticket",
       fields: [["Caller", "Leah Park (Finance manager)", "Ringing for her new starter"], ["User", "Sam Kaur", "Day one"], ["Works", "Windows sign-in", "So the account and password are fine"]],
       raw: R`INC-31968   Logged 30/11/2026 09:32   Phone
Caller:    Leah Park (Finance manager), ext 4120, for Sam Kaur (new starter, today)
Category:  Accounts › New starter
Summary:   Laptop sign-in fine. Outlook "can't find mailbox". Teams won't load.`}]},
    {title: "Check it's genuine", sub: "Sam has nothing on file yet", ph: 2,
     what: "Sam is brand new, so there's nothing to verify her against yet. You lean on people and records that already exist instead: you ring Leah back on her extension from the directory, and check Sam is on HR's start list for today.",
     check: "When the person has no history, verify through someone who does (their manager, on a number you hold) and through HR's records.",
     tech: "Callback to ext 4120 (directory: Leah Park). HR joiner list for 30/11 includes Sam Kaur, Finance, reporting to Leah Park.",
     msgs: [{from: "desk", to: "leah", label: "Calling back on ext 4120", kind: "normal"}, {from: "leah", to: "desk", label: "Yes, she's with me", kind: "data"}],
     evidence: [{t: "09:33:30", src: "Service desk · ticket note", title: "Verified: manager callback + HR start list", sev: "ok", kind: "ticket",
       fields: [["Manager", "Leah Park, callback ext 4120", "From the directory"], ["HR start list", "Sam Kaur · Finance · 30/11", "Matches"]],
       raw: R`30/11/2026 09:33  Callback to Leah Park on ext 4120 (directory): confirmed.
HR joiners 30/11: Sam Kaur, Finance, manager Leah Park. Verified.`}]},
    {title: "Triage", sub: "Day one, can't work", ph: 3,
     what: "One person can't work, which makes it a P3. It's her first day, so it's worth fixing fast, and worth asking how a new starter got through without email, because the next one will too.",
     check: "A day-one failure is often a process gap. Fix the person, then fix the process.",
     tech: "Impact low (1 user), urgency high → P3. Joiner process to be reviewed once the cause is known.",
     msgs: [], focus: ["desk"], callout: "P3 · day one, fix it fast",
     evidence: [{t: "09:34:10", src: "Service desk · ticket", title: "Priority P3", sev: "info", kind: "ticket",
       fields: [["Priority", "P3", "One user, can't work"]],
       raw: R`30/11/2026 09:34  Priority P3. New starter, day one.`}]},
    {title: "What works and what doesn't", sub: "Signed in, but no mailbox exists", ph: 4,
     what: "Sam's Windows sign-in is checked by the domain controller and works. But when Outlook asks Exchange Online for her mailbox, there isn't one. Not a broken one: none at all.",
     check: "Ask Exchange directly whether the mailbox exists. 'Couldn't be found' means it was never created, which points at licensing.",
     tech: "Get-Mailbox sam.kaur@contoso.com: 'The operation couldn't be performed because object … couldn't be found'. The Entra ID user exists (synced 27/11 18:04).",
     msgs: [{from: "lap", to: "ad", label: "Windows sign-in", kind: "normal"}, {from: "ad", to: "lap", label: "Signed in ✓", kind: "data"}, {from: "lap", to: "exo", label: "Outlook: open my mailbox", kind: "normal"}, {from: "exo", to: "lap", label: "No mailbox for Sam", kind: "bad"}],
     cmds: {win: R`Connect-ExchangeOnline
Get-Mailbox sam.kaur@contoso.com`, nix: R`Exchange admin centre › Recipients › Mailboxes
  › search for Sam Kaur (she won't be there)

Microsoft 365 admin centre › Users › Active users › Sam Kaur
  › she's listed, but look at the Licences column`},
     evidence: [{t: "09:37:20", src: "Exchange Online · PowerShell", title: "Get-Mailbox: Sam's mailbox couldn't be found", sev: "err", kind: "cmd",
       fields: [["Result", "Couldn't be found", "The mailbox was never created"]],
       raw: R`PS> Get-Mailbox sam.kaur@contoso.com
Get-Mailbox: The operation couldn't be performed because object 'sam.kaur@contoso.com'
couldn't be found on 'LO2PR01A001DC01'.`}]},
    {title: "Find the cause", sub: "No licence, because she isn't in the group", ph: 5,
     what: "Sam has no licences at all. Here, licences come from being in a group: join LIC-M365-BusinessStandard and you get email, Teams and OneDrive. The rest of Finance were set up from a template that includes the group. Sam was set up from the starter form, which doesn't.",
     check: "Check the user's licences and group memberships, and compare them with a colleague in the same team who works.",
     tech: "Get-MgUserLicenseDetail sam.kaur: no results. Get-MgUserMemberOf: SG-Finance-All only. Colleague tom.reed: member of LIC-M365-BusinessStandard (SKU O365_BUSINESS_PREMIUM).",
     msgs: [{from: "desk", to: "entra", label: "Sam's licences? Groups?", kind: "normal"}, {from: "entra", to: "desk", label: "No licences · not in LIC-M365-…", kind: "data"}],
     callout: "No licence, no mailbox", fault: ["entra"],
     cmds: {win: R`Connect-MgGraph -Scopes "User.Read.All","GroupMember.Read.All"
Get-MgUserLicenseDetail -UserId sam.kaur@contoso.com | Format-Table SkuPartNumber
Get-MgUserMemberOf -UserId sam.kaur@contoso.com |
  ForEach-Object { $_.AdditionalProperties['displayName'] }`, nix: R`Entra admin centre
  › Users › Sam Kaur › Licences (nothing assigned)
  › Groups (compare with a colleague in Finance)

  › Groups › LIC-M365-BusinessStandard › Members`},
     evidence: [{t: "09:40:05", src: "Entra ID · PowerShell", title: "No licences assigned; Sam isn't in LIC-M365-BusinessStandard", sev: "clue", kind: "cmd",
       fields: [["Licences", "None", "So no mailbox, Teams or OneDrive"], ["Groups", "SG-Finance-All only", "Missing the licensing group"], ["Colleague", "Member of LIC-M365-BusinessStandard", "Set up from the Finance template"]],
       raw: R`PS> Get-MgUserLicenseDetail -UserId sam.kaur@contoso.com | ft SkuPartNumber
PS>                                     # (nothing)

PS> Get-MgUserMemberOf -UserId sam.kaur@contoso.com | % { $_.AdditionalProperties['displayName'] }
SG-Finance-All

PS> Get-MgUserMemberOf -UserId tom.reed@contoso.com | % { $_.AdditionalProperties['displayName'] }
SG-Finance-All
LIC-M365-BusinessStandard`}]},
    {title: "Lunchtime: still nothing", sub: "Leah chases", ph: 7,
     what: "By lunchtime Sam still has no email and no Teams, and has spent her first morning reading policies on paper. Leah chases the ticket. Nothing will appear by itself, because nothing has given Sam a licence.",
     check: "Waiting only helps after a licence is assigned. With no licence, the mailbox never gets created.",
     tech: "Get-MgUserLicenseDetail still empty at 12:10. No mailbox.",
     msgs: [{from: "leah", to: "desk", label: "Still no email?!", kind: "normal"}],
     callout: "Still no mailbox", fault: ["exo"],
     evidence: [{t: "12:10:00", src: "Service desk · ticket", title: "Leah chases: Sam still has no email or Teams", sev: "err", kind: "ticket",
       fields: [["Update", "Still no mailbox", "First morning lost"]],
       raw: R`30/11/2026 12:10  Leah Park: "Sam still can't get into email or Teams. Any update?"`}]}
  ],
  fixed: [0, 1, 2, 3, 4,
    {title: "The licence lands", sub: "And Exchange builds her mailbox", ph: 6,
     what: "A few minutes after Sam joins the licensing group, Entra ID gives her the Business Standard licence. That's the signal Exchange Online was waiting for: it creates her mailbox, and Teams and OneDrive switch on too.",
     check: "Get-MgUserLicenseDetail should now list the licence, and Get-Mailbox should find her.",
     tech: "Group-based licensing applies O365_BUSINESS_PREMIUM at 09:47; mailbox provisioned 09:52 (RecipientTypeDetails UserMailbox).",
     msgs: [{from: "entra", to: "exo", label: "Licence: Business Standard", kind: "fix"}, {from: "exo", to: "entra", label: "Mailbox created", kind: "data"}],
     callout: "Mailbox created",
     evidence: [{t: "09:52:30", src: "Exchange Online · PowerShell", title: "Licence applied; Sam's mailbox now exists", sev: "ok", kind: "cmd",
       fields: [["Licence", "O365_BUSINESS_PREMIUM", "That's the SKU name for Business Standard (confusingly)"], ["Mailbox", "UserMailbox", "Created 09:52"]],
       raw: R`PS> Get-MgUserLicenseDetail -UserId sam.kaur@contoso.com | ft SkuPartNumber
SkuPartNumber
-------------
O365_BUSINESS_PREMIUM

PS> Get-Mailbox sam.kaur@contoso.com | ft Name,RecipientTypeDetails,WhenCreated
Name      RecipientTypeDetails WhenCreated
----      -------------------- -----------
Sam Kaur  UserMailbox          30/11/2026 09:52:04`}]},
    {title: "Sam's inbox appears", sub: "Confirm, then fix the process", ph: 7,
     what: "Sam restarts Outlook and Teams. Her inbox appears, complete with the welcome email from HR. You close the ticket and raise a problem: the starter form doesn't add people to the licensing group, so the next new starter would hit exactly the same wall.",
     check: "Confirm with the user that both Outlook and Teams work, then fix the gap that caused it.",
     tech: "Outlook and Teams signed in 10:05. PRB-0091: new-starter form lacks LIC-M365-BusinessStandard (templates include it).",
     msgs: [{from: "lap", to: "exo", label: "Outlook: open my mailbox", kind: "normal"}, {from: "exo", to: "lap", label: "Inbox · 3 new", kind: "fix"}, {from: "leah", to: "desk", label: "She's in, thanks!", kind: "data"}],
     evidence: [{t: "10:05:00", src: "Service desk · ticket", title: "INC-31968 resolved; PRB-0091 raised for the starter form", sev: "ok", kind: "ticket",
       fields: [["Status", "Resolved", "Sam confirmed Outlook and Teams"], ["Follow-up", "PRB-0091", "Starter form misses the licensing group"]],
       raw: R`30/11/2026 10:05  INC-31968 Resolved (Sam confirmed Outlook + Teams).
PRB-0091 raised: new-starter form doesn't add LIC-M365-BusinessStandard.`}]}
  ],
  fixes: [
    {id: "reset", kind: "herring", name: "Reset Sam's password", short: "Reset password", at: 5,
     desc: "Give her a fresh password in case something went wrong with the first one.",
     result: "Her password works: Windows sign-in succeeded, and Microsoft 365 sign-in would too. A new one changes nothing, except giving her something else to remember on day one.",
     ev: {t: "09:45:00", src: "Entra ID · sign-in log", title: "Sign-in succeeds with the new password; still no mailbox", sev: "warn", kind: "log", fields: [["Sign-in", "Success", "It always was"], ["Mailbox", "Still none", "No licence"]], raw: R`30/11/2026 09:44:51  sam.kaur@contoso.com  Microsoft Office  Success
Get-Mailbox sam.kaur@contoso.com : couldn't be found`}},
    {id: "recreate", kind: "herring", name: "Delete her account and recreate it", short: "Recreate user", at: 5,
     desc: "Start again with a fresh account in case the first one was set up wrong.",
     result: "The new account comes from the same starter form, so it misses the licensing group too. You've lost the morning, broken her laptop sign-in and still have no mailbox.",
     ev: {t: "09:58:20", src: "Entra ID · PowerShell", title: "Recreated account: still no licence, still not in the group", sev: "warn", kind: "cmd", fields: [["Licences", "None", "Same form, same gap"]], raw: R`PS> Get-MgUserLicenseDetail -UserId sam.kaur@contoso.com | ft SkuPartNumber
PS>                                     # (nothing)
PS> Get-MgUserMemberOf -UserId sam.kaur@contoso.com | % { $_.AdditionalProperties['displayName'] }
SG-Finance-All`}},
    {id: "licence", kind: "fix", name: "Add Sam to the licensing group", short: "Licensing group", at: 6,
     desc: "Put Sam in LIC-M365-BusinessStandard so she gets the licence, and with it her mailbox and Teams.",
     result: "The licence lands within minutes, Exchange Online creates her mailbox, and after an Outlook restart her inbox appears, complete with the welcome email from HR.",
     ev: {t: "09:44:00", src: "Entra ID · PowerShell", title: "Sam added to LIC-M365-BusinessStandard", sev: "info", kind: "cmd", fields: [["Group", "LIC-M365-BusinessStandard", "Licence comes with membership"]], raw: R`PS> $g = Get-MgGroup -Filter "displayName eq 'LIC-M365-BusinessStandard'"
PS> $u = Get-MgUser -UserId sam.kaur@contoso.com
PS> New-MgGroupMember -GroupId $g.Id -DirectoryObjectId $u.Id`}}
  ],
  verify: [
    {t: "Ring her manager back on the extension in the directory, and check Sam is on HR's start list for today", ok: true, why: "Sam has nothing on file to verify against yet, so use someone and something that do: her manager, reached on a number you already hold, and HR's record that she starts today."},
    {t: "Ask Sam for her employee ID", why: "New starters get that in a letter or email that others can see too. On its own it proves very little."},
    {t: "Skip it: she's a new starter, nobody would fake that", why: "'I'm new and haven't got access yet' is a classic story for getting an account handed over. Check every time."}
  ],
  triage: [
    {t: "P3 · one user can't work, on day one. Fix it now and find out why the joiner process missed it", ok: true, why: "One user, so P3, but a first-day failure is visible and quick to fix. The bigger win is spotting the gap in the process before the next starter."},
    {t: "P2 · VIP treatment, it's her first day", why: "Her first impression matters, but impact is still one user. Work it fast without inflating the priority."},
    {t: "P4 · new mailboxes can take 24 hours, ask her to wait", why: "That's only true just after a licence is assigned. She has no licence, so waiting will never fix it."}
  ],
  notes: [
    {t: "New starter Sam Kaur (Finance, started 30/11) had no mailbox or Teams. Account created Fri from the starter form but not added to LIC-M365-BusinessStandard, so no licence (Get-MgUserLicenseDetail empty). Verified via callback to Leah Park (manager, ext 4120) and HR start list. Added Sam to the licensing group 09:44; licence applied and mailbox created 09:52; Outlook and Teams working 10:05, Sam confirmed. PRB-0091: starter form doesn't include the licensing group (Finance template does).", ok: true, why: "Who, what was missing, how you proved it, the exact fix with times, and the process gap that will catch the next starter. That last bit is what stops a repeat."},
    {t: "Recreated user.", why: "And it didn't fix anything. The real gap (the form missing the group) is still there for the next starter."},
    {t: "Licence added.", why: "Close, but the next person can't tell why it was missing, so the next new starter will hit the same wall."}
  ],
  debrief: {
    check: ["Can they sign in at all? If yes, the account and password are fine", "Get-MgUserLicenseDetail, or Entra ID › Users › Licences: is anything assigned?", "Group memberships: are they in the licensing group? Compare with a colleague"],
    fix: ["Add the user to the licensing group (or assign the licence directly if you don't use groups)", "Give it a few minutes for the mailbox, then restart Outlook and Teams"],
    prevent: ["Fix the starter form or template so the licensing group is always included", "Check every starter's licence and mailbox the day before they start", "Watch Entra ID's group licensing errors"]
  },
  tell: "The user can sign in, but Exchange says the mailbox couldn't be found, no licences are assigned and they aren't in the licensing group."
}

]);
})();
