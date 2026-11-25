/* Cloudwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — tickets 1–4. (5–8 are in scenarios2.js.)

   HOW A TICKET IS DESCRIBED
   {
     id, cat, name, sub          id is also the #hash that opens it
     impact                      who's affected (shown as a chip)
     services: ["Entra ID", ...] the Microsoft 365 services involved
     cause                       one-line root cause (also used in Diagnose mode)
     ticket: {ref, from, text}   how the problem arrives at the service desk
     intro                       plain-English summary
     summary                     technical summary (under "Technical detail")
     facts: [[k, v], ...]
     nodes: [{id, kind, label, sub, x, y, ghost?}]   ghost = something that isn't there any more
     links, lanes                as Breachwalk
     stage: 1..7                 the journey stage where it breaks
     steps: [STEP, ...]          the broken run, ending where it fails
     fixed: [n | STEP | {use, times}, ...]   the working run: a number reuses steps[n]
     fixes: [{id, kind: "fix"|"herring", name, short, desc, result, at, ev}]
             fix:     plays the fixed run; ev shows at fixed-run step `at`
             herring: the run still breaks; result + ev show at broken-run step `at`
     debrief: {check: [], fix: [], prevent: []}
     tell                        the giveaway clues, for Diagnose mode
   }
   STEP = {title, sub, ph (1..7), what, check, tech, facts?, msgs: [{from, to, label, kind, lost?}],
           callout?, focus?, fault?: [nodeIds], cmds?: {win: PowerShell, nix: where to look in the admin centres}, evidence: [EV]}
     msg kinds: normal (blue), data (amber, replies), bad (red, the problem), fix (green)
   EV = {t, src, title, sev: err|warn|clue|info|ok, kind: cmd|log|browser, fields: [[name, value, meaning]], raw}

   Every company, person, device and domain is made up. Public IPs use the documentation ranges
   (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24); internal ones are private. IDs and GUIDs are invented. */
(function () {
const R = String.raw;
window.SCENARIOS = (window.SCENARIOS || []).concat([

/* ============ 1. NEW STARTER NOT SYNCED ============ */
{
  id: "sync-scope", cat: "identity", name: "New starter can't sign in", sub: "Made in an OU that doesn't sync",
  impact: "One new starter", services: ["Active Directory", "Entra Connect Sync", "Entra ID"],
  cause: "The account was created in an Active Directory OU that Entra Connect doesn't sync",
  ticket: {ref: "INC-30112", from: "Rachel Moore · Sales manager", text: "Leo started today. His laptop's fine but he can't log in to Outlook or Teams. It says his username may be incorrect. I've checked the spelling three times!"},
  intro: "Leo's account was made yesterday in the company's own Active Directory. But it went into a new folder (an OU) called New Starters, and the sync tool that copies accounts up to Microsoft 365 was never told about that folder. So as far as Microsoft 365 is concerned, Leo doesn't exist.",
  summary: "The service desk created leo.marsh in OU=New Starters, a new OU added last month for onboarding. Entra Connect Sync's domain and OU filtering only includes OU=Staff and OU=Groups, so the object is never imported into the connector space or exported to Entra ID. Sync itself is healthy. The sign-in fails at home-realm discovery with AADSTS50034 (UserAccountNotFound).",
  facts: [["Symptom", "'This username may be incorrect'"], ["Root cause", "OU not in Entra Connect's sync scope"], ["Who's affected", "Anyone created in OU=New Starters"], ["Key evidence", "Get-MgUser finds nothing; the OU isn't in the inclusion list"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Leo's laptop", sub: "LT-LEO · new starter", x: 120, y: 360},
    {id: "m365", kind: "cloud", label: "Microsoft 365", sub: "Outlook · Teams", x: 400, y: 470},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "contoso.onmicrosoft.com", x: 680, y: 400},
    {id: "sync", kind: "sync", label: "SYNC01", sub: "Entra Connect Sync", x: 820, y: 180},
    {id: "dc", kind: "dc", label: "DC01", sub: "Active Directory · corp.contoso.com", x: 480, y: 170}
  ],
  links: [["lap", "m365"], ["m365", "entra"], ["entra", "sync"], ["sync", "dc"]],
  lanes: ["lap", "m365", "entra", "sync", "dc"],
  stage: 1,
  steps: [
    {title: "Account made in AD", sub: "In the New Starters folder", ph: 1,
     what: "Yesterday the service desk made Leo's account in Active Directory, the company's own directory. It's enabled, it has a password, and his sign-in name is right. It went into a folder called New Starters, which someone set up last month to keep onboarding tidy.",
     check: "Look the account up in Active Directory and note which folder (OU) it lives in. The full path is the DistinguishedName.",
     tech: "Get-ADUser shows CN=Leo Marsh,OU=New Starters,OU=Contoso,DC=corp,DC=contoso,DC=com, Enabled True, UPN leo.marsh@contoso.com. Everything about the object is fine. Its location matters because Entra Connect only reads the OUs it's been told to.",
     msgs: [], focus: ["dc"], callout: "Leo is in OU=New Starters",
     cmds: {win: R`Get-ADUser leo.marsh -Properties whenCreated |
  Select-Object Name, UserPrincipalName, Enabled, DistinguishedName, whenCreated`, nix: R`Active Directory Users and Computers (on a DC or with RSAT)
  → corp.contoso.com → Contoso → New Starters
  Right-click Leo → Properties → Object tab shows the full path.`},
     evidence: [{t: "09:05:12", src: "DC01 · PowerShell", title: "Get-ADUser: Leo is enabled, in OU=New Starters", sev: "info", kind: "cmd",
       fields: [["Enabled", "True", "The account itself is fine"], ["UserPrincipalName", "leo.marsh@contoso.com", "What he types to sign in"], ["DistinguishedName", "CN=Leo Marsh,OU=New Starters,OU=Contoso,…", "The folder it lives in: remember this"], ["whenCreated", "22/11/2026 16:40", "Made yesterday afternoon"]],
       raw: R`PS C:\> Get-ADUser leo.marsh -Properties whenCreated | Select-Object Name, UserPrincipalName, Enabled, DistinguishedName, whenCreated

Name              : Leo Marsh
UserPrincipalName : leo.marsh@contoso.com
Enabled           : True
DistinguishedName : CN=Leo Marsh,OU=New Starters,OU=Contoso,DC=corp,DC=contoso,DC=com
whenCreated       : 22/11/2026 16:40:31`}]},
    {title: "Sync runs, skips him", sub: "Healthy, but blind to his OU", ph: 1,
     what: "Every 30 minutes, SYNC01 copies changes from Active Directory up to Microsoft 365. It ran overnight and this morning without a single error. But it's only been told to look in two folders, Staff and Groups. New Starters isn't one of them, so Leo is never copied up.",
     check: "On the sync server, check the scheduler is running, then check which OUs are in scope. A healthy sync that 'does nothing' for one user nearly always means filtering.",
     tech: "Get-ADSyncScheduler shows SyncCycleEnabled True and normal 30-minute delta cycles. The AD connector's partition scope (ContainerInclusionList) includes only OU=Staff and OU=Groups under OU=Contoso. Objects outside it are never imported into the connector space, so there's nothing to provision.",
     msgs: [{from: "sync", to: "dc", label: "Delta import: what's changed?", kind: "normal"}, {from: "dc", to: "sync", label: "Changes in Staff + Groups only", kind: "data"}, {from: "sync", to: "entra", label: "Export: 0 adds", kind: "normal"}],
     callout: "New Starters isn't in scope", fault: ["sync"], focus: ["sync", "dc"],
     facts: [["Sync interval", "30 minutes"], ["OUs in scope", "Staff, Groups"], ["OU not in scope", "New Starters"]],
     cmds: {win: R`# On SYNC01
Get-ADSyncScheduler
(Get-ADSyncConnector -Name "corp.contoso.com").Partitions.ConnectorPartitionScope.ContainerInclusionList`, nix: R`On SYNC01: Microsoft Entra Connect → Configure
  → Customize synchronization options → Domain and OU filtering
Ticked OUs sync. Unticked ones are ignored.`},
     evidence: [
      {t: "09:09:40", src: "SYNC01 · PowerShell", title: "Get-ADSyncScheduler: sync enabled, running every 30 minutes", sev: "info", kind: "cmd",
       fields: [["SyncCycleEnabled", "True", "Sync is switched on"], ["CurrentlyEffectiveSyncCycleInterval", "00:30:00", "Every 30 minutes"], ["StagingModeEnabled", "False", "This server really exports changes"]],
       raw: R`PS C:\> Get-ADSyncScheduler

AllowedSyncCycleInterval            : 00:30:00
CurrentlyEffectiveSyncCycleInterval : 00:30:00
CustomizedSyncCycleInterval         :
NextSyncCyclePolicyType             : Delta
NextSyncCycleStartTimeInUTC         : 23/11/2026 09:30:12
PurgeRunHistoryInterval             : 7.00:00:00
SyncCycleEnabled                    : True
MaintenanceEnabled                  : True
StagingModeEnabled                  : False`},
      {t: "09:10:05", src: "SYNC01 · PowerShell", title: "OUs in sync scope: Staff and Groups only", sev: "err", kind: "cmd",
       fields: [["Included", "OU=Staff,OU=Contoso,…", "Synced"], ["Included", "OU=Groups,OU=Contoso,…", "Synced"], ["Missing", "OU=New Starters,OU=Contoso,…", "Never read, so Leo is never copied up"]],
       raw: R`PS C:\> (Get-ADSyncConnector -Name "corp.contoso.com").Partitions.ConnectorPartitionScope.ContainerInclusionList
OU=Staff,OU=Contoso,DC=corp,DC=contoso,DC=com
OU=Groups,OU=Contoso,DC=corp,DC=contoso,DC=com`}]},
    {title: "Leo tries to sign in", sub: "Microsoft 365 has never heard of him", ph: 1,
     what: "Leo opens Outlook and types leo.marsh@contoso.com. Microsoft 365 looks him up in Entra ID, its cloud directory, and finds nobody with that name. It can't even ask for his password, so it tells him the username may be wrong.",
     check: "Search for the user in Entra ID (the admin centre or Get-MgUser). If he isn't there at all, no password reset, licence or MFA change can help: the account has to arrive first.",
     tech: "Home-realm discovery for leo.marsh@contoso.com finds the managed domain contoso.com but no matching user object, so the sign-in page shows the UserAccountNotFound message (AADSTS50034). Get-MgUser with a UPN filter returns nothing.",
     msgs: [{from: "lap", to: "m365", label: "Sign in: leo.marsh@contoso.com", kind: "normal"}, {from: "m365", to: "entra", label: "Who is this?", kind: "normal"}, {from: "entra", to: "lap", label: "No such user", kind: "bad"}],
     callout: "Not in Entra ID", focus: ["entra", "lap"],
     cmds: {win: R`Connect-MgGraph -Scopes "User.Read.All"
Get-MgUser -Filter "userPrincipalName eq 'leo.marsh@contoso.com'"`, nix: R`entra.microsoft.com → Identity → Users → All users
Search for "Leo". No result means he never arrived from AD.`},
     evidence: [
      {t: "09:12:30", src: "Leo's laptop · sign-in page", title: "'This username may be incorrect'", sev: "err", kind: "browser",
       fields: [["Message", "This username may be incorrect. Make sure you typed it correctly. Otherwise, contact your admin.", "Microsoft 365 can't find the account at all"], ["Asked for a password?", "No", "It stops before the password, because there's nobody to check it against"]],
       raw: R`Sign in
leo.marsh@contoso.com

This username may be incorrect. Make sure you typed it correctly. Otherwise, contact your admin.`},
      {t: "09:14:02", src: "Graph PowerShell", title: "Get-MgUser: no user called leo.marsh", sev: "err", kind: "cmd",
       fields: [["Result", "(nothing returned)", "There's no Leo in Entra ID"]],
       raw: R`PS C:\> Get-MgUser -Filter "userPrincipalName eq 'leo.marsh@contoso.com'"
PS C:\>`}]}
  ],
  fixed: [
    {title: "Moved to a synced OU", sub: "From New Starters to Staff", ph: 1,
     what: "The service desk moves Leo's account from New Starters into the Staff folder, which the sync tool does read. Nothing else about the account changes.",
     check: "Get-ADUser shows the new path, OU=Staff.",
     tech: "Move-ADObject relocates the object to OU=Staff,OU=Contoso. Its objectGUID, password and group memberships are unchanged.",
     msgs: [], focus: ["dc"], callout: "Leo is now in OU=Staff",
     cmds: {win: R`Get-ADUser leo.marsh | Move-ADObject -TargetPath "OU=Staff,OU=Contoso,DC=corp,DC=contoso,DC=com"
Get-ADUser leo.marsh | Select-Object DistinguishedName`, nix: R`Active Directory Users and Computers: drag Leo from New Starters to Staff
(or right-click → Move…)`},
     evidence: []},
    {title: "Delta sync picks him up", sub: "One new user exported", ph: 1,
     what: "Rather than wait up to 30 minutes, the service desk runs a sync now. This time SYNC01 sees Leo in a folder it reads, and copies him up to Entra ID.",
     check: "Run a delta sync, then search for Leo in Entra ID. He now shows as 'synced from on-premises'.",
     tech: "Start-ADSyncSyncCycle -PolicyType Delta imports the object into the connector space, joins it to a new metaverse object and exports an add to Entra ID. Get-MgUser now returns the user with OnPremisesSyncEnabled True.",
     msgs: [{from: "sync", to: "dc", label: "Delta import", kind: "normal"}, {from: "dc", to: "sync", label: "1 new user: Leo Marsh", kind: "data"}, {from: "sync", to: "entra", label: "Export: 1 add", kind: "fix"}],
     focus: ["sync", "entra"],
     cmds: {win: R`# On SYNC01
Start-ADSyncSyncCycle -PolicyType Delta

# A couple of minutes later
Get-MgUser -Filter "userPrincipalName eq 'leo.marsh@contoso.com'" -Property DisplayName,UserPrincipalName,OnPremisesSyncEnabled |
  Select-Object DisplayName, UserPrincipalName, OnPremisesSyncEnabled`, nix: R`entra.microsoft.com → Identity → Users → All users
Leo now appears, with "On-premises sync enabled: Yes".`},
     evidence: [
      {t: "09:31:10", src: "SYNC01 · PowerShell", title: "Start-ADSyncSyncCycle: Success", sev: "info", kind: "cmd",
       fields: [["Result", "Success", "The sync cycle started"]],
       raw: R`PS C:\> Start-ADSyncSyncCycle -PolicyType Delta

Result
------
Success`},
      {t: "09:33:45", src: "Graph PowerShell", title: "Get-MgUser: Leo Marsh, synced from on-premises", sev: "ok", kind: "cmd",
       fields: [["DisplayName", "Leo Marsh", "He exists in the cloud now"], ["OnPremisesSyncEnabled", "True", "Managed from Active Directory"]],
       raw: R`PS C:\> Get-MgUser -Filter "userPrincipalName eq 'leo.marsh@contoso.com'" -Property DisplayName,UserPrincipalName,OnPremisesSyncEnabled |
  Select-Object DisplayName, UserPrincipalName, OnPremisesSyncEnabled

DisplayName UserPrincipalName      OnPremisesSyncEnabled
----------- -----------------      ---------------------
Leo Marsh   leo.marsh@contoso.com  True`}]},
    {title: "Leo signs in", sub: "Password, then MFA set-up", ph: 7,
     what: "Leo tries again. This time Microsoft 365 finds him, asks for his password, and walks him through setting up the Authenticator app. Outlook and Teams open.",
     check: "The sign-in logs now show a successful sign-in for Leo.",
     tech: "Password hash sync means his AD password works in the cloud. The MFA registration campaign prompts him to register Authenticator. His licence arrives through the LIC-M365-E3 group, which also syncs from AD.",
     msgs: [{from: "lap", to: "m365", label: "Sign in: leo.marsh@contoso.com", kind: "normal"}, {from: "m365", to: "entra", label: "Who is this?", kind: "normal"}, {from: "entra", to: "lap", label: "Found. Password + MFA set-up", kind: "data"}, {from: "m365", to: "lap", label: "Outlook and Teams open", kind: "data"}],
     focus: ["lap", "entra"],
     evidence: [{t: "09:41:20", src: "Entra ID · sign-in logs", title: "Leo Marsh · Microsoft Teams · Success", sev: "ok", kind: "log",
       fields: [["Status", "Success", ""], ["Application", "Microsoft Teams", ""], ["IP address", "203.0.113.10", "The office"]],
       raw: R`{
  "createdDateTime": "2026-11-23T09:41:20Z",
  "userDisplayName": "Leo Marsh",
  "userPrincipalName": "leo.marsh@contoso.com",
  "appDisplayName": "Microsoft Teams",
  "ipAddress": "203.0.113.10",
  "conditionalAccessStatus": "success",
  "status": { "errorCode": 0 }
}`}]}
  ],
  fixes: [
    {id: "reset", kind: "herring", name: "Reset Leo's password", short: "Password reset", at: 3,
     desc: "Set a new password in Active Directory.",
     result: "The password changes in AD, but the account still isn't in the cloud, and the sign-in page never gets as far as asking for a password. Same message.",
     ev: {t: "09:18:30", src: "Leo's laptop · sign-in page", title: "After the reset: 'This username may be incorrect' again", sev: "warn", kind: "browser", fields: [["Message", "This username may be incorrect…", "It still can't find him"]], raw: R`This username may be incorrect. Make sure you typed it correctly. Otherwise, contact your admin.`}},
    {id: "forcesync", kind: "herring", name: "Force a delta sync now", short: "Force sync", at: 2,
     desc: "Run Start-ADSyncSyncCycle on SYNC01.",
     result: "Sync wasn't broken, so running it again changes nothing: it happily reads Staff and Groups and skips New Starters again. Still 0 adds.",
     ev: {t: "09:11:15", src: "SYNC01 · PowerShell", title: "Forced delta sync: Success, but Leo still isn't exported", sev: "warn", kind: "cmd", fields: [["Result", "Success", "It ran fine. That was never the problem"]], raw: R`PS C:\> Start-ADSyncSyncCycle -PolicyType Delta

Result
------
Success`}},
    {id: "licence", kind: "herring", name: "Assign him a licence in the admin centre", short: "Assign licence", at: 3,
     desc: "Give Leo a Microsoft 365 E3 licence directly.",
     result: "You can't licence an account that doesn't exist. The admin centre has no Leo to pick, and Graph says the user doesn't exist.",
     ev: {t: "09:20:05", src: "Graph PowerShell", title: "Set-MgUserLicense: Resource 'leo.marsh@contoso.com' does not exist", sev: "warn", kind: "cmd", fields: [["Error", "Request_ResourceNotFound", "There's no user to licence"]], raw: R`PS C:\> Set-MgUserLicense -UserId leo.marsh@contoso.com -AddLicenses @{SkuId = $e3.SkuId} -RemoveLicenses @()
Set-MgUserLicense_AssignExpanded: Resource 'leo.marsh@contoso.com' does not exist or one of its queried reference-property objects are not present.

Status: 404 (NotFound)
ErrorCode: Request_ResourceNotFound`}},
    {id: "moveou", kind: "fix", name: "Move Leo into a synced OU, then run a delta sync", short: "Synced OU", at: 1,
     desc: "Move the account from New Starters into Staff, which Entra Connect reads.",
     result: "Once Leo is in an OU that Entra Connect syncs, the next sync copies him up to Entra ID, and he can sign in. (Adding New Starters to the sync scope would work too, for everyone created there.)",
     ev: {t: "09:30:20", src: "DC01 · PowerShell", title: "Move-ADObject: Leo moved to OU=Staff", sev: "ok", kind: "cmd",
       fields: [["New path", "CN=Leo Marsh,OU=Staff,OU=Contoso,…", "An OU that syncs"]],
       raw: R`PS C:\> Get-ADUser leo.marsh | Move-ADObject -TargetPath "OU=Staff,OU=Contoso,DC=corp,DC=contoso,DC=com"
PS C:\> Get-ADUser leo.marsh | Select-Object DistinguishedName

DistinguishedName
-----------------
CN=Leo Marsh,OU=Staff,OU=Contoso,DC=corp,DC=contoso,DC=com`}}
  ],
  debrief: {
    check: ["Does the user exist in Entra ID at all? (Get-MgUser or the Users list)", "Which OU is the account in? (DistinguishedName in AD)", "Which OUs does Entra Connect sync? (Domain and OU filtering)", "Is sync itself healthy? (Get-ADSyncScheduler, sync history)"],
    fix: ["Move the account into an OU that syncs, then run a delta sync", "Or add the new OU to Entra Connect's filtering, so everyone created there syncs"],
    prevent: ["Whenever someone creates an OU for users, update the sync scope at the same time", "Make 'check the user appears in Entra ID' a step in the new-starter checklist", "Create new starters a day or two before they arrive, so problems surface early"]
  },
  tell: "The account is fine in AD but missing from Entra ID, the sync runs without errors, and the user's OU isn't in the sync scope. The sign-in page says the username may be incorrect."
},

/* ============ 2. NEW PHONE, NO MFA ============ */
{
  id: "mfa-newphone", cat: "signin", name: "New phone, no MFA codes", sub: "Authenticator is on the old phone",
  impact: "One user", services: ["Entra ID", "Authentication methods", "Microsoft Authenticator"],
  cause: "The only MFA method registered is Authenticator on a phone the user no longer has",
  ticket: {ref: "INC-30127", from: "Aisha Rahman · Marketing", text: "Got a new phone at the weekend and traded the old one in. Now I can't get into anything. It keeps saying to approve the sign-in on my phone but nothing comes up!"},
  intro: "Aisha's password is fine. The problem is the second check: Microsoft sends the 'approve this sign-in' prompt to the Authenticator app on her old phone, which she's traded in. Her new phone has the app installed but isn't linked to her account, and she has no other way to prove it's her.",
  summary: "Aisha's only registered strong method is Microsoft Authenticator on the old device (iPhone 13). Conditional Access policy CA001 requires MFA for all users. Primary authentication succeeds, the push goes to the old device, nobody responds, and the sign-in fails with 500121. The fix is to verify her identity out of band, delete the stale method and issue a Temporary Access Pass so she can register the new phone.",
  facts: [["Symptom", "Approval prompt never arrives"], ["Root cause", "Only MFA method is on the traded-in phone"], ["Who's affected", "Just Aisha"], ["Key evidence", "500121 in sign-in logs; one Authenticator method, on the old phone"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Aisha's laptop", sub: "LT-AISHA", x: 120, y: 330},
    {id: "newp", kind: "phone", label: "New phone", sub: "Authenticator: no accounts", x: 300, y: 520},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "Sign-in + MFA", x: 520, y: 220},
    {id: "oldp", kind: "phone", label: "Old phone", sub: "Traded in at the weekend", x: 820, y: 360, ghost: true},
    {id: "m365", kind: "cloud", label: "Microsoft 365", sub: "Outlook · Teams", x: 840, y: 140}
  ],
  links: [["lap", "entra"], ["newp", "entra"], ["entra", "oldp"], ["entra", "m365"]],
  lanes: ["lap", "newp", "entra", "oldp", "m365"],
  stage: 2,
  steps: [
    {title: "Password accepted", sub: "The first check works", ph: 2,
     what: "Aisha types her email and password on her laptop. Both are correct, so Entra ID moves on to the second check, as the company's rules require for every sign-in.",
     check: "In the sign-in logs, a correct password followed by an MFA failure tells you the password isn't the problem.",
     tech: "Primary authentication succeeds (password hash sync). Conditional Access policy CA001 'Require MFA for all users' applies, so Entra ID issues an MFA challenge using her default method: Microsoft Authenticator notification.",
     msgs: [{from: "lap", to: "entra", label: "Email + password", kind: "normal"}, {from: "entra", to: "lap", label: "Correct. Now approve on your phone", kind: "data"}],
     focus: ["lap", "entra"], evidence: []},
    {title: "Prompt goes to the old phone", sub: "Nobody there to tap Approve", ph: 2,
     what: "Entra ID sends the 'approve this sign-in' prompt to the only phone it knows about: the old one, now in a trade-in warehouse. Aisha's new phone has Authenticator installed, but it's empty, so nothing appears on it.",
     check: "List the user's authentication methods. If the only Authenticator entry is the old phone's model, that's your answer.",
     tech: "The user has two methods: password, and one microsoftAuthenticatorAuthenticationMethod (displayName 'iPhone 13', registered March 2024). There is no phone number, FIDO2 key or second device. The push notification is delivered to a device that's no longer in use.",
     msgs: [{from: "entra", to: "oldp", label: "Approve sign-in? Enter 47", kind: "normal", lost: "No one there"}],
     callout: "Only method: the old phone", fault: ["oldp"], focus: ["entra", "oldp", "newp"],
     cmds: {win: R`Connect-MgGraph -Scopes "UserAuthenticationMethod.Read.All"
Get-MgUserAuthenticationMethod -UserId aisha.rahman@contoso.com |
  Select-Object Id, @{n='Type';e={$_.AdditionalProperties['@odata.type']}}
Get-MgUserAuthenticationMicrosoftAuthenticatorMethod -UserId aisha.rahman@contoso.com |
  Select-Object DisplayName, DeviceTag, PhoneAppVersion, CreatedDateTime`, nix: R`entra.microsoft.com → Identity → Users → Aisha Rahman
  → Authentication methods
Shows each registered method and which device it's on.`},
     evidence: [{t: "10:02:40", src: "Graph PowerShell", title: "Aisha's only Authenticator method is on an 'iPhone 13'", sev: "err", kind: "cmd",
       fields: [["Methods", "Password, Microsoft Authenticator", "Nothing else to fall back on"], ["DisplayName", "iPhone 13", "Her old phone"], ["CreatedDateTime", "04/03/2024", "Set up two and a half years ago"]],
       raw: R`PS C:\> Get-MgUserAuthenticationMethod -UserId aisha.rahman@contoso.com |
  Select-Object Id, @{n='Type';e={$_.AdditionalProperties['@odata.type']}}

Id                                   Type
--                                   ----
28c10230-6103-485e-b985-444c60001490 #microsoft.graph.passwordAuthenticationMethod
5f8a1b3c-2d4e-4f60-9a7b-8c9d0e1f2a3b #microsoft.graph.microsoftAuthenticatorAuthenticationMethod

PS C:\> Get-MgUserAuthenticationMicrosoftAuthenticatorMethod -UserId aisha.rahman@contoso.com |
  Select-Object DisplayName, DeviceTag, PhoneAppVersion, CreatedDateTime

DisplayName DeviceTag     PhoneAppVersion CreatedDateTime
----------- ---------     --------------- ---------------
iPhone 13   SoftwareTokenActivated 6.8.3  04/03/2024 08:15:22`}]},
    {title: "The sign-in fails", sub: "Error 500121", ph: 2,
     what: "After a while the prompt times out and Aisha gets an error. The sign-in log records it as a failed second check. Her new phone's Authenticator app is still empty: there's nothing she can do from her side.",
     check: "Find the failed sign-in in the sign-in logs. Error 500121 means the MFA step wasn't completed.",
     tech: "Sign-in log: errorCode 500121, failureReason 'Authentication failed during strong authentication request.' CA001 shows as applied. Per Microsoft's troubleshooting guidance, 500121 means the user didn't complete the MFA prompt.",
     msgs: [{from: "entra", to: "lap", label: "MFA not completed (500121)", kind: "bad"}],
     callout: "Sign-in failed: 500121", focus: ["lap", "entra", "newp"],
     cmds: {win: R`Connect-MgGraph -Scopes "AuditLog.Read.All"
Get-MgAuditLogSignIn -Filter "userPrincipalName eq 'aisha.rahman@contoso.com'" -Top 5 |
  Select-Object CreatedDateTime, AppDisplayName, @{n='Error';e={$_.Status.ErrorCode}}, @{n='Reason';e={$_.Status.FailureReason}}`, nix: R`entra.microsoft.com → Identity → Monitoring & health → Sign-in logs
Filter: User = Aisha, Status = Failure. Open the entry and check
"Authentication Details" to see which method was tried.`},
     evidence: [
      {t: "10:04:18", src: "Entra ID · sign-in logs", title: "Aisha Rahman · Outlook · Failure 500121", sev: "err", kind: "log",
       fields: [["Error code", "500121", "The MFA step wasn't completed"], ["Failure reason", "Authentication failed during strong authentication request.", ""], ["Conditional Access", "CA001 - Require MFA for all users", "Why MFA was asked for"], ["IP address", "203.0.113.10", "The office, so not a location problem"]],
       raw: R`{
  "createdDateTime": "2026-11-23T10:04:18Z",
  "userDisplayName": "Aisha Rahman",
  "userPrincipalName": "aisha.rahman@contoso.com",
  "appDisplayName": "Microsoft Outlook",
  "ipAddress": "203.0.113.10",
  "correlationId": "7c1f2e9a-4b6d-4e8f-a0c2-3d5e7f9a1b4c",
  "status": {
    "errorCode": 500121,
    "failureReason": "Authentication failed during strong authentication request."
  },
  "appliedConditionalAccessPolicies": [
    { "displayName": "CA001 - Require MFA for all users", "enforcedGrantControls": ["Mfa"], "result": "failure" }
  ]
}`},
      {t: "10:05:02", src: "New phone · Authenticator app", title: "Authenticator on the new phone: no accounts", sev: "clue", kind: "browser",
       fields: [["Accounts", "None", "Installing the app doesn't link it to her work account"]],
       raw: R`Authenticator
No accounts added yet.
[ Add account ]`}]}
  ],
  fixed: [
    {title: "Check it's her, issue a pass", sub: "Old phone removed, TAP created", ph: 2,
     what: "The service desk checks it's really Aisha (a video call, with her manager confirming), removes the old phone from her account, and creates a Temporary Access Pass: a one-time code that works for an hour, read out to her on the call.",
     check: "Her authentication methods now show the password and a Temporary Access Pass, and no old iPhone.",
     tech: "Remove-MgUserAuthenticationMicrosoftAuthenticatorMethod deletes the stale device. New-MgUserAuthenticationTemporaryAccessPassMethod creates a one-time TAP with a 60-minute lifetime. TAP must be enabled in the Authentication methods policy for her group.",
     msgs: [], focus: ["entra"], callout: "Temporary Access Pass issued",
     cmds: {win: R`# After verifying who's asking (never just because they phoned in)
$old = Get-MgUserAuthenticationMicrosoftAuthenticatorMethod -UserId aisha.rahman@contoso.com
Remove-MgUserAuthenticationMicrosoftAuthenticatorMethod -UserId aisha.rahman@contoso.com -MicrosoftAuthenticatorAuthenticationMethodId $old.Id

New-MgUserAuthenticationTemporaryAccessPassMethod -UserId aisha.rahman@contoso.com -IsUsableOnce -LifetimeInMinutes 60`, nix: R`entra.microsoft.com → Users → Aisha Rahman → Authentication methods
  → delete the old Microsoft Authenticator entry
  → + Add authentication method → Temporary Access Pass`},
     evidence: []},
    {title: "Sign in with the pass", sub: "Straight to 'set up security info'", ph: 2,
     what: "Aisha signs in on her laptop with the Temporary Access Pass instead of her password. Because it's a strong one-time code, it counts as MFA, and she's taken straight to set up her new phone.",
     check: "The sign-in log shows success, with Temporary Access Pass as the method.",
     tech: "TAP satisfies the MFA requirement in CA001. The user lands on the combined security info registration experience.",
     msgs: [{from: "lap", to: "entra", label: "Temporary Access Pass", kind: "fix"}, {from: "entra", to: "lap", label: "Signed in. Set up your phone", kind: "data"}],
     focus: ["lap", "entra"],
     evidence: [{t: "10:31:55", src: "Entra ID · sign-in logs", title: "Aisha Rahman · My Security Info · Success (Temporary Access Pass)", sev: "ok", kind: "log",
       fields: [["Status", "Success", ""], ["Method", "Temporary Access Pass", "The one-time code counted as strong authentication"]],
       raw: R`{
  "createdDateTime": "2026-11-23T10:31:55Z",
  "userPrincipalName": "aisha.rahman@contoso.com",
  "appDisplayName": "My Signins",
  "conditionalAccessStatus": "success",
  "status": { "errorCode": 0 },
  "authenticationDetails": [
    { "authenticationMethod": "Temporary Access Pass", "succeeded": true }
  ]
}`}]},
    {title: "New phone registered", sub: "Authenticator linked", ph: 2,
     what: "Aisha scans the QR code with Authenticator on her new phone. Entra ID now knows about the new phone, and the old one is gone for good.",
     check: "The audit log shows 'User registered security info', and her methods list the new phone.",
     tech: "The app registers a new microsoftAuthenticatorAuthenticationMethod (displayName 'iPhone 16'). The one-time TAP is now used up.",
     msgs: [{from: "newp", to: "entra", label: "Register Authenticator", kind: "fix"}, {from: "entra", to: "newp", label: "Registered", kind: "data"}],
     focus: ["newp", "entra"],
     evidence: [{t: "10:33:12", src: "Entra ID · audit logs", title: "User registered security info: Microsoft Authenticator (iPhone 16)", sev: "ok", kind: "log",
       fields: [["Activity", "User registered security info", ""], ["Method", "Microsoft Authenticator", "On the new phone"]],
       raw: R`Date            : 23/11/2026 10:33:12
Service         : Authentication Methods
Category        : UserManagement
Activity        : User registered security info
Status          : Success
Initiated by    : aisha.rahman@contoso.com
Target          : Aisha Rahman
Additional info : Microsoft Authenticator · iPhone 16`}]},
    {title: "Back to normal", sub: "Prompt arrives on the new phone", ph: 7,
     what: "Next time Aisha opens Outlook, the approve prompt pops up on her new phone. She taps it and she's in.",
     check: "A normal sign-in with Microsoft Authenticator as the method, and success.",
     tech: "Standard password + Authenticator push (with number matching) satisfies CA001.",
     msgs: [{from: "lap", to: "entra", label: "Email + password", kind: "normal"}, {from: "entra", to: "newp", label: "Approve sign-in? Enter 82", kind: "normal"}, {from: "newp", to: "entra", label: "Approved", kind: "data"}, {from: "entra", to: "m365", label: "Token issued", kind: "data"}],
     focus: ["lap", "newp", "entra", "m365"],
     evidence: [{t: "10:36:40", src: "Entra ID · sign-in logs", title: "Aisha Rahman · Outlook · Success (Authenticator)", sev: "ok", kind: "log",
       fields: [["Status", "Success", ""], ["MFA", "Microsoft Authenticator (iPhone 16)", ""]],
       raw: R`{
  "createdDateTime": "2026-11-23T10:36:40Z",
  "userPrincipalName": "aisha.rahman@contoso.com",
  "appDisplayName": "Microsoft Outlook",
  "status": { "errorCode": 0 },
  "authenticationDetails": [
    { "authenticationMethod": "Password", "succeeded": true },
    { "authenticationMethod": "Mobile app notification", "succeeded": true }
  ]
}`}]}
  ],
  fixes: [
    {id: "pwreset", kind: "herring", name: "Reset Aisha's password", short: "Password reset", at: 3,
     desc: "Give her a new password.",
     result: "Her password was already working: the logs show it was accepted. A new one gets her to exactly the same place, waiting for an approval on a phone she hasn't got.",
     ev: {t: "10:12:30", src: "Entra ID · sign-in logs", title: "After the reset: password OK, Failure 500121 again", sev: "warn", kind: "log", fields: [["Error code", "500121", "Same MFA failure"]], raw: R`"status": { "errorCode": 500121, "failureReason": "Authentication failed during strong authentication request." }`}},
    {id: "reinstall", kind: "herring", name: "Reinstall Authenticator on the new phone", short: "Reinstall app", at: 3,
     desc: "Delete and reinstall the app.",
     result: "The app on the new phone was never the problem. A fresh install is still empty, because her account in Entra ID still points at the old phone. Someone has to give her a way back in first.",
     ev: {t: "10:15:10", src: "New phone · Authenticator app", title: "Reinstalled: still no accounts", sev: "warn", kind: "browser", fields: [["Accounts", "None", "Nothing to restore from"]], raw: R`Authenticator
No accounts added yet.`}},
    {id: "nomfa", kind: "herring", name: "Turn off per-user MFA for Aisha", short: "MFA off", at: 3,
     desc: "Switch MFA off for her in the legacy per-user MFA page.",
     result: "Per-user MFA was already off. Contoso enforces MFA with Conditional Access policy CA001, so she's still asked. Even if it had 'worked', switching MFA off for someone because they've lost their phone is exactly what an attacker on the phone would hope for.",
     ev: {t: "10:18:45", src: "Entra ID · sign-in logs", title: "Still challenged: CA001 requires MFA", sev: "warn", kind: "log", fields: [["Policy", "CA001 - Require MFA for all users", "MFA comes from here, not per-user settings"]], raw: R`"appliedConditionalAccessPolicies": [
  { "displayName": "CA001 - Require MFA for all users", "enforcedGrantControls": ["Mfa"], "result": "failure" }
]`}},
    {id: "tap", kind: "fix", name: "Check it's her, remove the old phone and issue a Temporary Access Pass", short: "TAP", at: 1,
     desc: "Verify her identity properly, delete the stale Authenticator entry, give her a one-hour, one-time pass.",
     result: "The pass lets Aisha sign in once without the old phone and register Authenticator on the new one. The old phone is removed from her account, so nobody who finds it can use it.",
     ev: {t: "10:28:30", src: "Graph PowerShell", title: "Old method removed, one-time TAP created (60 minutes)", sev: "ok", kind: "cmd",
       fields: [["IsUsableOnce", "True", "Works for one sign-in"], ["LifetimeInMinutes", "60", "Then it expires"], ["MethodUsabilityReason", "EnabledByPolicy", "TAP is allowed for her"]],
       raw: R`PS C:\> Remove-MgUserAuthenticationMicrosoftAuthenticatorMethod -UserId aisha.rahman@contoso.com -MicrosoftAuthenticatorAuthenticationMethodId 5f8a1b3c-2d4e-4f60-9a7b-8c9d0e1f2a3b
PS C:\> New-MgUserAuthenticationTemporaryAccessPassMethod -UserId aisha.rahman@contoso.com -IsUsableOnce -LifetimeInMinutes 60

Id                                   CreatedDateTime     IsUsable IsUsableOnce LifetimeInMinutes MethodUsabilityReason TemporaryAccessPass
--                                   ---------------     -------- ------------ ----------------- --------------------- -------------------
b2e4d6f8-1a3c-4e5f-8b7d-9c0e2f4a6b8d 23/11/2026 10:28:30 True     True         60                EnabledByPolicy       (read out on the call)`}}
  ],
  debrief: {
    check: ["Sign-in logs: password OK but MFA failed (500121)?", "Authentication methods: which devices are registered, and is there any backup?", "Which policy asks for MFA (Conditional Access or per-user)?"],
    fix: ["Verify the person properly before touching their MFA (call back, video, manager)", "Delete the stale Authenticator method", "Issue a short, one-time Temporary Access Pass so they can register the new phone"],
    prevent: ["Ask everyone to register a second method (a FIDO2 key, or Authenticator on a second device)", "Tell staff to move Authenticator before trading in a phone", "Have a written identity-check process for MFA resets, because attackers phone service desks too"]
  },
  tell: "The password is accepted, then MFA fails with 500121. The only Authenticator method is named after an old phone, and the new phone's app has no accounts."
},

/* ============ 3. BLOCKED ABROAD ============ */
{
  id: "ca-travel", cat: "access", name: "Can't log in from the hotel", sub: "Blocked outside the UK",
  impact: "One user, travelling", services: ["Entra ID", "Conditional Access", "Named locations"],
  cause: "A Conditional Access policy blocks sign-ins from outside the UK, and she isn't in the travel exception group",
  ticket: {ref: "INC-30141", from: "Grace Liu · Sales director", text: "In Lisbon for the client meeting tomorrow. Outlook and Teams both say 'You cannot access this right now'. I signed in fine, approved it on my phone and everything. Urgent please!"},
  intro: "Grace's password and phone approval both work. But the company has a rule that blocks any sign-in from outside the UK, and she's in Portugal. The rule has a way round it, a travel exception group, but nobody added her before the trip.",
  summary: "Conditional Access policy CA010 'Block sign-ins outside the UK' targets all users except the CA010-Travel-Exception group, with the condition 'any location except the named location UK'. Grace's sign-in from 192.0.2.80 (geolocated to Lisbon, PT) completes primary auth and MFA, then CA010 evaluates to failure with grant control Block, giving AADSTS53003.",
  facts: [["Symptom", "'You cannot access this right now', error 53003"], ["Root cause", "Country block in CA010"], ["Who's affected", "Anyone abroad without an exception"], ["Key evidence", "Sign-in log: CA010 result failure, location PT"]],
  nodes: [
    {id: "lap", kind: "laptop", label: "Grace's laptop", sub: "Hotel Wi-Fi, Lisbon", x: 110, y: 340},
    {id: "wifi", kind: "ap", label: "Hotel Wi-Fi", sub: "Out via 192.0.2.80", x: 300, y: 170},
    {id: "entra", kind: "idp", label: "Entra ID", sub: "Password + MFA", x: 540, y: 360},
    {id: "ca", kind: "gate", label: "CA010", sub: "Block sign-ins outside the UK", x: 760, y: 200},
    {id: "m365", kind: "cloud", label: "Microsoft 365", sub: "Outlook · Teams", x: 900, y: 420}
  ],
  links: [["lap", "wifi"], ["wifi", "entra"], ["entra", "ca"], ["ca", "m365"]],
  lanes: ["lap", "wifi", "entra", "ca", "m365"],
  stage: 3,
  steps: [
    {title: "Password and MFA", sub: "Both work", ph: 2,
     what: "From her hotel room, Grace opens Outlook. She types her password and approves the prompt on her phone. Both checks pass: Entra ID knows it's really her.",
     check: "In the sign-in log, the Authentication Details tab shows password and MFA both succeeded. That rules out her password and phone.",
     tech: "Primary auth and Authenticator push both succeed. The request leaves the hotel network from 192.0.2.80, which Entra ID geolocates to Lisbon, Portugal.",
     msgs: [{from: "lap", to: "wifi", label: "Open Outlook", kind: "normal"}, {from: "wifi", to: "entra", label: "Password + MFA from 192.0.2.80", kind: "normal"}, {from: "entra", to: "lap", label: "Both correct", kind: "data"}],
     focus: ["lap", "wifi", "entra"], evidence: []},
    {title: "Location check", sub: "CA010: UK only", ph: 3,
     what: "Before giving Grace access, Entra ID runs the company's Conditional Access rules. One of them, CA010, says: block anyone signing in from outside the UK, unless they're in the travel exception group. Grace is in Portugal and not in the group, so she's blocked.",
     check: "Open the failed sign-in and go to the Conditional Access tab. It names the exact policy that blocked it and the location it saw.",
     tech: "CA010 conditions: users = All users, excluding CA010-Travel-Exception; locations = Any location, excluding the named location 'UK' (country-based). Grant = Block access. The sign-in's location is PT, so the policy applies and evaluates to failure. CA001 (MFA) was satisfied.",
     msgs: [{from: "entra", to: "ca", label: "Grace, from Lisbon (PT)", kind: "normal"}, {from: "ca", to: "entra", label: "Block: not in the UK", kind: "bad"}],
     callout: "Blocked by CA010", fault: ["ca"], focus: ["entra", "ca"],
     facts: [["Policy", "CA010 - Block sign-ins outside the UK"], ["Allowed location", "UK (named location)"], ["Excluded group", "CA010-Travel-Exception"], ["Grace in that group?", "No"]],
     cmds: {win: R`Connect-MgGraph -Scopes "AuditLog.Read.All","Policy.Read.All"
$s = Get-MgAuditLogSignIn -Filter "userPrincipalName eq 'grace.liu@contoso.com'" -Top 1
$s.Location | Select-Object City, CountryOrRegion
$s.AppliedConditionalAccessPolicies | Where-Object Result -ne 'notApplied' |
  Select-Object DisplayName, Result, EnforcedGrantControls`, nix: R`entra.microsoft.com → Identity → Monitoring & health → Sign-in logs
Open the failed entry → Conditional Access tab
(Or: Protection → Conditional Access → What If, with Grace and country Portugal)`},
     evidence: [{t: "21:14:06", src: "Entra ID · sign-in logs", title: "Grace Liu · Outlook · Failure 53003 · CA010 failure", sev: "err", kind: "log",
       fields: [["Error code", "53003", "Blocked by Conditional Access"], ["Location", "Lisbon, PT", "Outside the UK"], ["CA010", "failure · Block", "The policy that blocked her"], ["CA001 (MFA)", "success", "Her MFA was fine"]],
       raw: R`{
  "createdDateTime": "2026-11-23T21:14:06Z",
  "userDisplayName": "Grace Liu",
  "userPrincipalName": "grace.liu@contoso.com",
  "appDisplayName": "Microsoft Outlook",
  "ipAddress": "192.0.2.80",
  "location": { "city": "Lisbon", "countryOrRegion": "PT" },
  "conditionalAccessStatus": "failure",
  "status": {
    "errorCode": 53003,
    "failureReason": "Access has been blocked by Conditional Access policies. The access policy does not allow token issuance."
  },
  "appliedConditionalAccessPolicies": [
    { "displayName": "CA001 - Require MFA for all users", "enforcedGrantControls": ["Mfa"], "result": "success" },
    { "displayName": "CA010 - Block sign-ins outside the UK", "enforcedGrantControls": ["Block"], "result": "failure" }
  ]
}`}]},
    {title: "'You cannot access this right now'", sub: "Error 53003", ph: 3,
     what: "Grace sees a message saying her sign-in worked but doesn't meet the rules to get in. It's confusing, because she did everything right. The block is about where she is, not who she is.",
     check: "The 53003 code and the words 'sign-in was successful but' point straight at Conditional Access, not her password or MFA.",
     tech: "The client shows the AADSTS53003 interrupt page with the request ID, correlation ID and device state, which you can use to find the exact sign-in log entry.",
     msgs: [{from: "entra", to: "lap", label: "You cannot access this right now", kind: "bad"}],
     callout: "53003: blocked by policy", focus: ["lap", "entra"],
     evidence: [{t: "21:14:07", src: "Grace's laptop · sign-in window", title: "'You cannot access this right now' · Error Code 53003", sev: "err", kind: "browser",
       fields: [["Message", "Your sign-in was successful but does not meet the criteria to access this resource.", "She got in, then a rule stopped her"], ["Error Code", "53003", ""], ["Correlation Id", "3e9b1d7f-…", "Use this to find the sign-in log entry"]],
       raw: R`You cannot access this right now

Your sign-in was successful but does not meet the criteria to access this resource. For example, you might be signing in from a browser, app, or location that is restricted by your admin.

Error Code: 53003
Correlation Id: 3e9b1d7f-6a2c-4f08-b5e1-9d4c2a7f6e30
Timestamp: 2026-11-23T21:14:07Z`}]}
  ],
  fixed: [
    {title: "Approved travel exception", sub: "Added to the group, with an end date", ph: 3,
     what: "Her manager approves the trip, and the service desk adds Grace to the travel exception group, with a note to remove her when she's back on Friday.",
     check: "The audit log shows 'Add member to group' for CA010-Travel-Exception.",
     tech: "Adding Grace to CA010-Travel-Exception excludes her from CA010. Use an access package or a dated reminder so the exception expires; a permanent exclusion is a permanent hole.",
     msgs: [], focus: ["ca"], callout: "Grace excluded until Friday",
     cmds: {win: R`$g = Get-MgGroup -Filter "displayName eq 'CA010-Travel-Exception'"
$u = Get-MgUser -UserId grace.liu@contoso.com
New-MgGroupMember -GroupId $g.Id -DirectoryObjectId $u.Id`, nix: R`entra.microsoft.com → Groups → CA010-Travel-Exception → Members → + Add members
Better: an access package in Identity Governance with an expiry date.`},
     evidence: []},
    {use: 0, times: []},
    {title: "Location check passes", sub: "CA010 doesn't apply to her now", ph: 3,
     what: "This time CA010 sees that Grace is in the exception group and skips her. The MFA rule still applies, and she's already passed it, so Entra ID lets her in.",
     check: "In the new sign-in log entry, CA010 shows 'Not applied' and CA001 shows 'Success'.",
     tech: "CA010 result notApplied (user excluded). CA001 satisfied by MFA. Token issued for Exchange Online.",
     msgs: [{from: "entra", to: "ca", label: "Grace, from Lisbon (PT)", kind: "normal"}, {from: "ca", to: "entra", label: "Excluded: travel exception", kind: "fix"}, {from: "entra", to: "m365", label: "Token issued", kind: "data"}],
     focus: ["entra", "ca", "m365"],
     evidence: [{t: "21:41:30", src: "Entra ID · sign-in logs", title: "Grace Liu · Outlook · Success · CA010 not applied", sev: "ok", kind: "log",
       fields: [["Status", "Success", ""], ["CA010", "notApplied", "She's in the exception group"]],
       raw: R`{
  "createdDateTime": "2026-11-23T21:41:30Z",
  "userPrincipalName": "grace.liu@contoso.com",
  "location": { "city": "Lisbon", "countryOrRegion": "PT" },
  "conditionalAccessStatus": "success",
  "status": { "errorCode": 0 },
  "appliedConditionalAccessPolicies": [
    { "displayName": "CA001 - Require MFA for all users", "enforcedGrantControls": ["Mfa"], "result": "success" },
    { "displayName": "CA010 - Block sign-ins outside the UK", "enforcedGrantControls": ["Block"], "result": "notApplied" }
  ]
}`}]},
    {title: "Outlook loads", sub: "Ready for the meeting", ph: 7,
     what: "Outlook and Teams open. Grace can prepare for tomorrow, and the exception will be removed when she's home.",
     check: "She can open her mailbox, and there are no new failures in her sign-in log.",
     tech: "Exchange Online accepts the token. Remember the follow-up: remove her from the group on her return (or let the access package expire).",
     msgs: [{from: "m365", to: "lap", label: "Mailbox and Teams open", kind: "data"}],
     focus: ["lap", "m365"], evidence: []}
  ],
  fixes: [
    {id: "mfareset", kind: "herring", name: "Make her re-register MFA", short: "Reset MFA", at: 3,
     desc: "Require re-registration of her authentication methods.",
     result: "Her MFA was working: the log shows CA001 passed. Now she has to set up Authenticator again from a hotel room, and when she has, CA010 still blocks her for being in Portugal.",
     ev: {t: "21:24:50", src: "Entra ID · sign-in logs", title: "MFA re-registered, still Failure 53003 from CA010", sev: "warn", kind: "log", fields: [["CA010", "failure", "Location hasn't changed"]], raw: R`"status": { "errorCode": 53003 },
"appliedConditionalAccessPolicies": [ { "displayName": "CA010 - Block sign-ins outside the UK", "result": "failure" } ]`}},
    {id: "cache", kind: "herring", name: "Clear her browser cache and cookies", short: "Clear cache", at: 3,
     desc: "Clear cached sign-in tokens and try again.",
     result: "Fresh cookies mean a fresh sign-in, from the same hotel, in the same country. The policy decides on location, not on anything stored in the browser.",
     ev: {t: "21:27:15", src: "Grace's laptop · browser", title: "Private window: 'You cannot access this right now' again", sev: "warn", kind: "browser", fields: [["Error Code", "53003", "Unchanged"]], raw: R`You cannot access this right now
Error Code: 53003`}},
    {id: "pwreset2", kind: "herring", name: "Reset her password", short: "Password reset", at: 3,
     desc: "Set a new password in case the account's been tampered with.",
     result: "Nothing suggested a compromise: it's her laptop and her phone approving. Her password was accepted every time. After the reset she signs in, approves MFA and gets blocked by CA010 exactly as before.",
     ev: {t: "21:30:40", src: "Entra ID · sign-in logs", title: "New password accepted, then blocked by CA010", sev: "warn", kind: "log", fields: [["Error code", "53003", "Same block"]], raw: R`"status": { "errorCode": 53003, "failureReason": "Access has been blocked by Conditional Access policies. The access policy does not allow token issuance." }`}},
    {id: "travel", kind: "fix", name: "Add her to the travel exception group for the trip", short: "Travel exception", at: 1,
     desc: "With her manager's approval, add Grace to CA010-Travel-Exception until she's back.",
     result: "CA010 excludes members of the travel group, so Grace's sign-ins from Lisbon are no longer blocked. MFA is still required. Take her out of the group when she's home.",
     ev: {t: "21:36:10", src: "Entra ID · audit logs", title: "Add member to group: Grace Liu → CA010-Travel-Exception", sev: "ok", kind: "log",
       fields: [["Activity", "Add member to group", ""], ["Group", "CA010-Travel-Exception", "Excluded from the country block"], ["Ticket", "INC-30141, approved by her manager", "Recorded so it can be removed later"]],
       raw: R`Date         : 23/11/2026 21:36:10
Service      : Core Directory
Category     : GroupManagement
Activity     : Add member to group
Status       : Success
Initiated by : servicedesk.admin@contoso.com
Target(s)    : Grace Liu ; CA010-Travel-Exception`}}
  ],
  debrief: {
    check: ["Sign-in log → Conditional Access tab: which policy failed?", "Location of the sign-in (city, country, IP)", "Did password and MFA succeed? If yes, it's policy, not credentials", "Use What If to test the fix before telling the user"],
    fix: ["Add the traveller to the exception group, approved and with an end date", "Remove them when they're back"],
    prevent: ["A travel request form that adds people to the exception group automatically, with an expiry (Entra access packages do this)", "Tell staff to request access before they fly", "Review the exception group's members monthly"]
  },
  tell: "Password and MFA both succeed, then error 53003. The sign-in log shows a foreign country and a 'block outside the UK' policy with result failure."
},

/* ============ 4. SCANNER CAN'T SEND ============ */
{
  id: "smtp-scanner", cat: "mail", name: "Scanner won't send emails", sub: "SMTP AUTH switched off",
  impact: "Everyone who scans to email", services: ["Exchange Online", "SMTP AUTH", "Connectors"],
  cause: "SMTP AUTH was turned off for the whole tenant, and the scanner still signs in to smtp.office365.com with a password",
  ticket: {ref: "INC-30155", from: "Mark Evans · Facilities", text: "Scan to email on the Floor 2 printer stopped working on Thursday. It shows a send error. Nobody's touched the printer."},
  intro: "The Floor 2 printer emails scans by signing in to Microsoft's mail server with a username and password, the old-fashioned way. On Thursday, as part of a security tidy-up, an admin switched that kind of sign-in off for the whole company. The printer hasn't changed; the rules it relies on have.",
  summary: "MFP-2F submits mail to smtp.office365.com:587 with STARTTLS and AUTH LOGIN as scanner@contoso.com (basic authentication). On 19 Nov an admin ran Set-TransportConfig -SmtpClientAuthenticationDisabled $true. The scanner mailbox has no per-mailbox override, so the server rejects AUTH with '535 5.7.139 … SmtpClientAuthentication is disabled for the Tenant.' The durable fix is to stop using SMTP AUTH: relay through an inbound connector that trusts the office's public IP.",
  facts: [["Symptom", "'Send error' on the scanner"], ["Root cause", "Tenant-wide SMTP AUTH disabled"], ["Who's affected", "Every scan-to-email user"], ["Key evidence", "535 5.7.139 in the scanner's log; Get-TransportConfig"]],
  nodes: [
    {id: "mfp", kind: "printer", label: "MFP-2F", sub: "Scan to email · 10.20.10.40", x: 110, y: 330},
    {id: "fw", kind: "fw", label: "Office firewall", sub: "Out via 203.0.113.10", x: 360, y: 190},
    {id: "exo", kind: "mail", label: "Exchange Online", sub: "smtp.office365.com", x: 640, y: 330},
    {id: "inbox", kind: "laptop", label: "Mark's inbox", sub: "mark.evans@contoso.com", x: 880, y: 180}
  ],
  links: [["mfp", "fw"], ["fw", "exo"], ["exo", "inbox"]],
  lanes: ["mfp", "fw", "exo", "inbox"],
  stage: 3,
  steps: [
    {title: "Connect and encrypt", sub: "Port 587, STARTTLS", ph: 3,
     what: "Mark scans a document. The printer connects to Microsoft's mail server and switches on encryption. That part works fine, so the network and firewall aren't the problem.",
     check: "The printer's own SMTP log (on its web page) shows the conversation with the server, line by line.",
     tech: "TCP 587 to smtp.office365.com, EHLO, STARTTLS (TLS 1.2), EHLO again. The server advertises AUTH LOGIN XOAUTH2. The firewall allows outbound 587.",
     msgs: [{from: "mfp", to: "fw", label: "Connect to smtp.office365.com:587", kind: "normal"}, {from: "fw", to: "exo", label: "EHLO, STARTTLS", kind: "normal"}, {from: "exo", to: "mfp", label: "220 Ready, encrypted", kind: "data"}],
     focus: ["mfp", "fw", "exo"],
     evidence: [{t: "08:52:10", src: "MFP-2F · SMTP log", title: "Connected to smtp.office365.com:587, STARTTLS OK", sev: "info", kind: "log",
       fields: [["Server", "smtp.office365.com:587", "Microsoft's mail submission endpoint"], ["STARTTLS", "OK", "Encryption works, so it isn't a firewall or TLS problem"]],
       raw: R`08:52:09 Connect smtp.office365.com:587
08:52:09 << 220 AM0P190CA0012.outlook.office365.com Microsoft ESMTP MAIL Service ready
08:52:09 >> EHLO MFP-2F
08:52:09 << 250-STARTTLS
08:52:10 >> STARTTLS
08:52:10 << 220 2.0.0 SMTP server ready
08:52:10 >> EHLO MFP-2F
08:52:10 << 250-AUTH LOGIN XOAUTH2`}]},
    {title: "Sign in with a password", sub: "Refused: SMTP AUTH is off", ph: 3,
     what: "The printer signs in as scanner@contoso.com with its password. The server says no: password sign-ins for sending mail are switched off for the whole company. It's not that the password is wrong; the door it's using has been closed.",
     check: "The exact 535 5.7.139 wording tells you which: 'disabled for the Tenant' (a company-wide setting) or 'disabled for the Mailbox' (just this account). Then check the tenant setting and recent admin changes.",
     tech: "AUTH LOGIN is rejected with 535 5.7.139 '…SmtpClientAuthentication is disabled for the Tenant.' Get-TransportConfig shows SmtpClientAuthenticationDisabled True. Get-CASMailbox scanner shows the per-mailbox setting blank, meaning it follows the tenant. The unified audit log shows Set-TransportConfig run on Thursday.",
     msgs: [{from: "mfp", to: "exo", label: "AUTH LOGIN scanner@contoso.com", kind: "normal"}, {from: "exo", to: "mfp", label: "535 5.7.139 SMTP AUTH disabled", kind: "bad"}],
     callout: "SMTP AUTH is off for the tenant", fault: ["exo"], focus: ["mfp", "exo"],
     cmds: {win: R`Connect-ExchangeOnline
Get-TransportConfig | Format-List SmtpClientAuthenticationDisabled
Get-CASMailbox -Identity scanner@contoso.com | Format-List SmtpClientAuthenticationDisabled
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-7) -EndDate (Get-Date) -Operations Set-TransportConfig |
  Select-Object CreationDate, UserIds, Operations`, nix: R`admin.microsoft.com → Settings → Org settings → Modern authentication
  ("Authenticated SMTP" tick box, tenant-wide)
Per mailbox: Users → Active users → the account → Mail → Manage email apps
Who changed it: purview.microsoft.com → Audit → search for Set-TransportConfig`},
     evidence: [
      {t: "08:52:11", src: "MFP-2F · SMTP log", title: "535 5.7.139 Authentication unsuccessful, SmtpClientAuthentication is disabled for the Tenant", sev: "err", kind: "log",
       fields: [["Response", "535 5.7.139", "Authentication refused"], ["Reason", "SmtpClientAuthentication is disabled for the Tenant", "A company-wide switch, not this account's password"]],
       raw: R`08:52:10 >> AUTH LOGIN
08:52:11 << 535 5.7.139 Authentication unsuccessful, SmtpClientAuthentication is disabled for the Tenant. Visit https://aka.ms/smtp_auth_disabled for more information.
08:52:11 Send failed (scan_0412.pdf)`},
      {t: "09:04:30", src: "Exchange Online PowerShell", title: "Get-TransportConfig: SmtpClientAuthenticationDisabled True", sev: "err", kind: "cmd",
       fields: [["Tenant", "SmtpClientAuthenticationDisabled : True", "Off for everyone"], ["scanner@contoso.com", "SmtpClientAuthenticationDisabled : (blank)", "No override, so it follows the tenant"]],
       raw: R`PS C:\> Get-TransportConfig | Format-List SmtpClientAuthenticationDisabled

SmtpClientAuthenticationDisabled : True

PS C:\> Get-CASMailbox -Identity scanner@contoso.com | Format-List SmtpClientAuthenticationDisabled

SmtpClientAuthenticationDisabled :`},
      {t: "09:06:55", src: "Purview · audit log", title: "Set-TransportConfig run on Thursday 19 Nov", sev: "clue", kind: "log",
       fields: [["Operation", "Set-TransportConfig", ""], ["When", "19/11/2026 16:22", "The day scanning stopped"], ["Parameters", "SmtpClientAuthenticationDisabled = True", "The security tidy-up"]],
       raw: R`CreationDate : 19/11/2026 16:22:48
UserIds      : it.admin@contoso.com
Operations   : Set-TransportConfig
AuditData    : {"Operation":"Set-TransportConfig","Parameters":[{"Name":"SmtpClientAuthenticationDisabled","Value":"True"}],"ResultStatus":"True"}`}]},
    {title: "The scan never arrives", sub: "Nothing was ever sent", ph: 7,
     what: "Mark waits for his scan, but it never comes. Message trace has no record of it, because the printer was turned away before it could hand anything over.",
     check: "Message trace for the scanner's address over the last few days. No results at all means mail is failing before it reaches Exchange Online.",
     tech: "Get-MessageTraceV2 for sender scanner@contoso.com since 19 Nov returns nothing. Rejected AUTH means no message was ever submitted.",
     msgs: [{from: "exo", to: "inbox", label: "Nothing to deliver", kind: "bad", lost: "Never sent"}],
     focus: ["exo", "inbox"],
     cmds: {win: R`Get-MessageTraceV2 -SenderAddress scanner@contoso.com -StartDate (Get-Date).AddDays(-5) -EndDate (Get-Date)`, nix: R`admin.exchange.microsoft.com → Mail flow → Message trace
  → Start a trace → Senders: scanner@contoso.com → last 7 days`},
     evidence: [{t: "09:10:20", src: "Exchange Online PowerShell", title: "Message trace: nothing from scanner@contoso.com since Thursday", sev: "clue", kind: "cmd",
       fields: [["Results", "(none)", "The scans never got as far as Exchange Online"]],
       raw: R`PS C:\> Get-MessageTraceV2 -SenderAddress scanner@contoso.com -StartDate (Get-Date).AddDays(-5) -EndDate (Get-Date)
PS C:\>`}]}
  ],
  fixed: [
    {title: "Connector for the office", sub: "Trust mail from 203.0.113.10", ph: 3,
     what: "Instead of reopening the door that was deliberately closed, the admin sets up a different route: an inbound connector that accepts mail from the office's own public IP address, with no password needed. Then the printer is pointed at it.",
     check: "Get-InboundConnector shows the new connector, enabled, with the office IP.",
     tech: "An OnPremises inbound connector identifies the sender by source IP (203.0.113.10) and requires TLS. The MFP is reconfigured to send to the tenant's MX endpoint, contoso-com.mail.protection.outlook.com, on port 25 with no authentication. Relay via connector can deliver to external recipients too.",
     msgs: [], focus: ["exo"], callout: "Connector: trust the office IP",
     cmds: {win: R`New-InboundConnector -Name "Office scanners" -ConnectorType OnPremises -SenderDomains * -SenderIPAddresses 203.0.113.10 -RestrictDomainsToIPAddresses $true -RequireTls $true
Get-InboundConnector "Office scanners" | Format-List Name, Enabled, SenderIPAddresses, RequireTls`, nix: R`admin.exchange.microsoft.com → Mail flow → Connectors → + Add a connector
  From: Your organisation's email server  To: Office 365
  Identify by IP address: 203.0.113.10
Then on the printer: SMTP server contoso-com.mail.protection.outlook.com, port 25, no authentication, TLS on.`},
     evidence: []},
    {title: "Scanner sends via the connector", sub: "Port 25, no password", ph: 3,
     what: "Mark scans again. The printer connects to the company's own mail address at Microsoft, from the office IP, and the connector recognises it. No sign-in needed, and the scan is accepted.",
     check: "The printer's log ends with '250 2.6.0 … Queued mail for delivery'.",
     tech: "TCP 25 to contoso-com.mail.protection.outlook.com from 203.0.113.10, STARTTLS, MAIL FROM scanner@contoso.com. The inbound connector matches on IP, so the message is treated as internal and relayed.",
     msgs: [{from: "mfp", to: "fw", label: "Connect: …mail.protection.outlook.com:25", kind: "normal"}, {from: "fw", to: "exo", label: "From 203.0.113.10, STARTTLS", kind: "fix"}, {from: "exo", to: "mfp", label: "250 2.6.0 Queued", kind: "data"}],
     focus: ["mfp", "fw", "exo"],
     evidence: [{t: "10:22:41", src: "MFP-2F · SMTP log", title: "250 2.6.0 Queued mail for delivery", sev: "ok", kind: "log",
       fields: [["Server", "contoso-com.mail.protection.outlook.com:25", "The tenant's own MX endpoint"], ["Response", "250 2.6.0 Queued mail for delivery", "Accepted"]],
       raw: R`10:22:39 Connect contoso-com.mail.protection.outlook.com:25
10:22:39 >> EHLO MFP-2F
10:22:40 >> STARTTLS
10:22:40 << 220 2.0.0 SMTP server ready
10:22:40 >> EHLO MFP-2F
10:22:40 >> MAIL FROM:<scanner@contoso.com>
10:22:40 >> RCPT TO:<mark.evans@contoso.com>
10:22:41 << 250 2.6.0 <20261123102240.MFP2F@contoso.com> [InternalId=1099511627776] Queued mail for delivery`}]},
    {title: "Scan delivered", sub: "In Mark's inbox", ph: 7,
     what: "The scan lands in Mark's inbox a few seconds later. Every other scan-to-email user on the floor is working again too.",
     check: "Message trace shows the message from scanner@contoso.com with status Delivered.",
     tech: "Get-MessageTraceV2 shows Status Delivered, received through the 'Office scanners' connector.",
     msgs: [{from: "exo", to: "inbox", label: "scan_0413.pdf", kind: "data"}],
     focus: ["exo", "inbox"],
     evidence: [{t: "10:23:05", src: "Exchange Online PowerShell", title: "Message trace: scan_0413.pdf · Delivered", sev: "ok", kind: "cmd",
       fields: [["SenderAddress", "scanner@contoso.com", ""], ["RecipientAddress", "mark.evans@contoso.com", ""], ["Status", "Delivered", ""]],
       raw: R`PS C:\> Get-MessageTraceV2 -SenderAddress scanner@contoso.com -StartDate (Get-Date).AddHours(-1) -EndDate (Get-Date)

Received            SenderAddress       RecipientAddress       Subject       Status
--------            -------------       ----------------       -------       ------
23/11/2026 10:22:41 scanner@contoso.com mark.evans@contoso.com scan_0413.pdf Delivered`}]}
  ],
  fixes: [
    {id: "scanpw", kind: "herring", name: "Reset the scanner mailbox's password", short: "New password", at: 3,
     desc: "Set a new password on scanner@contoso.com and type it into the printer.",
     result: "The password was never the problem: the error says SMTP AUTH is disabled for the tenant, not that the credentials were wrong. With a new password, the server gives exactly the same answer.",
     ev: {t: "09:20:15", src: "MFP-2F · SMTP log", title: "New password: still 535 5.7.139 …disabled for the Tenant", sev: "warn", kind: "log", fields: [["Response", "535 5.7.139", "Same refusal"]], raw: R`09:20:14 >> AUTH LOGIN
09:20:15 << 535 5.7.139 Authentication unsuccessful, SmtpClientAuthentication is disabled for the Tenant. Visit https://aka.ms/smtp_auth_disabled for more information.`}},
    {id: "restartmfp", kind: "herring", name: "Restart the printer", short: "Restart MFP", at: 3,
     desc: "Power-cycle MFP-2F.",
     result: "The printer comes back, connects, encrypts and signs in exactly as before, and gets exactly the same refusal. The change was in Microsoft 365, not on the printer.",
     ev: {t: "09:26:40", src: "MFP-2F · SMTP log", title: "After restart: 535 5.7.139 again", sev: "warn", kind: "log", fields: [["Response", "535 5.7.139", "Nothing on the printer changed"]], raw: R`09:26:40 << 535 5.7.139 Authentication unsuccessful, SmtpClientAuthentication is disabled for the Tenant.`}},
    {id: "caexclude", kind: "herring", name: "Exclude the scanner account from Conditional Access", short: "CA exclusion", at: 3,
     desc: "Add scanner@contoso.com to the exclusion lists of the MFA policies.",
     result: "Conditional Access never got involved: the sign-in logs have no entries for the scanner, because Exchange refuses SMTP AUTH before Entra ID is asked. All you've done is weaken security for an account with a password typed into a printer.",
     ev: {t: "09:31:05", src: "Entra ID · sign-in logs", title: "No sign-ins for scanner@contoso.com at all", sev: "warn", kind: "log", fields: [["Results", "(none)", "Refused before Entra ID was involved"]], raw: R`PS C:\> Get-MgAuditLogSignIn -Filter "userPrincipalName eq 'scanner@contoso.com'" -Top 5
PS C:\>`}},
    {id: "connector", kind: "fix", name: "Relay through a connector instead of signing in", short: "Connector relay", at: 1,
     desc: "Add an inbound connector for the office IP and point the printer at the MX endpoint on port 25.",
     result: "The printer no longer needs SMTP AUTH or a password at all, so the security change stays in place. Exchange recognises mail from the office IP through the connector and delivers it.",
     ev: {t: "10:15:30", src: "Exchange Online PowerShell", title: "New-InboundConnector 'Office scanners': 203.0.113.10, TLS required", sev: "ok", kind: "cmd",
       fields: [["ConnectorType", "OnPremises", "Mail from your own organisation"], ["SenderIPAddresses", "203.0.113.10", "Only the office's public IP"], ["RequireTls", "True", "Encrypted only"]],
       raw: R`PS C:\> Get-InboundConnector "Office scanners" | Format-List Name, Enabled, ConnectorType, SenderIPAddresses, RequireTls

Name              : Office scanners
Enabled           : True
ConnectorType     : OnPremises
SenderIPAddresses : {203.0.113.10}
RequireTls        : True`}}
  ],
  debrief: {
    check: ["The device's own SMTP log: which server, which port, what error?", "535 5.7.139 wording: disabled for the Tenant, or for the Mailbox?", "Get-TransportConfig and Get-CASMailbox for SmtpClientAuthenticationDisabled", "Audit log: who changed it, and when?"],
    fix: ["Relay through an inbound connector that trusts your office IP (no password)", "Or use firmware that supports OAuth, if the device has it", "A stopgap only: Set-CASMailbox -SmtpClientAuthenticationDisabled $false re-enables it for that one mailbox. Microsoft is switching basic-auth SMTP AUTH off by default for existing tenants from the end of December 2026 (admins can switch it back on for now), and will announce a final removal date in the second half of 2027."],
    prevent: ["Before switching SMTP AUTH off, run the SMTP AUTH clients report in the Exchange admin centre to see who still uses it", "Keep a list of devices and apps that send mail, and how", "Tell Facilities before a change that could hit printers"]
  },
  tell: "TLS works, then AUTH LOGIN gets 535 5.7.139 'disabled for the Tenant'. Get-TransportConfig shows SMTP AUTH off, and the audit log shows the change on the day scanning stopped."
}
]);
})();
