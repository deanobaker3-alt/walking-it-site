/* Packetwalk: Grandad mode. The same story as each step, in everyday language with no jargon.
   steps[i] matches the broken run's step i; fixed[i] is for steps that only happen in the fixed run (index into "fixed").
   Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
window.GRANDAD = {
  "dhcp-full": {
    intro: "Before a computer can send or receive anything, it needs a 'house number' on the network. The office hands these out from a book, and the book for Priya's floor is full. So nobody gives her laptop a number, and it ends up making one up that doesn't work for anything useful.",
    steps: [
      "Priya plugs her new laptop into the socket on her desk. The little lights come on, so the cable and the socket are both working. So far, so good.",
      "The laptop hasn't got a house number yet, so it stands in the hallway and shouts: 'Can anyone give me an address, please?' The shout gets passed along to the office that hands the numbers out.",
      "The office opens its book and finds every number on Priya's floor already taken. Instead of saying 'sorry, we're full', it says nothing at all. The laptop is left standing there in silence.",
      "Fed up with waiting, the laptop writes a made-up number on its own front door. It's like addressing your letters from '999 Nowhere Street': nothing will ever reach the outside world, so there's no internet. It keeps asking for a proper number every few minutes."
    ],
    fixed: {
      2: "This time there's room in the book. The office hands over a proper house number, along with directions to the main road and the phone book, and says how long she can keep it.",
      3: "The laptop says 'Yes please, I'll have that one', and the office writes it down. Before moving in, the laptop knocks once to make sure nobody else already lives there.",
      4: "With a proper address, Priya's laptop can send and receive like everyone else. Websites, email and Teams all work."
    }
  },
  "dns-wrong": {
    intro: "To visit a website, a computer first looks its name up in a phone book to get its number. Sam's laptop has been told to always use the phone book at his house, and that phone book isn't in the office. So the internet is there, but his laptop can't look anything up.",
    steps: [
      "Sam joins the office Wi-Fi and is handed everything he needs, including the office phone book. But last week someone told his laptop 'always use the phone book at home', so it ignores the office one.",
      "Sam types in a website. Before it can go there, the laptop has to look up the website's number, so it rings the phone book at Sam's house. That phone isn't here, so nobody picks up.",
      "The laptop tries a few more times, then gives up. Without the number the browser has nowhere to go, and Teams can't find its way either.",
      "The engineer skips the phone book and tries the website's number directly. It answers straight away. So the roads are fine; it's only the phone book that's wrong."
    ],
    fixed: {
      0: "With the 'use the phone book at home' note taken off, the laptop uses the office phone book it's handed when it connects.",
      1: "The laptop asks the office phone book for the website. It doesn't know every name in the world itself, so it asks around on Sam's behalf and comes back with the number.",
      2: "Now the browser knows where to go, so the page opens. Teams finds its way in the same way."
    }
  },
  "wrong-gateway": {
    intro: "The new reception PC was set up from an old sticky note. It can talk to the printer right next to it, but for anything further away it has to go out through the network's front door, and the note gives the address of a door that was bricked up last summer.",
    steps: [
      "The PC's settings were copied from a sticky note on the old monitor. Most of it's right, but the note says the way out of the building is a door that has since been bricked up.",
      "Printing works because the printer is in the same room. It's like passing a note to the person at the next desk: you don't need to go through any door.",
      "For anything else (email, the internet, the shared drive) the PC has to go out through the front door. It goes to where the note says the door is and calls out. There's just a wall.",
      "Everything meant for the outside world is stuck in the room. Windows says the place can't be reached, and it's the PC itself saying so. It can't even reach the phone book, because that's outside the room too."
    ],
    fixed: {
      0: "The PC is switched back to getting its settings automatically, so it's told where the front door is today, not where it was a year ago.",
      2: "It goes to the real front door and calls out. This time someone answers straight away.",
      3: "Now everything for the outside world goes through the right door and gets sent on its way. The phone book, the shared drive and the internet all work."
    }
  },
  "ip-conflict": {
    intro: "Two devices have ended up with the same house number. Ola's laptop had it first, then the new printer was given it too because it 'looked free'. Now the post keeps going to the wrong house.",
    steps: [
      "This morning Ola's laptop was given its house number, as normal. Everything works.",
      "The new printer arrives and someone gives it the very same number, because nobody seemed to be using it. The printer moves in and announces to the street: 'This house is mine!'",
      "Ola's laptop hears someone else claiming its house and pops up a warning: two of us have the same address.",
      "The postman now believes that house belongs to the printer. Replies meant for Ola get delivered to the printer, which bins them. It flips back and forth, so things work one minute and drop the next."
    ],
    fixed: {
      1: "This time the printer gets its own house number, one that's never handed out to anyone else, and it's written down in the list. Nobody else claims it.",
      2: "One house, one resident. Post for Ola reaches Ola, and print jobs reach the printer."
    }
  },
  "wrong-mask": {
    intro: "The Leeds PC has been told the wrong size for its neighbourhood. It thinks every address starting with 10 is on its own street, so instead of posting letters to head office, it walks up and down its own road looking for them.",
    steps: [
      "The engineer typed in the PC's address and Windows filled in the rest by itself. One number was wrong, so the PC now thinks its 'street' covers the whole company, not just the Leeds office.",
      "Websites work fine. They're obviously not on its street, so the PC sends them out through the router as normal. That's what makes this one so confusing.",
      "To open the S: drive, the PC looks the file server up in the phone book and gets the right address straight away. So the phone book isn't the problem.",
      "The file server's address starts with 10, so the PC thinks it lives on the same street. It walks along the Leeds road knocking on doors asking for it. But the file server is at head office, miles away, so nobody answers.",
      "With nobody answering, the PC gives up and says the server can't be reached. Its settings give the game away: it really does think the whole company is its street."
    ],
    fixed: {
      0: "The neighbourhood size is put right, to match every other PC in Leeds. Now only the Leeds addresses count as 'my street'.",
      3: "The file server is no longer 'next door', so the PC hands the letter to the router, which sends it down the secure tunnel to head office.",
      4: "The S: drive opens and the drawings load."
    }
  },
  "blocked-port": {
    intro: "The new stock app is up and running on the server, but the server has a bouncer on the door with a guest list. Nobody put the app on the list, so every visitor is quietly turned away.",
    steps: [
      "First check: is the server even there? The engineer gives it a shout and it shouts back. So the building's open and the road to it is fine.",
      "The browser knocks on the app's door. The bouncer (the server's firewall) checks the guest list, doesn't see this door on it, and sends the visitor away without saying a word.",
      "The laptop knocks again, waits a bit longer, knocks again, then gives up. The browser says the site took too long. A quick test confirms it: the building answers, the door doesn't.",
      "On the server itself, the app is running and waiting for visitors. The bouncer's notebook shows Jo's visits arriving and being turned away. So the app is fine; it's the bouncer."
    ],
    fixed: {
      1: "This time the app's door is on the bouncer's list for staff. The browser knocks, the app says 'come in', and the browser says 'thanks'. That three-way hello opens the conversation.",
      2: "With the door open, the browser sets up a private line and the app's login page appears."
    }
  },
  "vpn-dns": {
    intro: "Ellie's working from home. Her private tunnel into the office works, but when she asks where the office file server is, she asks her home router, which has never heard of it. The new VPN settings forgot to give her the office phone book.",
    steps: [
      "Ellie connects the VPN: a private tunnel from her house into the office. She's let in and given an office address, but nobody hands her the office phone book.",
      "The engineer tries the file server's number directly, through the tunnel, and it answers. So the tunnel itself works fine.",
      "To open the shared drive the laptop needs the file server's number, so it asks the only phone book it knows: her home router. The router has never heard of the office's private names and says 'no such name'.",
      "With no number for the file server, Windows can't open the shared drive. Teams and email still work, because their names are in every phone book, including her home router's."
    ],
    fixed: {
      0: "With the corrected settings, the tunnel comes with the office phone book this time.",
      2: "Now the laptop asks the office phone book, through the tunnel, and it knows the file server straight away.",
      3: "With the number found, the shared drive opens through the tunnel, just like it does in the office."
    }
  },
  "wrong-clock": {
    intro: "Dan's laptop came back from repair thinking it's 2020. Every secure website shows an ID card that says 'valid from 2026', so his laptop thinks they're all fakes from the future and refuses to trust any of them.",
    steps: [
      "Dan types in a website and the laptop finds it in the phone book straight away. The network is fine.",
      "The browser rings the website and the website picks up. Nothing is blocking the line.",
      "Before talking privately, the website shows its ID card: 'I really am this website', signed by someone everyone trusts, and valid between two dates.",
      "The laptop checks those dates against its own calendar, which says 2020. As far as it's concerned the ID card won't be valid for another six years, so it smells a rat and refuses. It does the same for every secure site."
    ],
    fixed: {
      3: "With the right date on the laptop, today falls between the ID card's two dates. It checks out, and the private line is set up.",
      4: "The page loads with the little padlock, and every other secure site works again too."
    }
  }
};
