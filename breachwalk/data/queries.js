/* Breachwalk by Dean Baker (© 2026 Dean Baker. All rights reserved.) — example detection queries, keyed by attack id and step number (1-based).
   kql = Microsoft Sentinel / Defender XDR advanced hunting.
   cql = CrowdStrike Falcon Next-Gen SIEM (CrowdStrike Query Language).
   These are EXAMPLES: table, event and field names vary by tenant, connector and parser.
   Test them in your own environment before relying on them. */
(function () {
const R = String.raw;
window.QUERIES = {

"phish-bec": {
  2: {kql: R`let known = EmailEvents
    | where Timestamp between (ago(30d) .. ago(1d))
    | distinct SenderFromDomain;
EmailEvents
| where Timestamp > ago(1d) and DeliveryAction == "Delivered"
| where SenderFromDomain !in (known)          // first-time sender domain
| join kind=inner (EmailUrlInfo) on NetworkMessageId
| where Subject has_any ("shared with you", "invoice", "document")
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, Url`,
      cql: R`// Email gateway logs (check the tags your connector uses)
email.subject=/shared with you|invoice|document/i
| url.domain=* url.domain!=/contoso\.com$/
| groupBy([email.from.address, url.domain], function=count(as=messages))
| sort(messages, order=desc)`},
  3: {kql: R`SigninLogs
| where ResultType == "0" and AuthenticationRequirement == "multiFactorAuthentication"
| where RiskEventTypes_V2 has "unfamiliarFeatures" or RiskLevelDuringSignIn in ("medium", "high")
| project TimeGenerated, UserPrincipalName, IPAddress, AutonomousSystemNumber, Location, RiskLevelDuringSignIn`,
      cql: R`#Vendor="microsoft" #event.module="entraid"   // check your connector's tags
| event.outcome="success"
| Vendor.properties.riskLevelDuringSignIn=/medium|high/
| table([@timestamp, user.name, source.ip, source.geo.country_name])`},
  4: {kql: R`let signins = SigninLogs
    | where TimeGenerated > ago(1d) and ResultType == "0"
    | project UPN = tolower(UserPrincipalName), IPAddress;
CloudAppEvents
| where Timestamp > ago(1d) and ActionType == "MailItemsAccessed"
| extend UPN = tolower(tostring(RawEventData.UserId))
| join kind=leftanti (signins) on UPN, IPAddress      // mail access from an IP with no sign-in
| summarize Items = count() by UPN, IPAddress`,
      cql: R`#Vendor="microsoft" event.action="MailItemsAccessed"
| groupBy([user.name, source.ip], function=count(as=items))
| sort(items, order=desc)
// IPs here with no matching Entra ID sign-in for that user = replayed session`},
  5: {kql: R`CloudAppEvents
| where ActionType in ("New-InboxRule", "Set-InboxRule")
| extend Params = tostring(RawEventData.Parameters)
| where Params has_any ("RSS Feeds", "invoice", "payment", "bank", "MarkAsRead")
| project Timestamp, AccountDisplayName, IPAddress, Params`,
      cql: R`#Vendor="microsoft" event.action=/^(New|Set)-InboxRule$/
| Vendor.Parameters=/RSS Feeds|invoice|payment|bank/i
| table([@timestamp, user.name, source.ip, Vendor.Parameters])`},
  6: {kql: R`EmailEvents
| where Timestamp > ago(1d) and EmailDirection == "Outbound"
| where Subject has_any ("bank details", "remittance", "payment details")
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, SenderIPv4`,
      cql: R`email.direction="outbound"
| email.subject=/bank details|remittance|payment details/i
| table([@timestamp, email.from.address, email.to.address, email.subject, source.ip])`}
},

"mfa-fatigue": {
  1: {kql: R`SigninLogs
| where ResultType == "50074"                   // password right, MFA required
| join kind=inner (SigninLogs | where ResultType == "0"
    | project UserPrincipalName, PrevIP = IPAddress, PrevTime = TimeGenerated) on UserPrincipalName
| where IPAddress != PrevIP and TimeGenerated between (PrevTime .. PrevTime + 1h)
| project TimeGenerated, UserPrincipalName, IPAddress, PrevIP, AutonomousSystemNumber`,
      cql: R`#Vendor="microsoft" #event.module="entraid"
| Vendor.properties.status.errorCode=50074
| groupBy([user.name, source.ip, source.geo.city_name], function=count())`},
  2: {kql: R`SigninLogs
| where ResultType == "500121"                  // MFA denied or timed out
| summarize Denials = count(), IPs = make_set(IPAddress)
    by UserPrincipalName, Window = bin(TimeGenerated, 10m)
| where Denials >= 5`,
      cql: R`#Vendor="microsoft" #event.module="entraid"
| Vendor.properties.status.errorCode=500121
| bucket(span=10m, field=[user.name], function=count(as=denials))
| denials >= 5`},
  4: {kql: R`SigninLogs
| where ResultType in ("500121", "0")
| summarize Denials = countif(ResultType == "500121"), Successes = countif(ResultType == "0"),
            IPs = make_set(IPAddress) by UserPrincipalName, Window = bin(TimeGenerated, 15m)
| where Denials >= 5 and Successes > 0          // approved after a string of denials`,
      cql: R`#Vendor="microsoft" #event.module="entraid"
| in(field="Vendor.properties.status.errorCode", values=["0", "500121"])
| groupBy([user.name], function=[count(Vendor.properties.status.errorCode, distinct=true, as=outcomes), count(as=events)])
| test(outcomes == 2 and events > 5)`},
  5: {kql: R`AuditLogs
| where OperationName == "User registered security info"
| extend User = tostring(TargetResources[0].userPrincipalName),
         IP = tostring(InitiatedBy.user.ipAddress)
| join kind=inner (SigninLogs | where RiskLevelDuringSignIn == "high"
    | project User = UserPrincipalName, IP = IPAddress) on User, IP
| project TimeGenerated, User, IP, ResultReason`,
      cql: R`#Vendor="microsoft" event.action="User registered security info"
| table([@timestamp, user.target.name, source.ip])`},
  6: {kql: R`CloudAppEvents
| where ActionType in ("New-InboxRule", "Set-InboxRule", "Set-Mailbox")
| extend Params = tostring(RawEventData.Parameters)
| where Params has_any ("ForwardTo", "RedirectTo", "ForwardingSmtpAddress")
| project Timestamp, AccountDisplayName, IPAddress, Params`,
      cql: R`#Vendor="microsoft" event.action=/^(New-InboxRule|Set-InboxRule|Set-Mailbox)$/
| Vendor.Parameters=/ForwardTo|RedirectTo|ForwardingSmtpAddress/i
| table([@timestamp, user.name, source.ip, Vendor.Parameters])`}
},

"password-spray": {
  3: {kql: R`SigninLogs
| where ResultType == "50126"                   // invalid username or password
| summarize Users = dcount(UserPrincipalName), Attempts = count()
    by IPAddress, Window = bin(TimeGenerated, 10m)
| where Users > 20 and todouble(Attempts) / Users < 3   // wide, not deep`,
      cql: R`#Vendor="microsoft" #event.module="entraid"
| Vendor.properties.status.errorCode=50126
| groupBy([source.ip], function=[count(user.name, distinct=true, as=users), count(as=attempts)])
| test(users > 20)
| sort(users, order=desc)`},
  5: {kql: R`let sprayers = SigninLogs
    | where ResultType == "50126"
    | summarize Users = dcount(UserPrincipalName) by IPAddress
    | where Users > 20
    | project IPAddress;
SigninLogs
| where ResultType == "0" and IPAddress in (sprayers)
| project TimeGenerated, UserPrincipalName, IPAddress, AuthenticationRequirement, ClientAppUsed`,
      cql: R`// IPs that failed for many users AND succeeded at least once
#Vendor="microsoft" #event.module="entraid"
| groupBy([source.ip], function=[count(user.name, distinct=true, as=users),
    count(Vendor.properties.status.errorCode, distinct=true, as=outcomes)])
| test(users > 20 and outcomes > 1)`},
  6: {kql: R`CloudAppEvents
| where ActionType == "MailItemsAccessed"
| where tostring(RawEventData.MailAccessType) == "Sync"
| summarize Syncs = count() by AccountDisplayName, IPAddress, Window = bin(Timestamp, 1h)
| where Syncs > 50`,
      cql: R`#Vendor="microsoft" event.action="MailItemsAccessed" Vendor.MailAccessType="Sync"
| groupBy([user.name, source.ip], function=count(as=syncs))
| sort(syncs, order=desc)`}
},

"sqli": {
  1: {kql: R`W3CIISLog                                      // or your web server's table
| where toint(scStatus) == 500
| where csUriQuery contains "'" or csUriQuery contains "%27"
| project TimeGenerated, cIP, csUriStem, csUriQuery, scStatus`,
      cql: R`// Web server access logs (Apache / nginx parser)
http.response.status_code=500 url.query=/'|%27/
| table([@timestamp, source.ip, url.path, url.query])`},
  2: {kql: R`W3CIISLog
| where csUriQuery matches regex @"(?i)and(%20|\s|\+)+\d+=\d+"
| summarize Sizes = make_set(scBytes), Requests = count() by cIP, csUriStem
| where array_length(Sizes) > 1                 // same test, different page sizes`,
      cql: R`url.query=/and(%20|\s|\+)+\d+=\d+/i
| groupBy([source.ip, url.path], function=[count(http.response.bytes, distinct=true, as=sizes), count(as=requests)])
| test(sizes > 1)`},
  3: {kql: R`W3CIISLog
| where csUriQuery matches regex @"(?i)union(%20|\s|\+)+(all(%20|\s|\+)+)?select|information_schema"
| project TimeGenerated, cIP, csUriStem, csUriQuery, scStatus, scBytes`,
      cql: R`url.query=/union(%20|\s|\+)+(all(%20|\s|\+)+)?select|information_schema/i
| table([@timestamp, source.ip, url.path, url.query, http.response.status_code])`},
  4: {kql: R`let typical = toscalar(W3CIISLog
    | where TimeGenerated > ago(7d) and csUriStem == "/products.php"
    | summarize percentile(scBytes, 50));
W3CIISLog
| where csUriStem == "/products.php" and toint(scStatus) == 200 and scBytes > 4 * typical
| project TimeGenerated, cIP, csUriQuery, scBytes`,
      cql: R`url.path="/products.php" http.response.status_code=200
| http.response.bytes > 30000                   // tune to ~4x your normal page size
| table([@timestamp, source.ip, url.query, http.response.bytes])`},
  6: {kql: R`let injectors = W3CIISLog
    | where csUriQuery matches regex @"(?i)union(%20|\s|\+)+select|information_schema"
    | distinct cIP;
AppAuthLogs_CL                                  // your application's auth log table
| where user_s == "admin" and result_s == "success" and ip_s in (injectors)
| project TimeGenerated, user_s, ip_s`,
      cql: R`// IPs that sent SQL injection, then logged in to the app
url.query=/union(%20|\s|\+)+select|information_schema/i
| groupBy([source.ip])
| join(query={event.action="login" user.name="admin" event.outcome="success"}, field=source.ip, include=[@timestamp, user.name])`}
},

"xss": {
  1: {kql: R`AppContentLogs_CL                               // your forum's content log
| where event_s == "comment_create" and isnotempty(html_tags_s)
| project TimeGenerated, user_s, ip_s, thread_s, html_tags_s`,
      cql: R`event.action="comment_create" Vendor.html_tags=*
| table([@timestamp, user.name, source.ip, Vendor.html_tags])`},
  2: {kql: R`CommonSecurityLog                               // WAF / reverse proxy that logs bodies
| where RequestMethod == "POST"
| where AdditionalExtensions matches regex @"(?i)(%3C|<)script|document\.cookie"
| project TimeGenerated, SourceIP, RequestURL, Activity`,
      cql: R`http.request.method="POST"
| http.request.body.content=/(%3C|<)script|document\.cookie/i
| table([@timestamp, source.ip, url.path])`},
  4: {kql: R`_Im_WebSession
| where HttpReferrer has "forum.example" and Url !has "forum.example"
| where Url matches regex @"[?&](s|c|cookie|sess)=" or UrlCategory has "Newly"
| project TimeGenerated, SrcIpAddr, Url, HttpReferrer, UrlCategory`,
      cql: R`http.request.referrer=/forum\.example/ url.domain!=/forum\.example$/
| url.query=/(^|&)(s|c|cookie|sess)=/i
| table([@timestamp, source.ip, url.original, http.request.referrer])`},
  5: {kql: R`AppSessionLogs_CL
| summarize IPs = dcount(ip_s), Agents = dcount(user_agent_s) by session_s, Window = bin(TimeGenerated, 5m)
| where IPs > 1                                 // one session, two places at once`,
      cql: R`Vendor.session=*
| groupBy([Vendor.session], function=[count(source.ip, distinct=true, as=ips), collect([source.ip])])
| test(ips > 1)`}
},

"arp-poison": {
  2: {kql: R`Syslog                                          // IDS alerts forwarded over syslog
| where SyslogMessage has_any ("ARP spoof", "ARP poison", "unsolicited ARP", "duplicate MAC")
| project TimeGenerated, HostName, SyslogMessage`,
      cql: R`// Zeek arp.log (or your IDS's ARP events)
event.dataset="zeek.arp" Vendor.operation="reply"
| groupBy([source.mac], function=count(source.ip, distinct=true, as=ips_claimed))
| test(ips_claimed > 1)                         // one MAC claiming several IPs`},
  3: {kql: R`Syslog
| where SyslogMessage has_any ("MAC flap", "duplicate address", "ip conflict")
| project TimeGenerated, HostName, SyslogMessage`,
      cql: R`event.dataset="zeek.arp"
| groupBy([source.ip], function=count(source.mac, distinct=true, as=macs))
| test(macs > 1)                                // the gateway IP suddenly has a new MAC`},
  5: {kql: R`Syslog
| where SyslogMessage has_any ("Cleartext credentials", "HTTP POST password", "Basic auth over HTTP")
| project TimeGenerated, HostName, SyslogMessage`,
      cql: R`destination.port=80 http.request.method="POST" http.request.body.content=/pass(word)?=/i
| table([@timestamp, source.ip, destination.ip, url.path])`}
},

"dns-poison": {
  2: {kql: R`_Im_Dns
| where not(ipv4_is_private(SrcIpAddr))          // outsiders using your resolver
| summarize Queries = count(), Names = dcount(DnsQuery) by SrcIpAddr, Window = bin(TimeGenerated, 5m)
| where Queries > 500`,
      cql: R`// DNS resolver logs
!cidr(source.ip, subnet=["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"])
| groupBy([source.ip], function=[count(as=queries), count(dns.question.name, distinct=true, as=names)])
| test(queries > 500)`},
  3: {kql: R`Syslog
| where ProcessName in ("named", "unbound")
| where SyslogMessage has_any ("mismatched", "unwanted reply", "spoof")
| summarize Warnings = count() by HostName, Window = bin(TimeGenerated, 5m)`,
      cql: R`@rawstring=/mismatched query id|unwanted repl|possible spoofing/i
| bucket(span=5m, function=count(as=warnings))`},
  4: {kql: R`_Im_Dns
| where DnsQuery == "portal.bank.example" and DnsResponseCodeName == "NOERROR"
| summarize Answers = make_set(DnsResponseName) by Window = bin(TimeGenerated, 1h)
| where array_length(Answers) > 1                // the answer changed`,
      cql: R`dns.question.name="portal.bank.example"
| groupBy([dns.answers.data], function=[count(), min(@timestamp, as=first_seen)])`},
  5: {kql: R`_Im_WebSession
| where Url has "portal.bank.example"
| summarize Hits = count() by DstIpAddr, EventResult, EventResultDetails
// more than one destination IP for a site you know = suspicious`,
      cql: R`url.domain="portal.bank.example"
| groupBy([destination.ip, tls.established], function=count())`}
},

"ransomware": {
  1: {kql: R`DeviceTvmSoftwareVulnerabilities
| where VulnerabilitySeverityLevel == "Critical"
| join kind=inner (DeviceInfo | where IsInternetFacing == true | distinct DeviceId) on DeviceId
| project DeviceName, CveId, SoftwareName, SoftwareVersion`,
      cql: R`// Vulnerability findings ingested from your scanner
vulnerability.severity="Critical" Vendor.internet_facing=true
| groupBy([host.name, vulnerability.id], function=min(@timestamp, as=first_seen))`},
  2: {kql: R`DeviceProcessEvents
| where FolderPath has @"\AppData\Local\Temp\" and FileName endswith ".exe"
| join kind=inner (DeviceFileCertificateInfo | where IsSigned == false | distinct SHA1) on SHA1
| join kind=inner (DeviceNetworkEvents | where RemotePort == 443
    | project DeviceId, InitiatingProcessSHA1, RemoteIP) on DeviceId, $left.SHA1 == $right.InitiatingProcessSHA1
| distinct DeviceName, FileName, FolderPath, RemoteIP`,
      cql: R`#event_simpleName=ProcessRollup2 ImageFileName=/\\AppData\\Local\\Temp\\[^\\]+\.exe$/i
| join({#event_simpleName=NetworkConnectIP4 RemotePort=443}, field=TargetProcessId, key=ContextProcessId, include=[RemoteAddressIP4])
| groupBy([ComputerName, ImageFileName, RemoteAddressIP4], function=count(as=connections))`},
  3: {kql: R`DeviceEvents
| where ActionType == "OpenProcessApiCall" and FileName =~ "lsass.exe"
| where InitiatingProcessFileName !in~ ("MsMpEng.exe", "svchost.exe", "csrss.exe", "wininit.exe")
| project Timestamp, DeviceName, InitiatingProcessFileName, InitiatingProcessFolderPath`,
      cql: R`// Falcon flags credential dumping natively; this hunts common tooling around it
#event_simpleName=ProcessRollup2
| CommandLine=/lsass|comsvcs.*MiniDump|sekurlsa/i
| table([@timestamp, ComputerName, UserName, ImageFileName, CommandLine])`},
  4: {kql: R`SecurityEvent
| where EventID == 4624 and LogonType == 3
| where TargetUserName in~ ("it-admin")         // your Domain Admins
| where WorkstationName startswith "WS-"         // ...connecting from workstations
| project TimeGenerated, Computer, TargetUserName, WorkstationName, IpAddress
| union (Event | where EventLog == "System" and EventID == 7045
    | project TimeGenerated, Computer, RenderedDescription)`,
      cql: R`#event_simpleName=UserLogon LogonType=3
| UserName=/^it-admin$/i                        // your Domain Admins
| table([@timestamp, ComputerName, UserName, RemoteAddressIP4])`},
  5: {kql: R`DeviceProcessEvents
| where (FileName =~ "vssadmin.exe" and ProcessCommandLine has_all ("delete", "shadows"))
     or (FileName =~ "wmic.exe" and ProcessCommandLine has_all ("shadowcopy", "delete"))
| project Timestamp, DeviceName, AccountName, ProcessCommandLine`,
      cql: R`#event_simpleName=ProcessRollup2 ImageFileName=/\\(vssadmin|wmic)\.exe$/i
| CommandLine=/delete\s+shadows|shadowcopy\s+delete/i
| table([@timestamp, ComputerName, UserName, CommandLine])`},
  6: {kql: R`CommonSecurityLog                               // firewall logs
| where SourceIP in ("10.0.5.10")                // your file servers
| summarize GB = sum(SentBytes) / 1e9 by DestinationHostName, Window = bin(TimeGenerated, 1h)
| where GB > 5`,
      cql: R`// Firewall / NetFlow logs
source.ip=10.0.5.10                             // your file servers
| groupBy([destination.domain], function=sum(source.bytes, as=bytes_out))
| bytes_out > 5000000000`},
  7: {kql: R`DeviceFileEvents
| where ActionType == "FileRenamed" and FileName endswith ".locked"
| summarize Files = count() by DeviceName, Window = bin(Timestamp, 5m)
| where Files > 100`,
      cql: R`// Falcon detects ransomware behaviour natively; this scopes the blast radius
TargetFileName=/\.locked$|README_RESTORE\.txt$/i
| groupBy([ComputerName], function=count(as=files))`}
},

"cred-replay": {
  1: {kql: R`DeviceProcessEvents
| where FileName in~ ("powershell.exe", "pwsh.exe")
| where ProcessCommandLine matches regex @"(?i)\s-e(nc|ncodedcommand)?\s"
| project Timestamp, DeviceName, AccountName, ProcessCommandLine`,
      cql: R`#event_simpleName=ProcessRollup2 ImageFileName=/\\(powershell|pwsh)\.exe$/i
| CommandLine=/\s-e(nc|ncodedcommand)?\s/i
| table([@timestamp, ComputerName, UserName, CommandLine])`},
  2: {kql: R`SecurityEvent
| where EventID == 4624 and LogonType == 10
| where TargetUserName in~ ("t2-admin")          // Tier 0 accounts
| where Computer !startswith "DC" and Computer !startswith "PAW"
| project TimeGenerated, Computer, TargetUserName, IpAddress`,
      cql: R`#event_simpleName=UserLogon LogonType=10 UserName=/^t2-admin$/i   // Tier 0 accounts
| ComputerName!=/^(DC|PAW)/
| table([@timestamp, ComputerName, UserName])`},
  3: {kql: R`DeviceProcessEvents
| where FileName =~ "rundll32.exe" and ProcessCommandLine has_all ("comsvcs", "MiniDump")
| project Timestamp, DeviceName, AccountName, ProcessCommandLine`,
      cql: R`#event_simpleName=ProcessRollup2 ImageFileName=/\\rundll32\.exe$/i
| CommandLine=/comsvcs.*MiniDump/i
| table([@timestamp, ComputerName, UserName, CommandLine])`},
  4: {kql: R`SecurityEvent
| where EventID == 4624 and LogonType == 3 and AuthenticationPackageName == "NTLM"
| where TargetUserName in~ ("t2-admin")          // privileged accounts
| project TimeGenerated, Computer, TargetUserName, WorkstationName, IpAddress`,
      cql: R`event.code="4624" Vendor.LogonType=3 Vendor.AuthenticationPackageName="NTLM"
| user.name=/^t2-admin$/i
| table([@timestamp, host.name, user.name, source.ip])`},
  5: {kql: R`SecurityEvent
| where Computer startswith "DC" and EventID == 4672 and SubjectUserName =~ "t2-admin"
| join kind=inner (Event | where EventID == 7045
    | project Computer, SvcTime = TimeGenerated, RenderedDescription) on Computer
| where SvcTime between (TimeGenerated .. TimeGenerated + 30m)`,
      cql: R`host.name=/^DC/ event.code="7045"
| table([@timestamp, host.name, Vendor.ServiceName, Vendor.ImagePath])`}
},

"supply-chain": {
  4: {kql: R`_Im_Dns
| extend Domain = strcat_array(array_slice(split(DnsQuery, "."), -2, -1), ".")
| summarize Clients = dcount(SrcIpAddr), Queries = count(), First = min(TimeGenerated) by Domain
| where Clients == 1 and Queries > 100           // one host, regular lookups`,
      cql: R`dns.question.registered_domain=*
| groupBy([dns.question.registered_domain], function=[count(source.ip, distinct=true, as=clients), count(as=queries)])
| test(clients == 1 and queries > 100)`},
  5: {kql: R`IdentityQueryEvents
| where ActionType == "LDAP query" and AccountName =~ "svc-netwatch"
| where Query has_any ("objectClass=user", "Domain Admins", "adminCount=1")
| project Timestamp, AccountName, DeviceName, Query`,
      cql: R`// Falcon Identity Protection or DC LDAP logs
user.name="svc-netwatch"
| Vendor.Filter=/objectClass=user|Domain Admins|adminCount=1/i
| groupBy([user.name, source.ip], function=count(as=queries))`},
  6: {kql: R`_Im_Dns
| extend Label = tostring(split(DnsQuery, ".")[0])
| where strlen(Label) > 30                       // long, random-looking labels
| summarize Queries = count() by SrcIpAddr,
    Domain = strcat_array(array_slice(split(DnsQuery, "."), -2, -1), ".")
| where Queries > 1000`,
      cql: R`dns.question.name=*
| Label := splitString(field=dns.question.name, by="\\.", index=0)
| length(Label, as=len)
| len > 30
| groupBy([source.ip, dns.question.registered_domain], function=count(as=queries))
| queries > 1000`}
},

"kerberoast": {
  2: {kql: R`IdentityQueryEvents
| where ActionType == "LDAP query" and Query has "servicePrincipalName=*"
| project Timestamp, AccountName, DeviceName, Query`,
      cql: R`// Falcon Identity Protection or DC LDAP logs
Vendor.Filter=/servicePrincipalName=\*/i
| groupBy([user.name, source.ip], function=count(as=queries))`},
  3: {kql: R`SecurityEvent
| where EventID == 4769
| parse EventData with * 'TicketEncryptionType">' EncType "<" *
| parse EventData with * 'ServiceName">' Service "<" *
| where EncType == "0x17" and Service !endswith "$"   // RC4, user-run services
| summarize Services = dcount(Service), Names = make_set(Service)
    by TargetUserName, IpAddress, Window = bin(TimeGenerated, 5m)
| where Services >= 3`,
      cql: R`event.code="4769" Vendor.TicketEncryptionType="0x17"
| Vendor.ServiceName!=/\$$/
| groupBy([user.name, source.ip], function=count(Vendor.ServiceName, distinct=true, as=services))
| services >= 3`},
  5: {kql: R`SecurityEvent
| where EventID == 4624 and LogonType == 3
| where TargetUserName startswith "svc-"         // service accounts...
| where WorkstationName startswith "WS-"         // ...logging on from workstations
| project TimeGenerated, Computer, TargetUserName, WorkstationName, IpAddress`,
      cql: R`#event_simpleName=UserLogon LogonType=3 UserName=/^svc-/i
| table([@timestamp, ComputerName, UserName, RemoteAddressIP4])`},
  6: {kql: R`AzureDiagnostics                                // SQL audit (Azure SQL / Arc)
| where Category == "SQLSecurityAuditEvents"
| where server_principal_name_s endswith "svc-sql" and application_name_s has "Management Studio"
| project TimeGenerated, server_principal_name_s, statement_s, client_ip_s`,
      cql: R`user.name=/svc-sql/i Vendor.application_name=/Management Studio/i
| table([@timestamp, user.name, Vendor.statement, source.ip])`}
},

"oauth-consent": {
  2: {kql: R`EmailUrlInfo
| where Url has "login.microsoftonline.com" and Url has "oauth2" and Url has "client_id="
| join kind=inner (EmailEvents) on NetworkMessageId
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, Url`,
      cql: R`url.original=/login\.microsoftonline\.com\/.*oauth2.*client_id=/i
| table([@timestamp, email.from.address, email.to.address, email.subject, url.original])`},
  3: {kql: R`AuditLogs
| where OperationName == "Consent to application"
| extend App = tostring(TargetResources[0].displayName),
         User = tostring(InitiatedBy.user.userPrincipalName),
         Perms = tostring(TargetResources[0].modifiedProperties)
| where Perms has_any ("Mail.Read", "Files.Read.All", "offline_access")
| project TimeGenerated, User, App, Perms`,
      cql: R`#Vendor="microsoft" event.action="Consent to application"
| table([@timestamp, user.name, Vendor.targetResources[0].displayName])`},
  4: {kql: R`CloudAppEvents
| where ActionType == "MailItemsAccessed"
| extend AppId = tostring(RawEventData.AppId)
| where isnotempty(AppId)
| summarize Items = count() by AppId, AccountDisplayName, IPAddress
| order by Items desc`,
      cql: R`#Vendor="microsoft" event.action="MailItemsAccessed" Vendor.AppId=*
| groupBy([Vendor.AppId, user.name, source.ip], function=count(as=items))
| sort(items, order=desc)`},
  5: {kql: R`MicrosoftGraphActivityLogs
| where AppId == "7c1e…"                          // the suspicious app
| summarize Requests = count(), LastSeen = max(TimeGenerated) by AppId, UserId, IPAddress`,
      cql: R`// Microsoft Graph activity logs, if you ingest them
Vendor.AppId="7c1e…"
| groupBy([Vendor.AppId, source.ip], function=[count(as=requests), max(@timestamp, as=last_seen)])`},
  6: {kql: R`CloudAppEvents
| where ActionType == "FileDownloaded"
| summarize Files = count() by Application, AccountDisplayName, IPAddress, Window = bin(Timestamp, 1h)
| where Files > 200`,
      cql: R`#Vendor="microsoft" event.action="FileDownloaded"
| groupBy([Vendor.ApplicationDisplayName, user.name], function=count(as=files))
| files > 200`}
},

"quishing": {
  1: {kql: R`EmailAttachmentInfo
| where FileType =~ "pdf"
| join kind=inner (EmailEvents
    | where UrlCount == 0 and Subject has_any ("MFA", "authenticator", "re-register")) on NetworkMessageId
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, FileName`,
      cql: R`email.subject=/MFA|authenticator|re-?register/i
| email.attachments.file.extension="pdf"
| table([@timestamp, email.from.address, email.to.address, email.subject])`},
  3: {kql: R`SigninLogs
| where ResultType == "0"
| extend OS = tostring(DeviceDetail.operatingSystem), Compliant = tostring(DeviceDetail.isCompliant)
| where Compliant != "true" and OS == "Linux"
| project TimeGenerated, UserPrincipalName, IPAddress, OS, RiskLevelDuringSignIn`,
      cql: R`#Vendor="microsoft" #event.module="entraid" event.outcome="success"
| Vendor.properties.deviceDetail.isCompliant=false
| table([@timestamp, user.name, source.ip, Vendor.properties.deviceDetail.operatingSystem])`},
  4: {kql: R`AuditLogs
| where OperationName == "User registered security info"
| extend User = tostring(TargetResources[0].userPrincipalName),
         IP = tostring(InitiatedBy.user.ipAddress)
| project TimeGenerated, User, IP, ResultReason`,
      cql: R`#Vendor="microsoft" event.action="User registered security info"
| table([@timestamp, user.target.name, source.ip])`},
  5: {kql: R`EmailEvents
| where EmailDirection == "Intra-org"
| summarize Recipients = dcount(RecipientEmailAddress) by SenderFromAddress, Subject, Window = bin(Timestamp, 10m)
| where Recipients > 100`,
      cql: R`email.direction="internal"
| groupBy([email.from.address, email.subject], function=count(email.to.address, distinct=true, as=recipients))
| recipients > 100`}
},

"evil-twin": {
  2: {kql: R`Syslog                                          // wireless controller / WIDS
| where SyslogMessage has_any ("deauth", "Deauthentication flood", "rogue AP")
| project TimeGenerated, HostName, SyslogMessage`,
      cql: R`// Wireless controller / WIDS events
@rawstring=/deauth(entication)? (flood|attack)|rogue ap|spoofed bssid/i
| table([@timestamp, host.name, @rawstring])`},
  3: {kql: R`Event
| where EventLog == "Microsoft-Windows-WLAN-AutoConfig/Operational" and EventID == 8001
| extend SSID = extract(@"SSID: ([^\r\n]+)", 1, RenderedDescription),
         BSSID = extract(@"BSSID: ([0-9A-Fa-f:]+)", 1, RenderedDescription)
| summarize BSSIDs = make_set(BSSID) by Computer, SSID, Day = bin(TimeGenerated, 1d)
| where array_length(BSSIDs) > 1                 // same name, different hardware`,
      cql: R`event.code="8001" Vendor.SSID=*
| groupBy([host.name, Vendor.SSID], function=count(Vendor.BSSID, distinct=true, as=bssids))
| bssids > 1`},
  4: {kql: R`DeviceNetworkEvents
| where RemotePort == 80 and ipv4_is_private(RemoteIP)
| where InitiatingProcessFileName in~ ("msedge.exe", "chrome.exe", "firefox.exe")
| join kind=inner (DeviceNetworkInfo | mv-expand ConnectedNetworks
    | where tostring(ConnectedNetworks.Category) == "Public" | distinct DeviceId) on DeviceId
| project Timestamp, DeviceName, RemoteIP, RemoteUrl`,
      cql: R`#event_simpleName=NetworkConnectIP4 RemotePort=80
| cidr(RemoteAddressIP4, subnet=["192.168.0.0/16", "172.16.0.0/12", "10.0.0.0/8"])
| table([@timestamp, ComputerName, RemoteAddressIP4])`},
  5: {kql: R`DeviceNetworkInfo
| mv-expand DnsAddresses
| extend Dns = tostring(DnsAddresses)
| where Dns !in ("10.0.0.53", "10.0.0.54")         // your DNS servers
| summarize by DeviceName, Dns, Hour = bin(Timestamp, 1h)`, cql: null},
  6: {kql: R`CommonSecurityLog                               // VPN gateway logs
| where Activity has "login" and DeviceAction == "success"
| extend Method = extract(@"method=(\w+)", 1, AdditionalExtensions)
| where Method == "password"
| project TimeGenerated, SourceUserName, SourceIP, Method`,
      cql: R`event.category="authentication" event.outcome="success" Vendor.method="password"
| table([@timestamp, user.name, source.ip])`}
},

"insider": {
  2: {kql: R`let leavers = dynamic(["m.cole@contoso.com"]);     // from your HR leaver feed
CloudAppEvents
| where ActionType in ("FileDownloaded", "FileSyncDownloadedFull")
| extend User = tolower(tostring(RawEventData.UserId))
| where User in (leavers)
| summarize Files = count() by User, Hour = bin(Timestamp, 1h)
| where Files > 100`,
      cql: R`#Vendor="microsoft" event.action=/^(FileDownloaded|FileSyncDownloadedFull)$/
| match(file="leavers.csv", field=user.email, column=email)   // HR leaver list as a lookup file
| groupBy([user.email], function=count(as=files))
| files > 100`},
  3: {kql: R`DeviceProcessEvents
| where FileName in~ ("7z.exe", "7za.exe", "winrar.exe", "rar.exe")
| where ProcessCommandLine matches regex @"\s-(p|hp)"    // password-protected archives
| project Timestamp, DeviceName, AccountName, ProcessCommandLine`,
      cql: R`#event_simpleName=ProcessRollup2 ImageFileName=/\\(7z|7za|rar|winrar)\.exe$/i
| CommandLine=/\s-(p|hp)/i
| table([@timestamp, ComputerName, UserName, CommandLine])`},
  4: {kql: R`let usb = DeviceEvents
    | where ActionType == "UsbDriveMounted"
    | extend Drive = tostring(AdditionalFields.DriveLetter), Serial = tostring(AdditionalFields.SerialNumber)
    | project DeviceId, Drive, Serial;
DeviceFileEvents
| where ActionType == "FileCreated"
| extend Drive = substring(FolderPath, 0, 2)
| join kind=inner (usb) on DeviceId, Drive
| project Timestamp, DeviceName, Serial, FileName, FileSize`,
      cql: R`#event_simpleName=DcUsbDeviceConnected
| table([@timestamp, ComputerName, DeviceManufacturer, DeviceProduct, DeviceSerialNumber])`},
  5: {kql: R`CommonSecurityLog                               // proxy / CASB
| where RequestMethod in ("POST", "PUT") and DestinationHostName has "drop-box.example"
| summarize GB = sum(SentBytes) / 1e9 by SourceUserName, DestinationHostName
| where GB > 0.5`,
      cql: R`http.request.method=/POST|PUT/ url.domain=/drop-box\.example$/
| groupBy([user.name, url.domain], function=sum(source.bytes, as=bytes_up))
| bytes_up > 500000000`}
}

};
})();
