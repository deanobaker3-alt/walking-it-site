/* Ticketwalk: Grandad mode. The same story as each step, in everyday language with no jargon.
   steps[i] matches the broken run's step i; fixed[i] is for steps that only happen in the fixed run (index into "fixed").
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
window.GRANDAD = {
  "lockout": {
    intro: "Tom changed his password on Monday. His laptop knows the new one, but his phone still remembers the old one for the office Wi-Fi. Every morning when he walks in, the phone quietly tries the old password a few times, and that's enough to lock Tom's account. Unlocking it only lasts until the phone tries again.",
    steps: [
      "Tom rings the IT desk. He's locked out of his computer again, for the third morning in a row. Yesterday someone unlocked him and said it was sorted. The day before, the same.",
      "Unlocking an account hands it straight to whoever's on the phone, so first you make sure it's really Tom. You ring him back on the number the company has for him, and he answers.",
      "One person can't work, so it's a normal-priority job. But it's the third time, so instead of just unlocking him again, you decide to find out why it keeps happening.",
      "You ask the system that looks after passwords: who locked Tom out? It keeps a note of where the wrong passwords came from. It wasn't his laptop. It was the machine that lets people onto the office Wi-Fi.",
      "That machine's notes show the wrong passwords all came from one thing: Tom's phone. It's like a spare key with the old lock cut on it. Every morning the phone tries it on the Wi-Fi door, again and again, and the system thinks someone's trying to break in.",
      "The lock-out wears off after a quarter of an hour. Straight away the phone tries the old password again, and Tom's locked out once more. As long as the phone remembers the old password, this ticket will keep coming back."
    ],
    fixed: {
      5: "You talk Tom through making his phone forget the office Wi-Fi, then joining again with his new password. Only then do you unlock his account. This time the phone has the right key, so nothing gets locked.",
      6: "An hour later he's still unlocked and there have been no wrong passwords at all. Tom's been working all morning. You close the ticket with a note saying what was really going on."
    }
  },
  "mfa-newphone": {
    intro: "Signing in takes two checks: your password, then a tap on your phone to say 'yes, it's me'. Grace's password is fine, but the 'is it you?' message keeps going to her old phone, which she traded in at the weekend. She can't set up the new phone without signing in, and she can't sign in without the old phone.",
    steps: [
      "Grace comes to the IT desk with her laptop and her shiny new phone. Every time she signs in, it asks her to say yes on her old phone, which has gone back to the shop. She asks if you can just switch the phone check off for today.",
      "Resetting someone's phone check is exactly what a crook would want, so you're extra careful. Grace is standing in front of you, so you compare her face with her ID photo, and ring her manager on the number the company has for him to confirm.",
      "One person can't get into email or Teams. It's normal priority, and it's a job the IT desk can do itself once it knows how.",
      "Grace signs in on her laptop while you watch. The password works. Then the 'is this you?' message goes off to her old phone, which is sitting in a recycling depot. Nobody answers, so the sign-in fails.",
      "You look at how Grace is set up to prove it's her. There's exactly one way: the app on her old phone. No spare, no backup. So there's nowhere else for the message to go.",
      "Grace tries again from Outlook. Same thing: the message goes to the old phone, nobody answers, and she can't get in. Nothing changes until her new phone is set up."
    ],
    fixed: {
      5: "You cross the old phone off Grace's account and give her a one-off temporary pass that lasts an hour. She uses it to sign in on her new phone and sets up the app. Now the new phone is the one that gets asked.",
      6: "Grace signs in to Teams. This time the 'is this you?' message pops up on the phone in her hand, she types in the number it shows, and she's in. You check it worked and close the ticket."
    }
  },
  "vishing-ceo": {
    intro: "Someone rings the IT desk saying they're the boss: in a rush, cross, and on a borrowed phone, wanting their password reset right now. It isn't the boss. It's a crook who found her name and details online, betting the desk will be too worried about upsetting the boss to check properly.",
    steps: [
      "The phone rings from a number nobody recognises. The caller says she's Helen, the boss, at the airport with a dead phone. She needs her password and phone check reset before she gets on the plane, and she's not happy about waiting.",
      "You ask the usual security questions, and she answers them without a pause, sounding more and more annoyed. It feels like she's passed. But the answers are the kind of thing anyone can dig up from an old staff chart or the internet.",
      "It's the boss, she's cross, and she's about to fly. Everything is about being quick. Nobody stops to ask the important question: is this really her?",
      "You reset the password, remove her phone check so she can 'use the borrowed phone', and read the new password out to the caller. You've just handed a stranger the keys to the boss's account.",
      "The job is marked as done. Five minutes later the crook signs in, sets up their own phone for the check, and quietly arranges for any replies about payments to be hidden from the real Helen.",
      "Using the boss's real email account, the crook asks the finance team to make an urgent payment to a 'new supplier'. It looks completely genuine, because it really is her account. An hour later the real Helen comes out of a meeting and rings IT: why can't she sign in?"
    ],
    fixed: {
      1: "You tell the caller you'll ring her straight back on the number the company has for her. She protests, but you stay polite and ring it anyway. The real Helen answers, from a meeting downstairs. She hasn't called IT at all.",
      2: "This is no longer a password job: someone just tried to take over the boss's account. You pass it straight to the security team, with the caller's number, the time, and what they knew and asked for.",
      3: "The security team looks at Helen's account. Earlier that day, someone tried to guess her password three times. The phone call was their plan B.",
      4: "Security blocks the crook, Helen changes her own password to be safe, and the rest of the desk is warned in case the same caller tries again pretending to be someone else."
    }
  },
  "shared-missing": {
    intro: "Jo has been given access to the team's shared mailbox, but it never shows up in her Outlook. She really does have permission: it came from being in the team that has access. But Outlook only adds a shared mailbox to your list by itself if your own name was added.",
    steps: [
      "Jo raises a ticket. She started in Sales on Monday and was given the Sales mailbox. Everyone else in the team can see it in Outlook. She can't.",
      "For access, the question isn't just 'is this really Jo?' but 'should Jo have this?'. The Sales manager, who looks after that mailbox, said yes on Monday.",
      "One person, and there's a way round it today: she can open the mailbox in Outlook on the web. So it's low priority, but quick to sort.",
      "You look at who's allowed into the Sales mailbox. Six people are listed by name, plus the Sales team as a group. Jo isn't listed by name, but she is in the group. So she does have access, just through the group.",
      "When Outlook starts, it asks 'which mailboxes should I show this person?'. The answer only includes mailboxes where your own name was added. It doesn't look inside groups, so Jo's Outlook never shows Sales.",
      "Jo restarts Outlook, then her whole laptop for good measure. Still no Sales mailbox, and there never will be, because nothing about how she was given access has changed."
    ],
    fixed: {
      5: "Now Jo's own name has been added to the Sales mailbox. Next time Outlook asks which mailboxes to show, Sales is on the list, and it appears under her own.",
      6: "Jo restarts Outlook and there it is. You close the ticket, and mention that the next new starter in Sales will hit exactly the same snag."
    }
  },
  "send-as": {
    intro: "Ravi can open the Sales mailbox and read everything in it. But being allowed to read the post is different from being allowed to sign letters on the team's behalf. That's a separate permission, and he was never given it, so everything he sends as 'Sales' bounces back.",
    steps: [
      "Ravi emails the desk with the bounced message attached. He can read everything in the Sales mailbox, but anything he sends from it comes straight back.",
      "Sending as 'Sales' means speaking for the company, so the person in charge of the mailbox has to agree, not just Ravi. You check with the Sales manager, who says yes.",
      "Ravi can't do an important part of his job, replying to customers as Sales, and there's no sensible way round it. So it's normal priority, but it matters.",
      "Ravi sends a test while you watch. The email system checks whether he's allowed to send as Sales, finds he isn't, and bounces it with a message that says exactly that.",
      "You check what Ravi's allowed to do. He can read the mailbox, which is why he can see everything. But he's not allowed to send as it. They're two different permissions, and he only ever got the first.",
      "Ravi tries again to answer a customer. It bounces again, exactly the same way. Nothing will change until he's given the missing permission."
    ],
    fixed: {
      5: "Once the permission has had a little while to kick in, Ravi sends from Sales again. This time it goes, and the customer sees an email from 'Sales' with no mention of Ravi.",
      6: "The customer confirms the reply arrived from Sales. You close the ticket, with a note of who approved it."
    }
  },
  "mailbox-full": {
    intro: "Maria has to keep every email for her work, and after eleven years her mailbox is completely full. It's like a filing cabinet stuffed so tight you can't get another sheet in. She doesn't need to throw anything away: she needs the spare cabinet she's already entitled to, which nobody ever unlocked.",
    steps: [
      "Maria rings the desk: Outlook says her mailbox is full, nothing will send, and she has a contract to get to a client by three. She can't just delete old emails, because she's required to keep them.",
      "Nothing about Maria's sign-in or access is changing, so a light check is enough: she's ringing from her own desk phone and her details match.",
      "Only one person, but there's a hard deadline at three, and once her mailbox is completely full, clients' emails to her will start bouncing too. So you get on with it now.",
      "Her mailbox is just over the line where sending stops. A tiny bit more and she won't be able to receive either.",
      "Maria's account comes with a spare filing cabinet for old emails, and there's a rule that's meant to move anything over two years old into it automatically. But the spare cabinet was never unlocked, so for eleven years everything has stayed in the main one.",
      "At five to three Maria tries to send the contract. It just sits in her Outbox. The client is still waiting."
    ],
    fixed: {
      5: "With the spare cabinet unlocked, the rule finally has somewhere to put old mail. Everything over two years old starts moving across, the main mailbox gets lighter, and nothing is thrown away.",
      6: "Maria sends the contract and the client gets it. You show her where her old emails now live, so she knows they're still there, and close the ticket."
    }
  },
  "printer-offline": {
    intro: "The office printer was switched off for twelve days waiting for a part. While it was off, its address was given to someone else, so when it came back it got a new one. All the computers still send their printing to the old address, where nobody's home, so they say the printer is offline.",
    steps: [
      "Chris messages the desk: the big printer was fixed yesterday after two weeks out of action, and now it says 'offline' on everyone's computer. It's switched on, it has paper and its screen looks normal.",
      "Nobody's account or password is changing here, so there's nothing to check about who's asking. Better to spend the time on useful questions: which printer, since when, and what does its screen say?",
      "About thirty people can't print, which is a lot. But there's a working printer one floor up, so nobody is completely stuck. Normal priority, with upstairs as the workaround.",
      "You follow one print job. It leaves someone's computer and reaches the print server fine. The server then posts it to the printer's old address. Nobody's there, the jobs pile up, and it says 'offline'.",
      "Chris reads the address off the printer's own screen, and it's a different one. While the printer was switched off, its old address was handed to a visitor's laptop. The printer is fine; it's just moved house without telling anyone.",
      "By quarter to ten there are 41 jobs waiting and people are trudging upstairs to print. Everything is still being posted to the old address, and the printer doesn't live there any more."
    ],
    fixed: {
      5: "You arrange for the printer to always be given the same address, the one the print server expects, and switch it off and on. It comes back at its old address, and at last something answers when the jobs arrive.",
      6: "The stuck jobs come pouring out (cue a bit of sorting) and new ones print straight away. Chris confirms everyone's printing again, and you close the ticket."
    }
  },
  "new-starter": {
    intro: "It's Sam's first day. She can log in to her laptop, but she has no email or Teams. Those only appear once you have a Microsoft 365 membership card, and here you get the card by being added to one particular list. Sam was never added.",
    steps: [
      "Leah, a manager, rings with her new starter Sam beside her. Sam can log in to her laptop, but Outlook can't find her mailbox and Teams won't load. It's her first day.",
      "Sam's brand new, so there's nothing to check her against yet. Instead you lean on people you already know: you ring Leah back on her own desk number and check Sam is on HR's list of starters for today.",
      "One person can't work, and it's her first day. It's worth fixing quickly, and worth asking how she got through without email, because the next starter will hit the same thing.",
      "Logging in to her laptop works fine. But when Outlook goes looking for her mailbox, there isn't one. Not a broken one: none at all.",
      "Sam has no Microsoft 365 membership card. You get one by being added to a particular list, and everyone else in her team was set up from a template that includes it. Sam was set up from the starter form, which doesn't.",
      "By lunchtime Sam still has no email or Teams and has spent her first morning reading policies on paper. Leah chases. Nothing will appear by itself, because nothing has given Sam a card."
    ],
    fixed: {
      5: "A few minutes after Sam is added to the list, she gets her membership card. That's what the system was waiting for: it builds her mailbox, and Teams and her online storage switch on too.",
      6: "Sam restarts Outlook and Teams, and her inbox appears, complete with HR's welcome email. You close the ticket, and flag that the starter form needs fixing so the next person doesn't hit the same wall."
    }
  }
};
