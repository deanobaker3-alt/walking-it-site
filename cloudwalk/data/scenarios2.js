/* Cloudwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — tickets 5–8.
   The format is documented at the top of scenarios1.js. Every company, person, device and domain is made up. */
(function () {
const R = String.raw;
window.SCENARIOS = (window.SCENARIOS || []).concat([

/* ============ 5. NO LICENCE, NO MAILBOX ============ */
{
  id: "no-licence", cat: "licence", name: "Outlook says no mailbox", sub: "Never added to the licence group",
  impact: "One new starter", services: ["Active Directory", "Group-based licensing", "Exchange Online"],
  cause: "The user was never added to the licence group, so no Exchange licence and no mailbox",
  ticket: {ref: "INC-30163", from: "Tom Reid · Finance", text: "First week here. I can sign in to the portal fine but Outlook just won't set up, and Teams says I don't have a licence for it?"},
  intro: "Tom can sign in, so his account exists and his password works. But Microsoft 365 only builds a mailbox once someone has a licence that includes email. At Contoso, licences come from being in a group called LIC-M365-E3, and Tom was never added to it.",
  summary: "Contoso uses group-based licensing: the AD group LIC-M365-E3 syncs to Entra ID and carries the Microsoft 365 E3 licence (SPE_E3). The new-starter checklist missed adding tom.reid to it. With no licence, there is no Exchange Online service plan, so no mailbox is provisioned. Sign-in succeeds; Outlook's Autodiscover finds no mailbox and Get-EXOMailbox can't find the object.",
  facts: [["Symptom", "Outlook won't set up; Teams says no licence"], ["Root cause", "Not in the licence group"], ["Who's affected", "Just Tom"], ["Key evidence", "No licence details; no mailbox object"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Tom's laptop", sub: "LT-TOM · new starter", x: 110, y: 360},
    {id: "dc", kind: "dc", label: "DC01", sub: "AD group LIC-M365-E3", x: 330, y: 160},
    {id: "sync", kind: "sync", label: "SYNC01", sub: "Entra Connect Sync", x: 560, y: 160},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "Licences from groups", x: 560, y: 420},
    {id: "exo", kind: "mail", label: "Exchange Online", sub: "Mailboxes", x: 860, y: 320}
  ],
  links: [["lap", "entra"], ["dc", "sync"], ["sync", "entra"], ["entra", "exo"], ["lap", "exo"]],
  lanes: ["lap", "dc", "sync", "entra", "exo"],
  stage: 4,
  steps: [
    {title: "Tom signs in", sub: "Identity is fine", ph: 2,
     what: "Tom signs in with his password and approves the prompt on his phone. That works, so his account exists in Microsoft 365 and his MFA is set up. Whatever's wrong comes after signing in.",
     check: "A successful sign-in in the logs rules out sync, password and MFA in one go.",
     tech: "Sign-in log: success, CA001 satisfied. The user object exists and is synced from AD.",
     msgs: [{from: "lap", to: "entra", label: "Password + MFA", kind: "normal"}, {from: "entra", to: "lap", label: "Signed in", kind: "data"}],
     focus: ["lap", "entra"],
     evidence: [{t: "09:20:14", src: "Entra ID · sign-in logs", title: "Tom Reid · Office 365 portal · Success", sev: "info", kind: "log",
       fields: [["Status", "Success", "Signing in isn't the problem"]],
       raw: R`{
  "createdDateTime": "2026-11-24T09:20:14Z",
  "userPrincipalName": "tom.reid@contoso.com",
  "appDisplayName": "Office 365 portal",
  "conditionalAccessStatus": "success",
  "status": { "errorCode": 0 }
}`}]},
    {title: "No licence", sub: "Not in LIC-M365-E3", ph: 4,
     what: "Licences at Contoso come from a group: join LIC-M365-E3 in Active Directory and the Microsoft 365 licence follows automatically. Tom's account was made, but nobody added him to that group, so he has no licence at all.",
     check: "Look at the user's licences. None at all on a staff account means a missed onboarding step, and checking his groups confirms it.",
     tech: "Get-MgUserLicenseDetail returns nothing. Get-ADPrincipalGroupMembership shows Domain Users and Finance-Staff but not LIC-M365-E3. With no SPE_E3, there's no EXCHANGE_S_ENTERPRISE service plan, so Exchange never provisions a mailbox.",
     msgs: [{from: "entra", to: "sync", label: "Is Tom in a licence group?", kind: "normal"}, {from: "sync", to: "dc", label: "LIC-M365-E3 members?", kind: "normal"}, {from: "dc", to: "entra", label: "Tom isn't a member", kind: "bad"}],
     callout: "No licence: no mailbox", fault: ["dc"], focus: ["dc", "sync", "entra"],
     cmds: {win: R`Get-MgUserLicenseDetail -UserId tom.reid@contoso.com
Get-ADPrincipalGroupMembership tom.reid | Select-Object Name`, nix: R`admin.microsoft.com → Users → Active users → Tom Reid → Licences and apps
(For group-based licences: entra.microsoft.com → Users → Tom → Licences shows "Assignment paths".)`},
     evidence: [
      {t: "09:31:02", src: "Graph PowerShell", title: "Get-MgUserLicenseDetail: no licences at all", sev: "err", kind: "cmd",
       fields: [["Licences", "(none)", "No Microsoft 365 licence means no mailbox, no Teams, no OneDrive"]],
       raw: R`PS C:\> Get-MgUserLicenseDetail -UserId tom.reid@contoso.com
PS C:\>`},
      {t: "09:32:40", src: "DC01 · PowerShell", title: "Tom's AD groups: no LIC-M365-E3", sev: "clue", kind: "cmd",
       fields: [["Groups", "Domain Users, Finance-Staff", "LIC-M365-E3 is missing"]],
       raw: R`PS C:\> Get-ADPrincipalGroupMembership tom.reid | Select-Object Name

Name
----
Domain Users
Finance-Staff`}]},
    {title: "Outlook can't find a mailbox", sub: "There isn't one", ph: 7,
     what: "Outlook asks Microsoft where Tom's mailbox is and gets nothing back, because it was never made. Teams similarly says he isn't licensed. Both are symptoms of the same missing licence.",
     check: "Look the mailbox up in Exchange Online. 'Couldn't be found' for a user who can sign in means 'no Exchange licence'.",
     tech: "Get-EXOMailbox fails with 'The operation couldn't be performed because object … couldn't be found'. Outlook's Autodiscover returns no mailbox for the UPN.",
     msgs: [{from: "lap", to: "exo", label: "Where's my mailbox?", kind: "normal"}, {from: "exo", to: "lap", label: "No mailbox for Tom", kind: "bad", lost: "Not found"}],
     focus: ["lap", "exo"],
     cmds: {win: R`Connect-ExchangeOnline
Get-EXOMailbox -Identity tom.reid@contoso.com`, nix: R`admin.exchange.microsoft.com → Recipients → Mailboxes
Search for Tom. No result for a user who can sign in = no Exchange licence.`},
     evidence: [{t: "09:35:18", src: "Exchange Online PowerShell", title: "Get-EXOMailbox: object 'tom.reid@contoso.com' couldn't be found", sev: "err", kind: "cmd",
       fields: [["Result", "Couldn't be found", "Exchange has no mailbox for him"]],
       raw: R`PS C:\> Get-EXOMailbox -Identity tom.reid@contoso.com
Get-EXOMailbox: The operation couldn't be performed because object 'tom.reid@contoso.com' couldn't be found on 'AM0P190A01DC004.EURP190A001.PROD.OUTLOOK.COM'.`}]}
  ],
  fixed: [
    {title: "Added to the licence group", sub: "In AD, then synced", ph: 4,
     what: "The service desk adds Tom to LIC-M365-E3 in Active Directory and runs a sync. Within a few minutes the group membership reaches Microsoft 365 and the licence is applied to him automatically.",
     check: "His licence details now show Microsoft 365 E3, assigned through the group.",
     tech: "Add-ADGroupMember, then a delta sync. Group-based licensing assigns SPE_E3 to the new member; the Entra licence page shows the assignment path as 'Inherited (LIC-M365-E3)'.",
     msgs: [{from: "dc", to: "sync", label: "Tom added to LIC-M365-E3", kind: "fix"}, {from: "sync", to: "entra", label: "Group membership synced", kind: "fix"}],
     focus: ["dc", "sync", "entra"],
     cmds: {win: R`Add-ADGroupMember -Identity LIC-M365-E3 -Members tom.reid
# On SYNC01
Start-ADSyncSyncCycle -PolicyType Delta
# A few minutes later
Get-MgUserLicenseDetail -UserId tom.reid@contoso.com | Select-Object SkuPartNumber`, nix: R`Active Directory Users and Computers → LIC-M365-E3 → Members → Add…
Then check: entra.microsoft.com → Users → Tom → Licences`},
     evidence: [{t: "10:05:33", src: "Graph PowerShell", title: "Licence applied: SPE_E3 (Microsoft 365 E3)", sev: "ok", kind: "cmd",
       fields: [["SkuPartNumber", "SPE_E3", "Microsoft 365 E3, which includes Exchange Online"]],
       raw: R`PS C:\> Get-MgUserLicenseDetail -UserId tom.reid@contoso.com | Select-Object SkuPartNumber

SkuPartNumber
-------------
SPE_E3`}]},
    {title: "Exchange builds the mailbox", sub: "Usually within minutes", ph: 4,
     what: "Now that Tom has a licence with email in it, Exchange Online creates his mailbox. This normally takes a few minutes, occasionally longer.",
     check: "Get-EXOMailbox now returns a UserMailbox with today's creation date.",
     tech: "The EXCHANGE_S_ENTERPRISE service plan triggers mailbox provisioning. RecipientTypeDetails UserMailbox.",
     msgs: [{from: "entra", to: "exo", label: "Licensed: Exchange Online", kind: "fix"}, {from: "exo", to: "entra", label: "Mailbox created", kind: "data"}],
     focus: ["entra", "exo"],
     evidence: [{t: "10:14:50", src: "Exchange Online PowerShell", title: "Get-EXOMailbox: Tom Reid · UserMailbox", sev: "ok", kind: "cmd",
       fields: [["RecipientTypeDetails", "UserMailbox", "A normal mailbox"], ["PrimarySmtpAddress", "tom.reid@contoso.com", ""]],
       raw: R`PS C:\> Get-EXOMailbox -Identity tom.reid@contoso.com | Format-List DisplayName, RecipientTypeDetails, PrimarySmtpAddress

DisplayName          : Tom Reid
RecipientTypeDetails : UserMailbox
PrimarySmtpAddress   : tom.reid@contoso.com`}]},
    {title: "Outlook opens", sub: "And Teams", ph: 7,
     what: "Tom restarts Outlook. It finds his new mailbox and sets itself up. Teams stops complaining too.",
     check: "Outlook connects; the sign-in log shows Outlook signing in successfully.",
     tech: "Autodiscover returns the mailbox; Outlook creates its profile.",
     msgs: [{from: "lap", to: "exo", label: "Where's my mailbox?", kind: "normal"}, {from: "exo", to: "lap", label: "Here it is", kind: "data"}],
     focus: ["lap", "exo"], evidence: []}
  ],
  fixes: [
    {id: "profile", kind: "herring", name: "Rebuild Tom's Outlook profile", short: "New profile", at: 3,
     desc: "Delete the Outlook profile and set it up again.",
     result: "A new profile asks Microsoft the same question, 'where's this mailbox?', and gets the same answer: there isn't one.",
     ev: {t: "09:42:10", src: "Tom's laptop · Outlook", title: "New profile: still can't set up the account", sev: "warn", kind: "browser", fields: [["Result", "Account setup fails", "The mailbox still doesn't exist"]], raw: R`Outlook: account setup for tom.reid@contoso.com did not complete.`}},
    {id: "pw5", kind: "herring", name: "Reset his password", short: "Password reset", at: 3,
     desc: "Give Tom a new password.",
     result: "His password was fine, as the successful sign-in showed. Signing in was never the problem; there's simply no mailbox to open.",
     ev: {t: "09:45:30", src: "Exchange Online PowerShell", title: "After the reset: still no mailbox", sev: "warn", kind: "cmd", fields: [["Result", "Couldn't be found", "Unchanged"]], raw: R`Get-EXOMailbox: The operation couldn't be performed because object 'tom.reid@contoso.com' couldn't be found on 'AM0P190A01DC004.EURP190A001.PROD.OUTLOOK.COM'.`}},
    {id: "office", kind: "herring", name: "Reinstall Microsoft 365 apps", short: "Reinstall Office", at: 3,
     desc: "Uninstall and reinstall Office on his laptop.",
     result: "An hour later, freshly installed Outlook asks for a mailbox that doesn't exist. The apps were never broken.",
     ev: {t: "10:01:05", src: "Tom's laptop · Outlook", title: "Fresh install: still can't find a mailbox", sev: "warn", kind: "browser", fields: [["Result", "Account setup fails", "Same as before"]], raw: R`Outlook: account setup for tom.reid@contoso.com did not complete.`}},
    {id: "licgroup", kind: "fix", name: "Add Tom to the licence group (LIC-M365-E3)", short: "Licence group", at: 1,
     desc: "Add him to the AD group that carries the Microsoft 365 E3 licence, then sync.",
     result: "The licence follows the group, Exchange builds his mailbox, and Outlook and Teams both work. (Assigning a licence directly would work too, but it bypasses the group, so the next audit won't find it.)",
     ev: {t: "10:00:12", src: "DC01 · PowerShell", title: "Add-ADGroupMember: Tom → LIC-M365-E3", sev: "ok", kind: "cmd",
       fields: [["Group", "LIC-M365-E3", "Carries the Microsoft 365 E3 licence"]],
       raw: R`PS C:\> Add-ADGroupMember -Identity LIC-M365-E3 -Members tom.reid
PS C:\> Get-ADGroupMember LIC-M365-E3 | Where-Object SamAccountName -eq tom.reid | Select-Object Name

Name
----
Tom Reid`}}
  ],
  debrief: {
    check: ["Can they sign in? If yes, identity is fine", "Licences: any at all? Which ones, and through which group?", "Does a mailbox exist? (Get-EXOMailbox)", "Group memberships against the new-starter checklist"],
    fix: ["Add the user to the licence group (or assign directly, if you don't use groups)", "Wait a few minutes for Exchange to build the mailbox"],
    prevent: ["Automate licence group membership from HR data or a dynamic group", "Run a weekly report of enabled users with no licence", "Put 'licence group' near the top of the new-starter checklist"]
  },
  tell: "Sign-in succeeds, but the user has no licences, isn't in the licence group, and Exchange can't find a mailbox for them."
},

/* ============ 6. DYNAMIC GROUP TYPO ============ */
{
  id: "dyn-typo", cat: "access", name: "Can't open the Finance site", sub: "A typo emptied the group",
  impact: "All of Finance (24 people)", services: ["Entra ID", "Dynamic groups", "SharePoint Online"],
  cause: "A typo in the dynamic group's membership rule ('Finanace') removed every member",
  ticket: {ref: "INC-30170", from: "Fatima Noor · Finance", text: "Getting access denied on the Finance SharePoint site this morning. It was fine yesterday. Others in the team are getting it too."},
  intro: "Access to the Finance site comes from a group called Finance-Staff, which fills itself: anyone whose department is 'Finance' is in. Yesterday evening someone edited the group's rule and mistyped Finance as 'Finanace'. Nobody's department matches that, so overnight the group emptied, and the whole team lost access.",
  summary: "Finance-Staff is a dynamic security group granted Members access to the Finance SharePoint site. At 17:42 on 23 Nov an admin updated the rule to add Finance Operations, typing (user.department -eq \"Finanace\") -or (user.department -eq \"Finance Operations\"). Dynamic membership processing removed all 24 members. Sign-ins succeed; SharePoint returns access denied.",
  facts: [["Symptom", "Access denied on a site that worked yesterday"], ["Root cause", "Typo in the dynamic membership rule"], ["Who's affected", "Everyone in Finance"], ["Key evidence", "Group has 0 members; audit log shows the rule change"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Fatima's laptop", sub: "LT-FATIMA", x: 110, y: 340},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "Sign-in + groups", x: 380, y: 180},
    {id: "grp", kind: "server", label: "Finance-Staff", sub: "Dynamic group", x: 640, y: 200},
    {id: "sp", kind: "web", label: "Finance site", sub: "SharePoint Online", x: 640, y: 470}
  ],
  links: [["lap", "entra"], ["entra", "grp"], ["grp", "sp"], ["lap", "sp"]],
  lanes: ["lap", "entra", "grp", "sp"],
  stage: 5,
  steps: [
    {title: "Fatima signs in", sub: "No problem there", ph: 2,
     what: "Fatima signs in as normal. Password and MFA work, and SharePoint knows exactly who she is.",
     check: "A successful sign-in to SharePoint in the logs means the problem is permissions, not identity.",
     tech: "Sign-in to Office 365 SharePoint Online: success.",
     msgs: [{from: "lap", to: "entra", label: "Password + MFA", kind: "normal"}, {from: "entra", to: "lap", label: "Signed in", kind: "data"}],
     focus: ["lap", "entra"],
     evidence: [{t: "08:47:22", src: "Entra ID · sign-in logs", title: "Fatima Noor · Office 365 SharePoint Online · Success", sev: "info", kind: "log",
       fields: [["Status", "Success", "She's signed in fine"]],
       raw: R`{
  "createdDateTime": "2026-11-24T08:47:22Z",
  "userPrincipalName": "fatima.noor@contoso.com",
  "appDisplayName": "Office 365 SharePoint Online",
  "status": { "errorCode": 0 }
}`}]},
    {title: "Is she in Finance-Staff?", sub: "The group is empty", ph: 5,
     what: "SharePoint lets in members of Finance-Staff. That group doesn't have members added by hand: it uses a rule, 'department equals Finance'. Fatima's department is Finance. But the rule now says 'Finanace', which matches nobody, so the group has no members at all.",
     check: "Look at the group's membership rule letter by letter, and its member count. Then compare with the user's department attribute.",
     tech: "MembershipRule: (user.department -eq \"Finanace\") -or (user.department -eq \"Finance Operations\"). Fatima's department is 'Finance'. Member count 0. MembershipRuleProcessingState: On. No one in the tenant has department 'Finance Operations' yet either.",
     msgs: [{from: "sp", to: "grp", label: "Is Fatima in Finance-Staff?", kind: "normal"}, {from: "grp", to: "sp", label: "No. 0 members", kind: "bad"}],
     callout: "Rule says 'Finanace'", fault: ["grp"], focus: ["grp", "sp"],
     cmds: {win: R`$g = Get-MgGroup -Filter "displayName eq 'Finance-Staff'" -Property DisplayName,MembershipRule,MembershipRuleProcessingState
$g | Format-List DisplayName, MembershipRule, MembershipRuleProcessingState
(Get-MgGroupMember -GroupId $g.Id -All).Count
Get-MgUser -UserId fatima.noor@contoso.com -Property Department | Select-Object Department`, nix: R`entra.microsoft.com → Groups → Finance-Staff → Dynamic membership rules
Use "Validate Rules" to test it against Fatima before saving any change.`},
     evidence: [
      {t: "09:02:15", src: "Graph PowerShell", title: "Finance-Staff rule: user.department -eq \"Finanace\" · 0 members", sev: "err", kind: "cmd",
       fields: [["MembershipRule", "(user.department -eq \"Finanace\") -or (user.department -eq \"Finance Operations\")", "'Finanace' has an extra 'a'"], ["Members", "0", "Everyone dropped out"], ["Fatima's department", "Finance", "Doesn't match 'Finanace'"]],
       raw: R`PS C:\> $g | Format-List DisplayName, MembershipRule, MembershipRuleProcessingState

DisplayName                   : Finance-Staff
MembershipRule                : (user.department -eq "Finanace") -or (user.department -eq "Finance Operations")
MembershipRuleProcessingState : On

PS C:\> (Get-MgGroupMember -GroupId $g.Id -All).Count
0

PS C:\> Get-MgUser -UserId fatima.noor@contoso.com -Property Department | Select-Object Department

Department
----------
Finance`}]},
    {title: "Access denied", sub: "The whole team is locked out", ph: 5,
     what: "With no members in the group, SharePoint has no reason to let Fatima in, so she gets an access denied page with a 'Request access' button. So does everyone else in Finance.",
     check: "When a whole team loses access at once, look at what they have in common (usually a group) before looking at any one person.",
     tech: "The site's Members permission is granted to Finance-Staff only. Requests from users with no other grant are refused with HTTP 403.",
     msgs: [{from: "lap", to: "sp", label: "Open the Finance site", kind: "normal"}, {from: "sp", to: "lap", label: "Access denied", kind: "bad"}],
     focus: ["lap", "sp"],
     evidence: [{t: "09:05:40", src: "Fatima's browser", title: "Finance site: access denied (HTTP 403)", sev: "err", kind: "browser",
       fields: [["URL", "contoso.sharepoint.com/sites/Finance", ""], ["Result", "Access denied page, with a Request access button", "SharePoint doesn't think she's allowed in"]],
       raw: R`GET https://contoso.sharepoint.com/sites/Finance
HTTP/1.1 403 FORBIDDEN`}]},
    {title: "Who changed the rule?", sub: "Yesterday, 17:42", ph: 5,
     what: "The audit log shows the rule was edited yesterday evening to add a new department, Finance Operations. In doing so, 'Finance' became 'Finanace'.",
     check: "Entra ID audit logs, filtered to the group, show every change with the old and new values.",
     tech: "Audit: 'Update group', modified property MembershipRule, old value (user.department -eq \"Finance\"), new value with the typo. Processing then removed all members.",
     msgs: [], focus: ["grp", "entra"], callout: "Edited yesterday at 17:42",
     cmds: {win: R`Get-MgAuditLogDirectoryAudit -Filter "activityDisplayName eq 'Update group' and targetResources/any(t:t/displayName eq 'Finance-Staff')" -Top 5 |
  Select-Object ActivityDateTime, @{n='By';e={$_.InitiatedBy.User.UserPrincipalName}}`, nix: R`entra.microsoft.com → Groups → Finance-Staff → Audit logs
Open the entry → Modified Properties shows the old and new rule.`},
     evidence: [{t: "09:09:30", src: "Entra ID · audit logs", title: "Update group: Finance-Staff membership rule changed (23 Nov 17:42)", sev: "clue", kind: "log",
       fields: [["Activity", "Update group", ""], ["Old value", "(user.department -eq \"Finance\")", "Worked"], ["New value", "(user.department -eq \"Finanace\") -or (user.department -eq \"Finance Operations\")", "Typo"]],
       raw: R`Date         : 23/11/2026 17:42:09
Service      : Core Directory
Category     : GroupManagement
Activity     : Update group
Status       : Success
Initiated by : it.admin@contoso.com
Target       : Finance-Staff
Modified property : MembershipRule
  Old value  : (user.department -eq "Finance")
  New value  : (user.department -eq "Finanace") -or (user.department -eq "Finance Operations")`}]}
  ],
  fixed: [
    {title: "Rule corrected", sub: "'Finance' spelled right", ph: 5,
     what: "The admin corrects the typo, keeping the new Finance Operations department. Before saving, they test the rule against Fatima to make sure it matches.",
     check: "Validate Rules shows Fatima as a match; the group's rule now reads 'Finance'.",
     tech: "Update-MgGroup sets the corrected MembershipRule. Dynamic processing re-evaluates all users.",
     msgs: [], focus: ["grp"], callout: "Rule fixed",
     cmds: {win: R`Update-MgGroup -GroupId $g.Id -MembershipRule '(user.department -eq "Finance") -or (user.department -eq "Finance Operations")'`, nix: R`entra.microsoft.com → Groups → Finance-Staff → Dynamic membership rules
  → fix the value → Validate Rules (add Fatima) → Save`},
     evidence: []},
    {title: "Members come back", sub: "24 people re-added", ph: 5,
     what: "Within a few minutes, the group fills itself again with everyone in Finance.",
     check: "The member count is back to 24 and Fatima is on the list.",
     tech: "Processing completes; 24 users match department 'Finance'.",
     msgs: [{from: "entra", to: "grp", label: "Re-evaluate: department = Finance", kind: "fix"}, {from: "grp", to: "entra", label: "24 members", kind: "data"}],
     focus: ["entra", "grp"],
     evidence: [{t: "09:36:50", src: "Graph PowerShell", title: "Finance-Staff: 24 members again", sev: "ok", kind: "cmd",
       fields: [["Members", "24", "Everyone in Finance is back"]],
       raw: R`PS C:\> (Get-MgGroupMember -GroupId $g.Id -All).Count
24`}]},
    {title: "Site opens", sub: "For the whole team", ph: 7,
     what: "Fatima refreshes the page and the Finance site opens. So does everyone else's.",
     check: "The site loads; the team confirms.",
     tech: "SharePoint group-membership checks now succeed. (Cached sessions can take a short while to catch up; signing out and in helps if one person still sees the old result.)",
     msgs: [{from: "sp", to: "grp", label: "Is Fatima in Finance-Staff?", kind: "normal"}, {from: "grp", to: "sp", label: "Yes", kind: "data"}, {from: "sp", to: "lap", label: "Finance site", kind: "data"}],
     focus: ["lap", "sp", "grp"], evidence: []}
  ],
  fixes: [
    {id: "cache6", kind: "herring", name: "Clear Fatima's browser cache", short: "Clear cache", at: 4,
     desc: "Clear cookies and cached files, then retry.",
     result: "Same page. The decision is made by SharePoint based on a group with no members; nothing stored in her browser can change that.",
     ev: {t: "09:12:05", src: "Fatima's browser", title: "After clearing the cache: 403 again", sev: "warn", kind: "browser", fields: [["Result", "Access denied", "Unchanged"]], raw: R`HTTP/1.1 403 FORBIDDEN`}},
    {id: "signout", kind: "herring", name: "Ask her to sign out and back in", short: "Sign out/in", at: 4,
     desc: "A fresh sign-in sometimes picks up new group memberships.",
     result: "Good advice after you've changed a group, but nothing's been fixed yet. A fresh sign-in still shows her as not a member, because she isn't.",
     ev: {t: "09:14:40", src: "Fatima's browser", title: "Fresh sign-in, still access denied", sev: "warn", kind: "browser", fields: [["Result", "Access denied", "She isn't in the group"]], raw: R`HTTP/1.1 403 FORBIDDEN`}},
    {id: "request", kind: "herring", name: "Tell her to click 'Request access'", short: "Request access", at: 4,
     desc: "Let the site owner approve it.",
     result: "The request goes to the site owner, who's on leave this week. Even if approved, it would give Fatima a one-off permission and leave the other 23 people locked out.",
     ev: {t: "09:16:25", src: "SharePoint", title: "Access request sent to the site owner (out of office)", sev: "warn", kind: "log", fields: [["Status", "Pending", "Nobody to approve it, and it's one person out of 24"]], raw: R`Access request: Fatima Noor → Finance site
Status: Pending
Sent to: site owner (automatic reply: on leave until 1 December)`}},
    {id: "rulefix", kind: "fix", name: "Fix the typo in the membership rule", short: "Fix rule", at: 1,
     desc: "Correct 'Finanace' to 'Finance', and validate before saving.",
     result: "With the rule spelled correctly, the group fills itself again with all 24 Finance staff and the site opens for everyone. Validating first proves the fix before it goes live.",
     ev: {t: "09:30:15", src: "Graph PowerShell", title: "Update-MgGroup: rule corrected to user.department -eq \"Finance\"", sev: "ok", kind: "cmd",
       fields: [["MembershipRule", "(user.department -eq \"Finance\") -or (user.department -eq \"Finance Operations\")", "Spelled right, new department kept"]],
       raw: R`PS C:\> Update-MgGroup -GroupId $g.Id -MembershipRule '(user.department -eq "Finance") -or (user.department -eq "Finance Operations")'
PS C:\> (Get-MgGroup -GroupId $g.Id -Property MembershipRule).MembershipRule
(user.department -eq "Finance") -or (user.department -eq "Finance Operations")`}}
  ],
  debrief: {
    check: ["Whole team affected at once? Look at the group they share", "The group's membership rule, letter by letter, and its member count", "The user's own attribute (department) against the rule", "Audit log: who changed the group, and what the old value was"],
    fix: ["Correct the rule, validate it against a known user, then save", "Wait a few minutes for processing to re-add everyone"],
    prevent: ["Always use Validate Rules before saving a dynamic group change", "Change dynamic groups that grant access through a change request, with a second pair of eyes", "Alert when a group that grants access drops to zero members"]
  },
  tell: "Sign-in is fine, but SharePoint says access denied for the whole team. The dynamic group has 0 members, its rule has a misspelt department, and the audit log shows it was edited the evening before."
},

/* ============ 7. PHONE NOT ENROLLED ============ */
{
  id: "intune-phone", cat: "devices", name: "Teams works on my laptop, not my phone", sub: "The phone isn't enrolled",
  impact: "One user, one device", services: ["Entra ID", "Conditional Access", "Intune"],
  cause: "A Conditional Access policy requires a compliant phone, and the new phone was never enrolled in Intune",
  ticket: {ref: "INC-30176", from: "Daniel Price · Engineering", text: "Got my new work iPhone yesterday. Installed Teams from the App Store, signed in, and it says I can't get in from this device. Laptop's fine."},
  intro: "Contoso only lets phones into company data if they're managed: enrolled in Intune, the company's device management service, and checked against its rules. Daniel installed Teams straight from the App Store, so his new phone was never enrolled. Microsoft 365 doesn't know it's a company phone, so it says no.",
  summary: "Conditional Access policy CA020 'Require compliant device for mobile' targets iOS and Android with grant control Require device to be marked as compliant. Daniel's iPhone has no Intune record, so deviceDetail shows isManaged false and isCompliant false. The sign-in fails with AADSTS53000 (DeviceNotCompliant). His Windows laptop is enrolled and compliant, so desktop access is unaffected.",
  facts: [["Symptom", "Blocked on the phone, fine on the laptop"], ["Root cause", "Phone not enrolled in Intune"], ["Who's affected", "Just this phone"], ["Key evidence", "53000 in sign-in logs; no Intune record for the phone"]],
  nodes: [
    {id: "phone", kind: "phone", label: "Daniel's new iPhone", sub: "Not enrolled", x: 110, y: 360},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "Password + MFA", x: 380, y: 200},
    {id: "ca", kind: "gate", label: "CA020", sub: "Mobile: compliant devices only", x: 640, y: 200},
    {id: "intune", kind: "server", label: "Intune", sub: "Device management", x: 640, y: 470},
    {id: "m365", kind: "cloud", label: "Microsoft 365", sub: "Teams", x: 900, y: 330}
  ],
  links: [["phone", "entra"], ["entra", "ca"], ["ca", "intune"], ["ca", "m365"], ["phone", "intune"]],
  lanes: ["phone", "entra", "ca", "intune", "m365"],
  stage: 6,
  steps: [
    {title: "Sign in to Teams", sub: "Password and MFA pass", ph: 2,
     what: "Daniel opens Teams on the new iPhone and signs in. His password and MFA approval both work.",
     check: "In the sign-in log, password and MFA succeeded. The block comes after.",
     tech: "Primary auth and MFA succeed. Client app: mobile apps and desktop clients; platform iOS.",
     msgs: [{from: "phone", to: "entra", label: "Password + MFA", kind: "normal"}, {from: "entra", to: "phone", label: "Correct", kind: "data"}],
     focus: ["phone", "entra"], evidence: []},
    {title: "Is this phone trusted?", sub: "Intune has never heard of it", ph: 6,
     what: "Rule CA020 says phones must be compliant: enrolled in Intune and passing the company's checks (passcode, up-to-date iOS and so on). Entra ID asks Intune about this phone. Intune has no record of it.",
     check: "Look up the user's devices in Intune. If only the laptop is there, the phone was never enrolled.",
     tech: "CA020 grant: Require device to be marked as compliant, platforms iOS and Android. Intune has one managed device for Daniel: LT-DANIEL (Windows, Compliant). No iOS record, so the device has no compliance state.",
     msgs: [{from: "entra", to: "ca", label: "Check CA020", kind: "normal"}, {from: "ca", to: "intune", label: "Is this iPhone compliant?", kind: "normal"}, {from: "intune", to: "ca", label: "Unknown device", kind: "bad"}],
     callout: "Not enrolled in Intune", fault: ["phone"], focus: ["ca", "intune", "phone"],
     cmds: {win: R`Connect-MgGraph -Scopes "DeviceManagementManagedDevices.Read.All"
Get-MgDeviceManagementManagedDevice -Filter "userPrincipalName eq 'daniel.price@contoso.com'" |
  Select-Object DeviceName, OperatingSystem, ComplianceState, LastSyncDateTime`, nix: R`intune.microsoft.com → Devices → All devices → search "Daniel"
Or: Users → Daniel Price → Devices`},
     evidence: [{t: "11:14:39", src: "Graph PowerShell", title: "Intune: Daniel has one device, the laptop", sev: "clue", kind: "cmd",
       fields: [["LT-DANIEL", "Windows · Compliant", "The laptop works because it's managed"], ["iPhone", "(no record)", "Never enrolled"]],
       raw: R`PS C:\> Get-MgDeviceManagementManagedDevice -Filter "userPrincipalName eq 'daniel.price@contoso.com'" |
  Select-Object DeviceName, OperatingSystem, ComplianceState, LastSyncDateTime

DeviceName OperatingSystem ComplianceState LastSyncDateTime
---------- --------------- --------------- ----------------
LT-DANIEL  Windows         compliant       24/11/2026 10:58:12`}]},
    {title: "Blocked", sub: "Error 53000", ph: 6,
     what: "Without proof the phone is safe, the rule blocks it. Teams tells Daniel he can't get in from this device. His laptop, which is enrolled, keeps working.",
     check: "The sign-in log shows error 53000 and, under Device info, Managed: No and Compliant: No.",
     tech: "Sign-in log: errorCode 53000 DeviceNotCompliant; deviceDetail.isManaged false, isCompliant false, operatingSystem iOS; CA020 result failure with enforcedGrantControls RequireCompliantDevice.",
     msgs: [{from: "ca", to: "entra", label: "Block: not compliant", kind: "bad"}, {from: "entra", to: "phone", label: "Can't get in from this device", kind: "bad"}],
     focus: ["phone", "entra", "ca"],
     cmds: {win: R`Get-MgAuditLogSignIn -Filter "userPrincipalName eq 'daniel.price@contoso.com' and status/errorCode eq 53000" -Top 1 |
  Select-Object CreatedDateTime, AppDisplayName, @{n='OS';e={$_.DeviceDetail.OperatingSystem}}, @{n='Managed';e={$_.DeviceDetail.IsManaged}}`, nix: R`entra.microsoft.com → Monitoring & health → Sign-in logs → the failed entry
  → Device info tab (Managed, Compliant) and Conditional Access tab (CA020)`},
     evidence: [{t: "11:14:40", src: "Entra ID · sign-in logs", title: "Daniel Price · Microsoft Teams · Failure 53000 · iOS, not managed", sev: "err", kind: "log",
       fields: [["Error code", "53000", "DeviceNotCompliant"], ["Device", "iOS · Managed: false · Compliant: false", "Intune doesn't know this phone"], ["CA020", "failure · RequireCompliantDevice", "The policy that blocked it"]],
       raw: R`{
  "createdDateTime": "2026-11-24T11:14:40Z",
  "userPrincipalName": "daniel.price@contoso.com",
  "appDisplayName": "Microsoft Teams",
  "clientAppUsed": "Mobile Apps and Desktop clients",
  "status": {
    "errorCode": 53000,
    "failureReason": "Device is not in required device state: compliant. Conditional Access policy requires a compliant device, and the device is not compliant. The user must enroll their device with an approved MDM provider like Intune."
  },
  "deviceDetail": { "operatingSystem": "Ios 26.1", "isCompliant": false, "isManaged": false },
  "appliedConditionalAccessPolicies": [
    { "displayName": "CA001 - Require MFA for all users", "enforcedGrantControls": ["Mfa"], "result": "success" },
    { "displayName": "CA020 - Require compliant device for mobile", "enforcedGrantControls": ["RequireCompliantDevice"], "result": "failure" }
  ]
}`}]}
  ],
  fixed: [
    {title: "Enrol with Company Portal", sub: "The phone joins Intune", ph: 6,
     what: "Daniel installs the Company Portal app, signs in and follows the steps to enrol the phone. Intune checks it against the company's rules: passcode set, iOS up to date. It passes.",
     check: "Intune now lists the iPhone, with compliance state Compliant.",
     tech: "Enrolment through Company Portal installs the management profile. The iOS compliance policy (passcode, minimum OS version, not jailbroken) evaluates to compliant and the state is written to the Entra device object.",
     msgs: [{from: "phone", to: "intune", label: "Enrol via Company Portal", kind: "fix"}, {from: "intune", to: "phone", label: "Policies applied, compliant", kind: "data"}],
     focus: ["phone", "intune"],
     cmds: {win: R`Get-MgDeviceManagementManagedDevice -Filter "userPrincipalName eq 'daniel.price@contoso.com'" |
  Select-Object DeviceName, OperatingSystem, ComplianceState, LastSyncDateTime`, nix: R`On the phone: App Store → Company Portal → sign in → Enrol this device
Then check: intune.microsoft.com → Devices → All devices`},
     evidence: [{t: "11:40:22", src: "Graph PowerShell", title: "Intune: iPhone enrolled, compliant", sev: "ok", kind: "cmd",
       fields: [["iPhone-DANIEL", "iOS · Compliant", "Now a managed, trusted device"]],
       raw: R`DeviceName    OperatingSystem ComplianceState LastSyncDateTime
----------    --------------- --------------- ----------------
LT-DANIEL     Windows         compliant       24/11/2026 10:58:12
iPhone-DANIEL iOS             compliant       24/11/2026 11:40:01`}]},
    {use: 0, times: []},
    {title: "Trusted device", sub: "CA020 passes", ph: 6,
     what: "Daniel opens Teams again. This time Intune vouches for the phone, so CA020 lets it in.",
     check: "The new sign-in shows Managed: Yes, Compliant: Yes, and CA020 Success.",
     tech: "deviceDetail isManaged true, isCompliant true; CA020 result success.",
     msgs: [{from: "entra", to: "ca", label: "Check CA020", kind: "normal"}, {from: "ca", to: "intune", label: "Is this iPhone compliant?", kind: "normal"}, {from: "intune", to: "ca", label: "Yes", kind: "fix"}, {from: "ca", to: "m365", label: "Grant: compliant device", kind: "data"}],
     focus: ["ca", "intune", "m365"],
     evidence: [{t: "11:43:10", src: "Entra ID · sign-in logs", title: "Daniel Price · Microsoft Teams · Success · compliant iPhone", sev: "ok", kind: "log",
       fields: [["Device", "iOS · Managed: true · Compliant: true", ""], ["CA020", "success", ""]],
       raw: R`{
  "createdDateTime": "2026-11-24T11:43:10Z",
  "userPrincipalName": "daniel.price@contoso.com",
  "appDisplayName": "Microsoft Teams",
  "status": { "errorCode": 0 },
  "deviceDetail": { "displayName": "iPhone-DANIEL", "operatingSystem": "Ios 26.1", "isCompliant": true, "isManaged": true },
  "appliedConditionalAccessPolicies": [
    { "displayName": "CA020 - Require compliant device for mobile", "enforcedGrantControls": ["RequireCompliantDevice"], "result": "success" }
  ]
}`}]},
    {title: "Teams opens", sub: "On the phone", ph: 7,
     what: "Teams loads on the iPhone with all his chats.",
     check: "No more 53000 entries for Daniel.",
     tech: "Token issued to Microsoft Teams on iOS.",
     msgs: [{from: "m365", to: "phone", label: "Teams loads", kind: "data"}],
     focus: ["phone", "m365"], evidence: []}
  ],
  fixes: [
    {id: "reinstall7", kind: "herring", name: "Reinstall Teams on the phone", short: "Reinstall Teams", at: 3,
     desc: "Delete the app and install it again.",
     result: "The app was fine. A fresh copy signs in, the policy asks the same question about the phone, and gets the same answer: not managed.",
     ev: {t: "11:24:30", src: "Entra ID · sign-in logs", title: "Fresh Teams install: Failure 53000 again", sev: "warn", kind: "log", fields: [["Error code", "53000", "Same device, same state"]], raw: R`"status": { "errorCode": 53000 },
"deviceDetail": { "operatingSystem": "Ios 26.1", "isCompliant": false, "isManaged": false }`}},
    {id: "mfa7", kind: "herring", name: "Reset his MFA", short: "Reset MFA", at: 3,
     desc: "Make him re-register Authenticator.",
     result: "MFA was passing all along (CA001: success). After re-registering, he passes MFA again and CA020 still blocks the unmanaged phone.",
     ev: {t: "11:28:15", src: "Entra ID · sign-in logs", title: "MFA OK, CA020 still failure", sev: "warn", kind: "log", fields: [["CA001", "success", "MFA was never the issue"], ["CA020", "failure", "The phone still isn't managed"]], raw: R`"appliedConditionalAccessPolicies": [
  { "displayName": "CA001 - Require MFA for all users", "result": "success" },
  { "displayName": "CA020 - Require compliant device for mobile", "result": "failure" }
]`}},
    {id: "browser7", kind: "herring", name: "Use Teams in Safari instead", short: "Use the browser", at: 3,
     desc: "Try teams.microsoft.com in the phone's browser.",
     result: "CA020 covers browsers on iOS too, so Safari gets the same check and the same block. Working round a device policy is the wrong instinct anyway: the point is that company data only lands on managed phones.",
     ev: {t: "11:31:50", src: "Entra ID · sign-in logs", title: "Safari on iOS: Failure 53000", sev: "warn", kind: "log", fields: [["Client", "Browser (Safari)", ""], ["Error code", "53000", "Same policy"]], raw: R`"clientAppUsed": "Browser",
"status": { "errorCode": 53000 },
"deviceDetail": { "operatingSystem": "Ios 26.1", "browser": "Mobile Safari", "isCompliant": false, "isManaged": false }`}},
    {id: "enrol", kind: "fix", name: "Enrol the phone with the Company Portal app", short: "Enrol phone", at: 1,
     desc: "Install Company Portal, sign in and enrol, so Intune can check the phone.",
     result: "Once the phone is enrolled and passes the compliance checks, Intune marks it compliant and CA020 lets Teams in. Nothing about the policy had to change.",
     ev: {t: "11:38:40", src: "Intune · device audit", title: "Enrolment complete: iPhone-DANIEL (iOS)", sev: "ok", kind: "log",
       fields: [["Activity", "Enrol device", ""], ["Device", "iPhone-DANIEL", ""], ["Owner", "Corporate", "A company phone"]],
       raw: R`Date        : 24/11/2026 11:38:40
Activity    : Enrol device
Device name : iPhone-DANIEL
OS          : iOS 26.1
Ownership   : Corporate
User        : daniel.price@contoso.com
Result      : Success`}}
  ],
  debrief: {
    check: ["Sign-in log Device info: Managed? Compliant? Which OS?", "Conditional Access tab: which policy failed, and what did it require?", "Intune: does the device exist, and what's its compliance state?"],
    fix: ["Enrol the device through Company Portal", "If it's enrolled but not compliant, the Intune device page says which setting failed (passcode, OS version and so on)"],
    prevent: ["Give new phones out with enrolment instructions in the box, or use automated device enrolment (Apple Business Manager)", "Mention 'phones must be enrolled' in onboarding", "Put a link to the enrolment guide in your custom Conditional Access error text"]
  },
  tell: "MFA passes, then error 53000. The sign-in log shows an iOS device that's neither managed nor compliant, and Intune only lists the user's laptop."
},

/* ============ 8. SHARED MAILBOX NOT AUTOMAPPED ============ */
{
  id: "shared-automap", cat: "mail", name: "Can't see the shared mailbox", sub: "Access through a group doesn't automap",
  impact: "One user", services: ["Exchange Online", "Mailbox permissions", "Outlook"],
  cause: "Full Access was given through a group, and classic Outlook only automaps mailboxes when Full Access is given to the user directly",
  ticket: {ref: "INC-30182", from: "Olivia Brooks · Accounts", text: "I was told I'd have the accounts@ mailbox by now but it's not in Outlook. Waited all afternoon. My colleague has it in her folder list."},
  intro: "Olivia does have permission to open the accounts@ mailbox: the service desk added her to the group that has access. But classic Outlook only adds a shared mailbox to your folder list by itself when permission is given to you personally. Access through a group works, just not automatically. Her colleague was given access directly, years ago.",
  summary: "accounts@contoso.com grants FullAccess to the mail-enabled security group SG-Accounts-Mailbox. Automapping relies on msExchDelegateListLink, which is only written for direct user grants; Autodiscover doesn't expand group membership. So Olivia's Autodiscover response has no AlternativeMailbox entry, and classic Outlook never adds it. Outlook on the web can open it manually, which proves the permission works.",
  facts: [["Symptom", "Shared mailbox missing from classic Outlook"], ["Root cause", "Full Access through a group: no automapping"], ["Who's affected", "Anyone given access through the group"], ["Key evidence", "Permission lists the group; it opens in Outlook on the web"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Olivia's laptop", sub: "Classic Outlook", x: 110, y: 340},
    {id: "exo", kind: "cloud", label: "Exchange Online", sub: "Autodiscover", x: 400, y: 190},
    {id: "grp", kind: "server", label: "SG-Accounts-Mailbox", sub: "Mail-enabled security group", x: 680, y: 190},
    {id: "shared", kind: "mail", label: "accounts@", sub: "Shared mailbox", x: 680, y: 470}
  ],
  links: [["lap", "exo"], ["exo", "grp"], ["grp", "shared"], ["lap", "shared"]],
  lanes: ["lap", "exo", "grp", "shared"],
  stage: 7,
  steps: [
    {title: "Access given through a group", sub: "Olivia added to SG-Accounts-Mailbox", ph: 5,
     what: "This morning the service desk added Olivia to SG-Accounts-Mailbox, the group that has Full Access to accounts@. That's a tidy way to manage access, and it does give her permission.",
     check: "List the mailbox's permissions. If you see a group rather than individual people, remember that automapping won't happen for its members.",
     tech: "Get-EXOMailboxPermission shows SG-Accounts-Mailbox with FullAccess, plus one direct grant (beth.ward, from before the group existed). Olivia is a member of the group.",
     msgs: [{from: "grp", to: "shared", label: "Full Access (group)", kind: "normal"}],
     focus: ["grp", "shared"], callout: "Olivia is in the group",
     cmds: {win: R`Connect-ExchangeOnline
Get-EXOMailboxPermission -Identity accounts@contoso.com | Where-Object User -ne 'NT AUTHORITY\SELF'
Get-DistributionGroupMember -Identity SG-Accounts-Mailbox | Select-Object Name`, nix: R`admin.exchange.microsoft.com → Recipients → Mailboxes → accounts@
  → Delegation → Read and manage (Full Access)`},
     evidence: [{t: "14:10:05", src: "Exchange Online PowerShell", title: "accounts@: FullAccess for SG-Accounts-Mailbox (and Beth directly)", sev: "info", kind: "cmd",
       fields: [["SG-Accounts-Mailbox", "FullAccess", "Olivia's access comes through here"], ["beth.ward@contoso.com", "FullAccess", "Beth was given it directly, which is why hers automapped"]],
       raw: R`PS C:\> Get-EXOMailboxPermission -Identity accounts@contoso.com | Where-Object User -ne 'NT AUTHORITY\SELF'

Identity User                  AccessRights IsInherited Deny
-------- ----                  ------------ ----------- ----
accounts SG-Accounts-Mailbox   {FullAccess} False       False
accounts beth.ward@contoso.com {FullAccess} False       False

PS C:\> Get-DistributionGroupMember -Identity SG-Accounts-Mailbox | Select-Object Name

Name
----
Olivia Brooks
Kwame Mensah`}]},
    {title: "Outlook asks Autodiscover", sub: "'Which mailboxes should I show?'", ph: 7,
     what: "When classic Outlook starts, it asks Exchange which extra mailboxes to add to the folder list. Exchange only lists mailboxes you were given access to personally. It doesn't look inside groups, so accounts@ isn't on the list.",
     check: "Test E-mail AutoConfiguration (Ctrl + right-click the Outlook tray icon) shows the XML. Delegate mailboxes appear as AlternativeMailbox entries.",
     tech: "Automapping relies on a list on the shared mailbox (the msExchDelegateListLink attribute) that Exchange only fills in for direct Full Access grants made with AutoMapping on. Group membership isn't expanded during Autodiscover (Microsoft KB 3190323), so the response has no AlternativeMailbox for accounts@.",
     msgs: [{from: "lap", to: "exo", label: "Autodiscover: my mailboxes?", kind: "normal"}, {from: "exo", to: "lap", label: "Just your own", kind: "bad"}],
     callout: "Groups don't automap", fault: ["grp"], focus: ["lap", "exo", "grp"],
     cmds: {win: R`# Is Olivia listed by name? Only direct grants automap
Get-EXOMailboxPermission -Identity accounts@contoso.com -User olivia.brooks@contoso.com`, nix: R`On Olivia's PC: hold Ctrl, right-click the Outlook icon in the system tray
  → Test E-mail AutoConfiguration → untick the Guessmart options → Test → XML tab`},
     evidence: [{t: "14:16:40", src: "Olivia's PC · Test E-mail AutoConfiguration", title: "Autodiscover response: no AlternativeMailbox for accounts@", sev: "err", kind: "log",
       fields: [["AlternativeMailbox", "(none)", "Exchange isn't telling Outlook to add accounts@"], ["Why", "Access is through a group", "Autodiscover doesn't expand groups"]],
       raw: R`<Account>
  <AccountType>email</AccountType>
  <Action>settings</Action>
  <Protocol>
    <Type>EXHTTP</Type>
    <Server>outlook.office365.com</Server>
  </Protocol>
  <!-- no <AlternativeMailbox> entries -->
</Account>`}]},
    {title: "It opens in Outlook on the web", sub: "The permission does work", ph: 7,
     what: "As a test, Olivia opens Outlook on the web and uses 'Open another mailbox' to open accounts@. It opens straight away. So she definitely has access; classic Outlook just won't add it for her.",
     check: "If a mailbox opens manually but doesn't appear by itself, it's automapping, not permissions.",
     tech: "OWA and new Outlook resolve group-based FullAccess when the mailbox is opened explicitly. The gap is specific to classic Outlook's automapping.",
     msgs: [{from: "lap", to: "shared", label: "Outlook on the web: open accounts@", kind: "normal"}, {from: "shared", to: "lap", label: "Opens fine", kind: "data"}],
     focus: ["lap", "shared"], callout: "Still missing in classic Outlook",
     evidence: [{t: "14:20:12", src: "Olivia's browser · Outlook on the web", title: "accounts@ opens with 'Open another mailbox'", sev: "clue", kind: "browser",
       fields: [["Result", "Inbox loads", "She has the permission"], ["Classic Outlook", "Still not in the folder list", "Automapping is the only problem"]],
       raw: R`Outlook on the web → Open another mailbox → accounts@contoso.com
Result: the Accounts inbox opens in a new tab.`}]}
  ],
  fixed: [
    {title: "Full Access given directly", sub: "With automapping on", ph: 5,
     what: "The service desk gives Olivia Full Access to accounts@ directly, as well as through the group, with automapping switched on.",
     check: "The permission list now shows olivia.brooks@contoso.com by name.",
     tech: "Add-MailboxPermission with -AutoMapping $true writes Olivia to msExchDelegateListLink on accounts@.",
     msgs: [{from: "exo", to: "shared", label: "Full Access: Olivia (direct)", kind: "fix"}],
     focus: ["exo", "shared"],
     cmds: {win: R`Add-MailboxPermission -Identity accounts@contoso.com -User olivia.brooks@contoso.com -AccessRights FullAccess -InheritanceType All -AutoMapping $true`, nix: R`admin.exchange.microsoft.com → Recipients → Mailboxes → accounts@
  → Delegation → Read and manage (Full Access) → Edit → + Add members → Olivia
(Adding a person here, not a group, turns automapping on.)`},
     evidence: []},
    {title: "Autodiscover lists it", sub: "AlternativeMailbox: accounts@", ph: 7,
     what: "Next time Outlook asks which mailboxes to show, Exchange includes accounts@.",
     check: "Test E-mail AutoConfiguration now shows an AlternativeMailbox entry for accounts@.",
     tech: "The Autodiscover response includes AlternativeMailbox Type Delegate, SmtpAddress accounts@contoso.com. This can take a little while to show up.",
     msgs: [{from: "lap", to: "exo", label: "Autodiscover: my mailboxes?", kind: "normal"}, {from: "exo", to: "lap", label: "Yours + accounts@", kind: "data"}],
     focus: ["lap", "exo"],
     evidence: [{t: "15:05:30", src: "Olivia's PC · Test E-mail AutoConfiguration", title: "Autodiscover: AlternativeMailbox accounts@contoso.com (Delegate)", sev: "ok", kind: "log",
       fields: [["AlternativeMailbox", "accounts@contoso.com · Delegate", "Outlook will add it"]],
       raw: R`<AlternativeMailbox>
  <Type>Delegate</Type>
  <DisplayName>Accounts</DisplayName>
  <SmtpAddress>accounts@contoso.com</SmtpAddress>
</AlternativeMailbox>`}]},
    {title: "In her folder list", sub: "After an Outlook restart", ph: 7,
     what: "Olivia restarts Outlook and the Accounts mailbox appears under her own, just like her colleague's.",
     check: "Accounts shows in the folder pane without being added by hand.",
     tech: "Classic Outlook adds the automapped mailbox to the profile at start-up.",
     msgs: [{from: "lap", to: "shared", label: "Open accounts@ (automapped)", kind: "normal"}, {from: "shared", to: "lap", label: "Accounts inbox", kind: "data"}],
     focus: ["lap", "shared"], evidence: []}
  ],
  fixes: [
    {id: "newprofile8", kind: "herring", name: "Rebuild her Outlook profile", short: "New profile", at: 3,
     desc: "Create a new Outlook profile from scratch.",
     result: "A fresh profile runs Autodiscover again and gets the same answer: just her own mailbox.",
     ev: {t: "14:40:20", src: "Olivia's PC · Outlook", title: "New profile: folder list shows only Olivia's mailbox", sev: "warn", kind: "browser", fields: [["Folder list", "Olivia Brooks", "No Accounts"]], raw: R`Folder pane: olivia.brooks@contoso.com (Inbox, Drafts, Sent Items, …)`}},
    {id: "readd", kind: "herring", name: "Remove her from the group and add her back", short: "Re-add to group", at: 3,
     desc: "Take Olivia out of SG-Accounts-Mailbox and put her back.",
     result: "She's back where she started: a member of a group with Full Access. Group membership never gets her into the automapping list, however many times she's added.",
     ev: {t: "14:45:35", src: "Exchange Online PowerShell", title: "Permissions unchanged: the group, not Olivia, has Full Access", sev: "warn", kind: "cmd", fields: [["Olivia by name", "(no direct grant)", "Only direct grants automap"]], raw: R`PS C:\> Get-EXOMailboxPermission -Identity accounts@contoso.com | Where-Object User -ne 'NT AUTHORITY\SELF'

Identity User                  AccessRights IsInherited Deny
-------- ----                  ------------ ----------- ----
accounts SG-Accounts-Mailbox   {FullAccess} False       False
accounts beth.ward@contoso.com {FullAccess} False       False`}},
    {id: "wait", kind: "herring", name: "Wait an hour for it to replicate", short: "Wait", at: 3,
     desc: "Permission changes can take up to an hour to show up.",
     result: "True for direct grants, which is why it's a tempting answer. But she's been waiting since this morning, and it'll still be missing tomorrow: with access through a group, automapping never happens, however long you wait.",
     ev: {t: "14:55:00", src: "Olivia's PC · Test E-mail AutoConfiguration", title: "Still no AlternativeMailbox after waiting", sev: "warn", kind: "log", fields: [["AlternativeMailbox", "(none)", "Time doesn't help here"]], raw: R`<!-- still no <AlternativeMailbox> entries -->`}},
    {id: "direct", kind: "fix", name: "Give Olivia Full Access directly, with automapping", short: "Direct grant", at: 1,
     desc: "Add her by name to the mailbox's Full Access list with AutoMapping on.",
     result: "A direct grant puts Olivia on the mailbox's automapping list, so Autodiscover tells classic Outlook to add accounts@, and it appears after a restart. (Keeping the group for everyone else is fine; just know it won't automap.)",
     ev: {t: "14:58:10", src: "Exchange Online PowerShell", title: "Add-MailboxPermission: Olivia · FullAccess · AutoMapping on", sev: "ok", kind: "cmd",
       fields: [["User", "olivia.brooks@contoso.com", "Directly, not through a group"], ["AccessRights", "FullAccess", ""], ["AutoMapping", "$true", "Classic Outlook will add it by itself"]],
       raw: R`PS C:\> Add-MailboxPermission -Identity accounts@contoso.com -User olivia.brooks@contoso.com -AccessRights FullAccess -InheritanceType All -AutoMapping $true

Identity User                      AccessRights IsInherited Deny
-------- ----                      ------------ ----------- ----
accounts olivia.brooks@contoso.com {FullAccess} False       False`}}
  ],
  debrief: {
    check: ["Who has Full Access, people or groups? (Get-EXOMailboxPermission)", "Does it open manually in Outlook on the web? If yes, it's automapping, not permissions", "Autodiscover XML: is there an AlternativeMailbox entry?"],
    fix: ["Grant Full Access directly to the user with -AutoMapping $true", "Or have the user add it by hand (File → Account Settings → More Settings → Advanced)", "New Outlook and Outlook on the web don't rely on automapping, so the group works there"],
    prevent: ["Decide on one approach: direct grants (scripted from group membership) if people use classic Outlook", "Tell users how to add a shared mailbox themselves", "Note in the ticket template that group-based access won't automap"]
  },
  tell: "The mailbox opens fine in Outlook on the web but never appears in classic Outlook. Full Access is on a group, and Autodiscover returns no AlternativeMailbox for it."
}
]);
})();
