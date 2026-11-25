/* Cloudwalk: "Why it matters" for every step, shown in the What's happening box.
   steps[i] matches the broken run's step i; fixed[i] is for steps that only happen in the fixed run.
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
window.EXPLAIN = {
  "sync-scope": {
    steps: [
      "In a hybrid company, accounts are born in on-premises Active Directory and copied to Microsoft 365. Where the account is created matters as much as how, because the sync tool only copies certain OUs.",
      "A sync that runs perfectly but skips someone is a scope problem, not a fault. Entra Connect only exports objects in the OUs it's been told to read, and it won't warn you about the rest.",
      "'This username may be incorrect' means Microsoft 365 can't find the account at all, before it even checks a password. That points to sync, not to a password or MFA problem."
    ],
    fixed: {
      0: "Moving the account into a synced OU puts it in scope without changing anything else about it. Adding New Starters to the sync scope would fix it for future starters too.",
      1: "A delta sync sends only what's changed, so it's quick. Running one on demand saves waiting up to 30 minutes for the next scheduled cycle.",
      2: "Once Leo exists in Entra ID, everything else follows: sign-in, MFA set-up and his apps. The fix was entirely about where his account lived."
    }
  },
  "mfa-newphone": {
    steps: [
      "The password passing is useful information: the account and password are fine, so the problem is only the second check.",
      "Authenticator notifications go to a specific registered device, not to a phone number or an account. A new phone with the app installed isn't linked until it's registered.",
      "Error 500121 means the user didn't complete the strong authentication step. On its own it doesn't say why; the registered methods tell you why."
    ],
    fixed: {
      0: "Resetting MFA is high-risk, so identity is confirmed strongly first. A Temporary Access Pass is safer than turning MFA off, because it's short-lived and can only be used once.",
      1: "A Temporary Access Pass counts as strong authentication, which is why it can take Aisha straight to registering a new method.",
      2: "Registering the new phone and removing the old one means prompts go to the right device, and a lost or traded-in phone can't be used to approve anything.",
      3: "A normal sign-in with the new phone proves the fix. It's worth suggesting a backup method too, so the next new phone isn't a ticket."
    }
  },
  "ca-travel": {
    steps: [
      "Passing the password and MFA proves who Grace is. Conditional Access then decides whether she's allowed in from where she is, on what device and to which app.",
      "CA010 is a location rule. Blocking sign-ins from outside the UK cuts out a lot of attacks, and the travel exception group is the controlled way to let genuine trips through.",
      "Error 53003 means 'signed in fine, blocked by policy'. The sign-in log shows exactly which policy did it, which is much faster than guessing."
    ],
    fixed: {
      0: "Adding her to the exception group with an end date gives her access for the trip and no longer. Exceptions that never get removed slowly undo a security policy.",
      2: "Her location is the same, but CA010 now skips her because she's in the exception group. The MFA rule still applies, so the account is still protected.",
      3: "She's working again, and the access is time-limited. Removing her when she's back is part of the fix, not an afterthought."
    }
  },
  "smtp-scanner": {
    steps: [
      "The connection and encryption working rules out the network and the firewall, so the problem must be at the sign-in.",
      "Error 535 5.7.139 means SMTP AUTH is switched off for the tenant, not that the password is wrong. Microsoft is retiring basic SMTP AUTH, so devices that rely on it need a different way to send.",
      "Message trace only records mail the server accepted. 'Nothing in message trace' means the scanner was turned away before it could hand anything over."
    ],
    fixed: {
      0: "A connector that trusts the office's public IP lets the printer send without a password at all. It works with the security change instead of undoing it.",
      1: "The scanner now sends to the company's own mail address at Microsoft over port 25, and is recognised by where it comes from, not by a password.",
      2: "Scans arrive again for everyone on the floor. It's worth checking other devices that send mail, because they'll have hit the same change."
    }
  },
  "no-licence": {
    steps: [
      "A working sign-in proves the account exists and MFA is set up. Whatever's wrong comes after sign-in, which points at licences or services rather than identity.",
      "Group-based licensing is tidy, but only if people are put in the group. Missing the group means no licence, and no licence means no services at all.",
      "No mailbox and 'not licensed' in Teams are the same fault showing up in two places. Fix the licence and both go away."
    ],
    fixed: {
      0: "Adding Tom to the group in Active Directory, then syncing, applies the licence automatically. It also keeps him licensed if he moves teams, as long as he stays in the group.",
      1: "Exchange Online builds the mailbox only once there's a licence with email in it. It usually takes minutes, so warn the user it won't be instant.",
      2: "Restarting Outlook lets it find the new mailbox. Teams follows once its licence is recognised."
    }
  },
  "dyn-typo": {
    steps: [
      "Sign-in working rules out identity. The question is whether Fatima has permission to the site, which here comes from a group.",
      "Dynamic groups fill themselves from a rule, so one typo can empty them instantly. Nobody's department matched 'Finanace', so everybody fell out of the group at once.",
      "'Whole team locked out at the same time' usually means a group or policy changed, not anything about each person.",
      "The audit log shows who changed the rule and when. Finding the change that matches when the problem started is often the quickest route to the cause."
    ],
    fixed: {
      0: "Validating the rule against a real user before saving catches typos like this before they lock anyone out.",
      1: "Dynamic membership recalculates within minutes, so access comes back without anyone adding members by hand.",
      2: "The whole team's access returns at once, which confirms the group rule was the only problem."
    }
  },
  "intune-phone": {
    steps: [
      "Password and MFA passing means Daniel is who he says he is. The block comes later, from a device rule.",
      "CA020 requires a compliant device, which means enrolled in Intune and passing its checks. A phone that's never been enrolled can't be compliant, however secure it really is.",
      "Error 53000 means 'device not compliant'. His laptop still working shows the account is fine and the problem is only this phone."
    ],
    fixed: {
      0: "Enrolling with Company Portal puts the phone under Intune management and runs the compliance checks, like a passcode and an up-to-date OS.",
      2: "Once Intune says the phone is compliant, CA020 lets it through. Nothing about Daniel's account changed; only the phone's status did.",
      3: "Teams opens with his chats. It's worth adding a line to onboarding notes: install Company Portal before Teams on a new phone."
    }
  },
  "shared-automap": {
    steps: [
      "Giving access through a group is good practice for managing permissions, but it changes how classic Outlook behaves.",
      "Autodiscover only lists mailboxes where the user has Full Access directly, because group membership isn't expanded. That's why automapping doesn't happen through groups.",
      "Opening it in Outlook on the web proves the permission works. That separates 'no access' from 'access, but Outlook won't add it', which are fixed differently."
    ],
    fixed: {
      0: "Granting Full Access directly, with automapping on, is what makes classic Outlook add the mailbox. Some teams keep both, so the group still manages access.",
      1: "Autodiscover now lists accounts@ as a mailbox Olivia should see, because her access is direct. That list is exactly what classic Outlook reads when it starts up.",
      2: "After a restart it appears under her own mailbox, just like her colleague's. The difference was only ever how the permission was given."
    }
  }
};
