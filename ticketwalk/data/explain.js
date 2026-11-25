/* Ticketwalk: "Why it matters" for every step, shown in the What's happening box.
   steps[i] matches the broken run's step i; fixed[i] is for steps that only happen in the fixed run.
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
window.EXPLAIN = {
  "lockout": {
    steps: [
      "A repeat lockout is a clue, not a coincidence. Two 'unlocked, closed' tickets in two days tell you the last two fixes treated the symptom, so this one needs a different approach.",
      "An unlock hands a working account to whoever is on the phone. Calling back on the number the company already holds means an impostor ringing from their own phone can't get in, however convincing they sound.",
      "Triage decides who owns the ticket and how fast it moves. Linking the earlier tickets turns three separate 'quick unlocks' into one problem worth solving properly, and stops the desk wasting time on the same fault every morning.",
      "Event 4740 on the domain controller is the most useful record in any lockout: it names the machine the bad passwords came from. Here it points away from Tom's laptop and towards the Wi-Fi, which changes the whole investigation.",
      "This is the real cause: a device quietly holding an old password. Phones, mapped drives, saved Outlook profiles and scheduled tasks all do this after a password change, and none of them tell the user they're doing it.",
      "This shows why unlocking alone can't work. The lockout clears itself after 15 minutes, the phone tries again, and the cycle repeats until the saved password is fixed at the source."
    ],
    fixed: {
      5: "The order matters: fix the device first, unlock second. Unlock first and the phone can lock Tom out again before he's even back at his desk.",
      6: "Confirming before closing is what stops this becoming ticket number four. A good closing note also means the next engineer who sees a lockout from NPS01 knows where to look."
    }
  },
  "mfa-newphone": {
    steps: [
      "Turning MFA off 'just for today' is the most common request and the riskiest answer. While it's off, anyone with Grace's password can sign in as her, so the real job is getting MFA working again, not removing it.",
      "Resetting MFA is exactly what an attacker would ask for, so it gets the strongest check on the desk. An ID check in person plus a call to her manager on a known number proves it's Grace, not someone with her name and password.",
      "This is a standard service desk fix once you know how, so it stays on the desk. It's still urgent for Grace, because without MFA she can't reach email, Teams or anything else that matters.",
      "Watching the sign-in narrows it down: the password step passes, so her account and password are fine. The failure is only at the second check, which is where the investigation needs to go.",
      "One registered method with no backup is the root cause, and it's very common. Encouraging people to register a second method (a second phone, a security key or a backup app) prevents this ticket entirely.",
      "Nothing Grace can do from her side will help, because the system will keep asking a phone she no longer has. Only an admin can remove the old method and let her set up the new one."
    ],
    fixed: {
      5: "A Temporary Access Pass lets someone prove who they are for a short time, just long enough to register a new method. It's far safer than switching MFA off, because it expires on its own and only works once.",
      6: "Testing the full sign-in with Grace, and checking the sign-in log shows MFA passing, proves the fix rather than assuming it. That's the evidence you note on the ticket before closing it."
    }
  },
  "vishing-ceo": {
    steps: [
      "Urgency, authority and a reason the usual process can't be followed are the three classic signs of social engineering. A real executive with a real problem can survive a two-minute call-back.",
      "Knowledge-based questions only prove someone can find the answers. Employee IDs, start dates and dates of birth turn up in old org charts, leaked files and social media, so they're weak proof of identity.",
      "Triage under pressure tends to ask 'how fast?' when the right question is 'is this safe?'. Treating an unexpected request for a password and MFA reset on a senior account as a possible security incident is good triage, not rudeness.",
      "This is the moment the attack succeeds. A password reset plus an MFA reset, handed to an unverified caller, gives the attacker complete control of the account, with nothing left to stop them.",
      "Attackers move fast once they're in. Registering their own MFA and hiding replies with an inbox rule is a standard playbook, so the real owner won't notice and can't easily take the account back.",
      "Business email compromise from a genuine mailbox is one of the most expensive attacks there is, because every email check passes. The bill for one skipped call-back can be a payment that never comes back."
    ],
    fixed: {
      1: "A call-back to the number on file defeats this attack completely, however convincing the caller is. Holding the line politely when someone senior is shouting at you is a real service desk skill.",
      2: "Once you know it's fake, it stops being a password ticket and becomes a security incident. Escalating with the details (number, time, what they knew) lets the security team protect the account and spot the same caller elsewhere.",
      3: "The call was plan B. Finding the failed sign-ins from earlier shows the attacker already had Helen's username and was trying passwords, which tells security what else needs protecting.",
      4: "Closing out properly means blocking the attacker, protecting the account and warning the team, because the same caller will often try again as someone else. The written record is what makes the lesson stick."
    }
  },
  "shared-missing": {
    steps: [
      "'Everyone else has it' is a useful detail: it means the mailbox works and the difference is something about Jo. That points straight at how she was given access.",
      "For access requests, the right question is whether the person should have it, not just who they are. The mailbox owner's approval on the ticket is your audit trail if anyone asks later why Jo can read the Sales inbox.",
      "A working workaround lowers the priority, but it doesn't make the ticket go away. Jo can manage today with Outlook on the web while you fix it properly.",
      "Checking permissions tells you she does have access, just through a group rather than by name. So the problem isn't access at all; it's how Outlook decides what to show.",
      "This is the root cause, and it trips up experienced admins too: Outlook only adds shared mailboxes automatically when access is granted to the person directly. Access through a group works, but you have to add the mailbox by hand.",
      "Restarting can't fix a permissions design, which is why 'turn it off and on again' gets nowhere here. Nothing will change until the way she was given access changes."
    ],
    fixed: {
      5: "Granting Full Access to Jo directly, with automapping on, is what makes Outlook add the mailbox for her. Group access is still tidier for management, so some teams use both.",
      6: "Flagging the mix of group and direct permissions is the bit that prevents the next ticket. The next starter added to the group will hit exactly the same thing otherwise."
    }
  },
  "send-as": {
    steps: [
      "The bounce message is the best evidence you'll get, so asking for it saves a lot of guessing. Exchange usually says exactly why it refused to send.",
      "Sending as a shared mailbox means speaking for the whole team, or the company. That's why it needs the owner's approval, separately from permission to read it.",
      "There's no sensible workaround: replying from his own address breaks the team's rule and confuses customers. That makes it a proper priority rather than something that can wait.",
      "554 5.2.252 SendAsDenied is Exchange telling you the sender doesn't have Send As permission. Recognising the code takes you straight to the answer.",
      "Full Access and Send As are separate permissions, and having one doesn't give you the other. Full Access lets you open and read the mailbox; Send As lets you send as it.",
      "Retrying won't help, because the missing permission is the problem, not a glitch. Every send will bounce the same way until Send As is granted."
    ],
    fixed: {
      5: "Send As can take a little while to apply across Exchange Online. Testing again after a short wait, rather than straight away, avoids a false 'it didn't work'.",
      6: "Checking what the customer actually received proves the fix from their side. Noting who approved the permission keeps the audit trail tidy."
    }
  },
  "mailbox-full": {
    steps: [
      "A deadline changes the urgency, even though only one person is affected. Note it on the ticket, because it's why this jumps the queue.",
      "The check should match the risk. Nothing about her access is changing, so a light check is proportionate, and you can save the strong checks for resets and permissions.",
      "Priority isn't only about how many people are affected. A hard deadline and the risk of clients' emails bouncing make this one worth working now.",
      "Knowing the limits tells you how urgent it really is. Sending stops at 49.5 GB, and at 50 GB she'd stop receiving too, which means client emails bouncing back to them.",
      "Her licence already includes the fix: an online archive. The retention policy was ready to move old mail into it, but it had nowhere to go because the archive was never switched on.",
      "This is what happens when the cause isn't fixed in time: a missed deadline with a client. It's also why 'delete some old emails' isn't an option when the law says she must keep them."
    ],
    fixed: {
      5: "The archive is part of her mailbox, so nothing is deleted and nothing breaks the rules about keeping records. Once it's switched on, the move can take a while, but it starts freeing space straight away.",
      6: "Showing her where the archive appears in Outlook avoids a panicked 'where's my old email?' ticket next week. Checking others in Legal catches the next full mailbox before it's an emergency."
    }
  },
  "printer-offline": {
    steps: [
      "'Offline for everyone' tells you the problem is at the printer or the server, not on one person's PC. That rules out a lot of the usual desk-side fixes before you start.",
      "Verification is about risk. Nobody's access is changing, so there's nothing to protect, and your time is better spent on the questions that find the fault.",
      "Thirty people is a big impact, but a working printer upstairs means nobody is completely stuck. A clear workaround in the first reply keeps people working while you fix it.",
      "Following one job tells you where it stops. It reaches the print server fine, so the PCs are fine; the break is between the server and the printer.",
      "The printer didn't break: it moved. While it was switched off its address lease ran out and was given away, so it came back with a new address the print server didn't know about.",
      "Every job still goes to the old address, so the queue just grows. Reinstalling drivers or restarting the spooler can't help, because neither changes where the jobs are being sent."
    ],
    fixed: {
      5: "A DHCP reservation means the printer always gets the same address, so the print server's port always matches. It's the standard way to stop network printers wandering.",
      6: "Draining the queue and confirming with Chris proves it's working. Giving the other printers reservations too is the change that stops the same ticket coming back from another floor."
    }
  },
  "new-starter": {
    steps: [
      "A first-day failure is worth fixing fast and worth understanding, because it reflects on the whole onboarding process. If it happened to Sam, it'll happen to the next starter too.",
      "New starters have nothing on file to check against, so you lean on people and records that already exist: her manager on a known number and HR's start list.",
      "One person, but it's her first day and she can't work at all. Fixing it quickly matters, and so does asking how she got through without email.",
      "Signing in to the laptop only proves her account exists. The mailbox is a separate thing in Microsoft 365, and here it simply doesn't exist yet.",
      "Licences come from a group, and Sam isn't in it. Comparing her with someone who works is a quick way to find the difference: the template everyone else was built from includes the group, and her form didn't.",
      "Waiting won't help, because nothing is going to give her a licence by itself. This is a fault in the starter process, not a slow system."
    ],
    fixed: {
      5: "Once the licence lands, Microsoft 365 builds the mailbox and switches on Teams and OneDrive. It usually takes minutes, sometimes longer, so it's worth telling the user what to expect.",
      6: "Raising a problem for the starter form is the most valuable part of this ticket. Fixing the form once stops every future starter hitting the same wall on day one."
    }
  }
};
