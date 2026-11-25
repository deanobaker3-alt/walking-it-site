/* Cloudwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — the journey stages and "Words to know".
   JOURNEY: the seven stages every sign-in goes through (the tiles along the top).
   GLOSSARY: shown under a step when the term appears in it. [label, pattern (case-insensitive), plain meaning] */
window.JOURNEY = [
  {name: "Exist", tech: "Entra Connect Sync, Entra ID user objects", desc: "The account has to exist in Entra ID. For most companies it's made in on-premises Active Directory and copied up by Entra Connect."},
  {name: "Prove it", tech: "Password, MFA, authentication methods", desc: "Proving you are who you say you are: a password, then a second check like the Authenticator app."},
  {name: "Allowed in?", tech: "Conditional Access, named locations, SMTP AUTH", desc: "Rules that decide whether this sign-in is allowed: from here, on this kind of connection, right now."},
  {name: "Licensed", tech: "Licences, service plans, group-based licensing", desc: "The account needs a licence before Microsoft builds the things it pays for, like a mailbox or OneDrive."},
  {name: "Access", tech: "Groups, dynamic membership, permissions", desc: "Being in the right groups to open the right sites, teams and mailboxes."},
  {name: "Trusted device", tech: "Intune enrolment, compliance policies", desc: "Some rules only let in devices the company manages and has checked are safe."},
  {name: "Use it", tech: "Exchange Online, SharePoint, Teams, Outlook", desc: "Actually using the service: opening the mailbox, the site or the app."}
];

window.GLOSSARY = [
  ["Entra ID", "\\bEntra ID\\b|\\bEntra\\b(?! Connect)", "Microsoft's cloud directory: the list of every user, group and device that can sign in to Microsoft 365. It used to be called Azure AD."],
  ["Active Directory", "Active Directory|\\bAD\\b|domain controller|\\bDC01\\b", "The company's own directory, on its own servers. Accounts are usually made here first."],
  ["Entra Connect", "Entra Connect|\\bsync\\b|synced|syncing|synchronis", "The tool that copies users and groups from on-premises Active Directory up to Entra ID, every 30 minutes by default."],
  ["OU", "\\bOU\\b|organisational unit|folder in AD", "A folder in Active Directory. Entra Connect can be set to copy only some OUs."],
  ["UPN", "\\bUPN\\b|user principal name|sign-in name", "The name you sign in with, which looks like an email address, e.g. sam.okafor@contoso.com."],
  ["MFA", "\\bMFA\\b|second check|multifactor|two-step", "Multifactor authentication: a second proof after your password, like a code or a tap in an app on your phone."],
  ["Authenticator app", "Authenticator", "Microsoft's phone app for MFA. It's tied to one phone, so a new phone means setting it up again."],
  ["Temporary Access Pass", "Temporary Access Pass|\\bTAP\\b", "A time-limited passcode an admin gives a user so they can sign in and set up MFA again, without needing the old phone."],
  ["Sign-in logs", "sign-in log", "Entra ID's record of every sign-in: who, when, from where, which app, and whether it worked and why."],
  ["Error code (AADSTS)", "AADSTS|error code", "The number Entra ID gives a failed sign-in. Search it at login.microsoftonline.com/error to see what it means."],
  ["Conditional Access", "Conditional Access|\\bCA\\b policy|\\bCA0", "Rules in Entra ID that check every sign-in (where from, which device, which app) and decide whether to allow it, ask for MFA or block it."],
  ["Named location", "named location|trusted location|countr", "A list of countries or IP ranges in Entra ID that Conditional Access rules can allow or block."],
  ["Exclusion group", "exclusion|excluded|exception group", "A group whose members a Conditional Access policy skips. Handy for travel or break-glass accounts, but keep it small and reviewed."],
  ["Licence", "licen[cs]e", "What a user needs before Microsoft 365 will give them a service. No Exchange licence means no mailbox."],
  ["Group-based licensing", "group-based|licence group|LIC-", "Giving licences to a group, so anyone added to the group gets the licence automatically."],
  ["Dynamic group", "dynamic", "A group that fills itself using a rule, like 'everyone whose department is Finance'. Nobody adds members by hand."],
  ["Membership rule", "membership rule|\\brule\\b", "The test a dynamic group uses to decide who's in it. One typo and nobody matches."],
  ["Audit log", "audit log", "Entra ID's and Microsoft 365's record of admin changes: who changed what, and when."],
  ["Intune", "Intune|Company Portal|enrol", "Microsoft's device management service. Enrolling a phone or laptop lets the company check it's safe and manage company apps on it."],
  ["Compliant device", "complian", "A device Intune has checked against the company's rules (a passcode, up-to-date software and so on) and passed."],
  ["Exchange Online", "Exchange|mailbox", "Microsoft's cloud email service. Every Microsoft 365 mailbox lives here."],
  ["Shared mailbox", "shared mailbox|accounts@", "A mailbox several people use, like accounts@. It has no password of its own; people get permission to open it."],
  ["Full Access", "Full Access", "The Exchange permission to open and read another mailbox."],
  ["Automapping", "automap|auto-map", "Classic Outlook adding a shared mailbox to your folder list by itself. It only happens when Full Access is given to you directly, not through a group."],
  ["SMTP AUTH", "SMTP AUTH|SMTP|smtp", "Sending email by signing in to smtp.office365.com with a username and password. Old scanners and apps use it, and Microsoft is switching the password version off."],
  ["Connector (relay)", "connector|relay", "A rule in Exchange Online that accepts email from your office's own IP address, so devices can send without signing in."],
  ["SharePoint", "SharePoint|team site|Finance site", "Where Microsoft 365 keeps team sites and files. Access is usually given through groups."],
  ["PowerShell", "PowerShell|Get-Mg|Get-EXO|cmdlet", "The command line admins use to check and change Microsoft 365 settings in bulk."]
];
