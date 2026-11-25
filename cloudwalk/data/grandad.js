/* Cloudwalk: Grandad mode. The same story as each step, in everyday language with no jargon.
   steps[i] matches the broken run's step i; fixed[i] is for steps that only happen in the fixed run (index into "fixed").
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
window.GRANDAD = {
  "sync-scope": {
    intro: "Think of Microsoft 365 as a big office building with a reception desk. Reception only lets in people on its list, and that list is copied over from the company's own filing cabinet. Leo's details were filed in a new drawer that nobody told the copier about, so his name never reached reception.",
    steps: [
      "Yesterday the service desk filled in Leo's card and filed it in the company's own filing cabinet. Everything on it is correct. But it went into a new drawer called 'New Starters', which someone added last month to keep things tidy.",
      "Every half an hour, a helper copies new cards from the filing cabinet over to reception's list. It's working perfectly, but it was only ever told to look in two drawers, and 'New Starters' isn't one of them. So Leo's card is never copied.",
      "Leo turns up at reception and gives his name. Reception checks the list and there's nobody called that. They can't even ask for his password, so they tell him he might have typed his name wrong."
    ],
    fixed: {
      0: "The service desk moves Leo's card into one of the drawers the helper does look in. Nothing else about the card changes.",
      1: "Rather than wait for the next half-hourly round, they ask the helper to go now. This time it spots Leo's card and copies it over to reception.",
      2: "Leo tries again. Reception finds him, asks for his password, and helps him set up the app on his phone for the second check. He's in."
    }
  },
  "mfa-newphone": {
    intro: "Signing in takes two checks: your password, then a tap on your phone to say 'yes, it's me'. Aisha's password is fine, but the 'is it you?' message goes to her old phone, which she's traded in. It's like the bank texting a code to a number you no longer have.",
    steps: [
      "Aisha types her email and password, and both are right. That's the first check passed, so the system moves on to the second check, which the company asks for every time.",
      "The system sends the 'is this you?' message to the only phone it knows about: her old one, now sitting in a warehouse somewhere. Her new phone has the app, but it isn't linked to her, so nothing pops up.",
      "Nobody answers the message on the old phone, so it gives up and the sign-in fails. There's nothing Aisha can do from her end: it's like waiting for a text that's going to someone else."
    ],
    fixed: {
      0: "The service desk makes sure it really is Aisha (a video call, with her manager confirming), crosses the old phone off her account, and gives her a one-off temporary pass that works for an hour.",
      1: "Aisha signs in using the temporary pass instead of her password. It's strong enough to count as both checks, so she's taken straight to the page for setting up her new phone.",
      2: "She points her new phone's camera at the code on the screen, and the new phone is linked to her account. The old one is gone for good.",
      3: "Next time she opens Outlook, the 'is this you?' message pops up on her new phone. She taps yes and she's in."
    }
  },
  "ca-travel": {
    intro: "Grace is abroad on business. Her password and phone check both work, but the company has a rule on the door: nobody gets in from outside the UK unless they're on the travel list. Nobody put her on it before she left.",
    steps: [
      "From her hotel room, Grace types her password and taps yes on her phone. Both checks pass: the system knows it's really her.",
      "Before letting her in, the system checks the company's rules. One says: if you're signing in from outside the UK and you're not on the travel list, you can't come in. She's in Portugal and not on the list.",
      "Grace gets a message saying her sign-in worked but she still can't come in. It's confusing because she did everything right. The block is about where she is, not who she is."
    ],
    fixed: {
      0: "Her manager approves the trip, and the service desk adds Grace to the travel list, with a note to take her off when she's home on Friday.",
      2: "This time the rule sees she's on the travel list and waves her through. She's already passed the phone check, so she's in.",
      3: "Outlook and Teams open, and Grace can get ready for tomorrow's meeting. She'll come off the travel list when she gets back."
    }
  },
  "smtp-scanner": {
    intro: "The office printer emails scans by letting itself in through an old side door with a key. Last Thursday, as part of a security tidy-up, that side door was bricked up for the whole company. The printer hasn't changed; the door it relies on has gone.",
    steps: [
      "Mark scans a document. The printer reaches Microsoft's post room and sets up a private line. That part works, so the network isn't the problem.",
      "The printer tries its key in the old side door. It's not that the key is wrong: the door has been bricked up for everyone, so it's turned away.",
      "Mark waits for his scan, but it never arrives. The post room has no record of it, because the printer was sent away before it could hand anything over."
    ],
    fixed: {
      0: "Rather than unbrick a door that was closed on purpose, the admin sets up a different arrangement: the post room will accept deliveries from the office's own van, recognised by its number plate. No key needed.",
      1: "Mark scans again. The printer delivers to the company's post room from the office, the post room recognises where it's coming from, and the scan is accepted.",
      2: "The scan lands in Mark's inbox a few seconds later, and everyone else's scans on the floor work again too."
    }
  },
  "no-licence": {
    intro: "Tom can sign in, so he's on the staff list. But he only gets a mailbox if he has the right membership card, and at this company you get the card by being on a particular list. Nobody put him on it, so there's no card and no mailbox.",
    steps: [
      "Tom signs in with his password and taps yes on his phone. That works, so he definitely exists and his checks are set up. Whatever's wrong happens after he's in.",
      "At this company, you get your Microsoft 365 membership card by being added to one particular list. Tom was set up, but nobody added him to it, so he has no card at all.",
      "Outlook goes looking for Tom's mailbox and finds nothing, because without the card it was never built. Teams grumbles too. Same cause, two symptoms."
    ],
    fixed: {
      0: "The service desk adds Tom to the list. A few minutes later that reaches Microsoft 365, and the membership card is given to him automatically.",
      1: "Now that Tom has a card that includes email, Microsoft builds his mailbox. It usually takes a few minutes.",
      2: "Tom restarts Outlook, it finds his new mailbox and sets itself up. Teams stops grumbling too."
    }
  },
  "dyn-typo": {
    intro: "The Finance team's shared site has a guest list that fills itself: anyone whose job says 'Finance' is on it. Last night someone edited the rule and spelled it 'Finanace'. Nobody's job says that, so overnight the list emptied and the whole team was locked out.",
    steps: [
      "Fatima signs in as normal. Her password and phone check work, and the site knows exactly who she is.",
      "The Finance site only lets in people on its guest list. That list isn't written out by hand; it follows a rule: 'anyone whose department is Finance'. Fatima's department is Finance, but the rule now says 'Finanace', which matches nobody. The list is empty.",
      "With nobody on the guest list, the site has no reason to let Fatima in, so she gets 'access denied'. So does everyone else in Finance.",
      "The record of changes shows the rule was edited yesterday evening. Someone was adding a new department and, in the process, 'Finance' became 'Finanace'."
    ],
    fixed: {
      0: "The admin corrects the spelling, keeping the new department that was being added. Before saving, they check the rule against Fatima to be sure it matches her.",
      1: "Within a few minutes, the guest list fills itself back up with everyone in Finance.",
      2: "Fatima refreshes the page and the Finance site opens. So does everyone else's."
    }
  },
  "intune-phone": {
    intro: "The company only lets phones near its information if the phone has been checked and given the company's seal of approval. Daniel just downloaded Teams onto his new phone himself, so it never got the seal, and the system says no.",
    steps: [
      "Daniel opens Teams on his new iPhone and signs in. His password and phone check both work.",
      "There's a rule: phones only get in if they've been checked and approved by the company (a passcode set, up-to-date software and so on). The system asks the people who keep the list of approved phones. They've never heard of this one.",
      "With no proof the phone is safe, the rule blocks it. Teams tells Daniel he can't get in from this phone. His laptop, which was approved ages ago, carries on working."
    ],
    fixed: {
      0: "Daniel installs the company's app and follows its steps to get the phone checked. It has a passcode and up-to-date software, so it gets the seal of approval.",
      2: "Daniel opens Teams again. This time the phone has its seal of approval, so the rule lets it in.",
      3: "Teams opens on the iPhone with all his chats."
    }
  },
  "shared-automap": {
    intro: "Olivia is allowed into the shared accounts mailbox, because she's in the team that has access. But Outlook only puts a shared mailbox in your list by itself if your own name was added. Being in the team works; it just doesn't happen automatically.",
    steps: [
      "This morning the service desk added Olivia to the team that has access to the accounts mailbox. That's a tidy way to manage it, and it does give her permission.",
      "When Outlook starts, it asks: 'which extra mailboxes should I show this person?' The answer only includes mailboxes where her own name was added. It doesn't look inside teams, so the accounts mailbox isn't mentioned.",
      "As a test, Olivia opens the accounts mailbox in Outlook on the web, and it opens straight away. So she definitely has permission; desktop Outlook just won't add it for her."
    ],
    fixed: {
      0: "The service desk adds Olivia's own name to the accounts mailbox as well as the team's, with the 'show it automatically' option on.",
      1: "Next time Outlook asks which mailboxes to show her, the answer includes the accounts mailbox.",
      2: "Olivia restarts Outlook and the accounts mailbox appears under her own, just like her colleague's."
    }
  }
};
