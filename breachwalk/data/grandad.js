/* Breachwalk: Grandad mode. The same story as each step, in everyday language with no jargon.
   steps[i] matches step i of the attack. Created by Dean Baker. © 2026 Dean Baker. All rights reserved. */
window.GRANDAD = {
  "phish-bec": {
    intro: "A con artist tricks someone in the finance team into signing in on a fake page. They get into her email, then use it to tell a customer 'we've changed banks, please pay into this new account'. The money goes to the crook.",
    steps: [
      "First the crook gets a website address that looks almost exactly like the company's real one, and builds a perfect copy of the Microsoft sign-in page on it. It's like making a fake shop front that looks just like the real bank.",
      "Priya in Finance gets an email saying an invoice has been shared with her. It looks genuine, and because the crook set their fake address up carefully, the post-room's basic checks don't catch it.",
      "Priya clicks and signs in. The fake page is like a crooked middleman: it passes everything she types, even the 'yes it's me' tap on her phone, on to the real Microsoft. Microsoft hands back a 'she's signed in' pass, and the crook keeps a copy.",
      "The crook shows that copied pass and walks straight into Priya's email. They don't need her password or her phone, because the pass says she's already signed in.",
      "The crook sets up a hidden rule: any email about invoices, payments or bank details is whisked away before Priya sees it. It's like someone quietly taking certain letters off your doormat.",
      "Writing from Priya's real email, in a real conversation, the crook tells a customer: 'Our bank details have changed.' Because it genuinely comes from the company, nothing looks wrong, and the customer pays the crook."
    ]
  },
  "mfa-fatigue": {
    intro: "A crook already knows someone's password, but they also need her to tap 'yes, it's me' on her phone. So they send that question to her phone over and over, like a doorbell that won't stop ringing, until she taps yes just to make it stop.",
    steps: [
      "Months ago a nasty program on a home laptop stole J. Patel's password, and it was sold online. The crook tries it and it works, so the system asks for the second check: a tap on her phone.",
      "The crook keeps trying to sign in, and every try sends a 'is this you?' message to her phone. Seventeen of them in seven minutes. It's like the doorbell going non-stop.",
      "Then the phone rings. A friendly voice says: 'IT here, we're fixing a fault. Just approve the next one and they'll stop.' It's the crook.",
      "Tired and reassured, she taps 'yes'. The crook is now signed in as her.",
      "Within two minutes the crook adds their own phone to her account. It's like getting a spare key cut: now they can come and go without her.",
      "They set up a rule that secretly sends a copy of every email she gets to the crook. Like having all your post photocopied before it's delivered."
    ]
  },
  "password-spray": {
    intro: "Instead of trying lots of keys on one door, the crook tries one common key on every door in the street. They only need one person to have used it.",
    steps: [
      "The crook gathers staff names from LinkedIn and the company website, and works out how everyone's email address is made up, like firstname.lastname. That's their list of doors.",
      "Some sign-in pages react slightly differently to a real name and a made-up one. The crook uses that to find which 237 doors are real.",
      "They try one popular password on every account, just once each. One wrong guess isn't enough to set off anyone's alarm.",
      "The crook waits 45 minutes for the 'wrong password' counts to reset, so nobody gets locked out and nobody notices.",
      "Round two, a different common password. It works on an old shared account that was never given the phone check. One weak door is all it takes.",
      "Once inside, the crook downloads the whole mailbox: years of invoices, and an old spreadsheet listing other accounts. It's like emptying a filing cabinet into a van."
    ]
  },
  "sqli": {
    intro: "An online shop takes whatever you type into its search box and passes it straight to its records clerk as an instruction. The crook types instructions of their own, gets the clerk to hand over everyone's passwords, and walks in as the manager.",
    steps: [
      "The crook types one odd character into the shop's web address. The website stumbles and shows an error from its records system. That tells them the shop isn't checking what people type.",
      "They try a question that's always true, then one that's always false. The page changes depending on which, which proves the records clerk is following their instructions.",
      "They tag on their own request: 'list all your filing drawers'. The product page now shows the drawer names: users, orders, payments.",
      "They ask for the 'users' drawer, and the website prints every username and scrambled password. The page comes back six times bigger than normal.",
      "At home, the crook unscrambles the passwords with a powerful computer. Seven in ten crack within the hour, including the manager's.",
      "They sign in to the shop's back office with the manager's real password. Now they control the products, the prices and the orders."
    ]
  },
  "xss": {
    intro: "A forum shows comments exactly as people type them, even hidden instructions. The crook hides a little instruction in a comment, and when the forum's manager reads it, it quietly sends the manager's 'already signed in' pass to the crook.",
    steps: [
      "The crook posts a test comment with a code that should make text bold. It shows up in bold, so the forum is obeying instructions typed by visitors. Bad sign.",
      "They post a comment with a hidden instruction inside. Anyone who reads it will run the instruction without knowing, like a note with invisible ink that does something when you look at it.",
      "The forum's manager opens the thread to check it. Their browser trusts the forum, so it follows the hidden instruction.",
      "The instruction grabs the manager's 'already signed in' pass and posts it off to the crook's website.",
      "The crook pops the pass into their own browser and walks into the forum's back office as the manager. No password needed."
    ]
  },
  "arp-poison": {
    intro: "On an office network, computers ask 'who's the way out to the internet?' and believe whoever answers first. A crook plugged into the same network keeps shouting 'Me!', so everyone's traffic goes through the crook's laptop.",
    steps: [
      "This is normal: the victim's computer sends its internet traffic to the real way out, the office router.",
      "The crook keeps telling the victim 'I'm the router', and telling the router 'I'm the victim'. Nothing on the network checks whether that's true. It's like someone standing in the hall telling everyone 'the post room's moved to my desk'.",
      "Both of them believe it. Each now sends its traffic to the crook's laptop.",
      "The crook passes everything on to the real router, so the internet still works and nobody notices they're in the middle. Like a dodgy postman opening everything before delivering it.",
      "The victim signs in to an old office website that doesn't scramble anything. The username and password go past the crook as plain as a postcard."
    ]
  },
  "dns-poison": {
    intro: "Computers find websites by looking up their name in a phone book. The crook sneaks a fake entry into the company's phone book, so staff type the bank's correct address and still end up at the crook's copy of the bank.",
    steps: [
      "This is normal: a laptop asks the company's phone book for the bank's number and gets the real one. The phone book remembers it for an hour.",
      "From outside, the crook floods the company's phone book with questions about made-up names, each one making it ring the bank to ask.",
      "Every time it rings the bank, the crook shouts lots of fake answers down the line, hoping one gets in before the real one. Eventually one does.",
      "The fake answer is believed and written into the phone book for a whole day. Everyone who looks up the bank now gets the crook's number.",
      "Someone in Finance types the bank's address perfectly, and is sent to the crook's computer instead.",
      "The browser shows a warning, but they click 'continue anyway' and type their banking login into the fake site. The crook now has it."
    ]
  },
  "ransomware": {
    intro: "A criminal gang gets in through a lock that was known to be broken and never fixed. They take the master keys, destroy the spare copies, steal the files, and only then lock everything up and demand money to unlock it.",
    steps: [
      "Two months ago the makers of the company's remote-access box announced a serious fault and released a fix. Nobody installed it, so the gang walks in through the broken lock.",
      "They leave a little remote-control program on a Finance computer. It checks in with them every minute, like a burglar's walkie-talkie, waiting for orders.",
      "Last week an IT administrator signed in on that computer and never signed out. Their details are still in the computer's memory, and the gang copies them. That's the master key.",
      "Using the master key, the gang hops from that one computer to the main servers.",
      "Before making any noise, they destroy the backups, so the company can't just put everything back. Like burning the spare keys before changing the locks.",
      "They copy a huge pile of Finance and HR files to online storage, so they can also threaten to publish them.",
      "Finally, every file on every computer is scrambled and a ransom note appears in each folder: pay up to get it back."
    ]
  },
  "cred-replay": {
    intro: "Windows computers keep a scrambled copy of your password in memory. The crook doesn't need your real password: they steal that scrambled copy and use it like a key to get in everywhere.",
    steps: [
      "The crook already has secret control of a help desk computer, from a phishing email last week. They sit and wait for someone important to sign in.",
      "An IT administrator signs in on that computer to fix a printer, using an account with powers over everything. The computer keeps a scrambled copy of that password in its memory.",
      "The administrator disconnects without signing out. The crook copies the scrambled password out of memory. They never learn the real password, and they don't need to.",
      "The crook shows the scrambled copy to the file server, and the file server accepts it as if it were the real password. It's like a photocopy of a key that somehow still opens the door.",
      "The same trick works on the main server that controls every account in the company. The crook now has the keys to the whole building."
    ]
  },
  "supply-chain": {
    intro: "The crook never attacks you directly. They break into a company that makes software you trust, hide a secret back door in a genuine update, and your server installs it all by itself.",
    steps: [
      "The crook tricks a programmer at the software company and uses their access to reach the machine that builds the software.",
      "They slip a back door into the next update. The software company's own machine stamps it as genuine, like a sealed box that's been tampered with at the factory.",
      "Overnight, your server downloads and installs the update, exactly as it was set up to do.",
      "The back door keeps quiet for 12 days so it doesn't get noticed, then starts sending tiny messages to the crook, hidden inside ordinary internet look-ups.",
      "Through the back door, the crook uses the software's powerful access to make a list of every person and every administrator in the company.",
      "Over a week, the stolen information leaves in tiny pieces, slowly enough to look like normal background chatter. Like smuggling something out one pocketful at a time."
    ]
  },
  "kerberoast": {
    intro: "On Windows networks, any ordinary staff member can ask for a 'ticket' to use certain behind-the-scenes accounts, and part of that ticket is locked with the account's password. The crook takes the tickets home and picks the weak locks at their leisure.",
    steps: [
      "The crook has secret control of an ordinary sales person's computer. No special powers, and for this trick they don't need any.",
      "They ask the network for a list of behind-the-scenes accounts: the ones that run systems in the background, and often have very old passwords.",
      "They ask for a ticket for each one, deliberately picking an old, flimsy kind of lock. Anyone is allowed to ask, so the network hands them over.",
      "At home, the crook picks the locks. One account's password hasn't been changed for seven years and gives way in 40 minutes.",
      "They sign in with that account from the sales laptop. Years ago it was given powers over the database 'just for now', and nobody took them away.",
      "They copy out the HR records: thousands of staff, with home addresses, salaries and bank details."
    ]
  },
  "oauth-consent": {
    intro: "Nothing is stolen at all. The crook gets someone to click 'Accept' on a real Microsoft screen, which gives the crook's app permission to read his email and files. It's like signing a form that hands over a spare key.",
    steps: [
      "The crook makes an app with a harmless-sounding name and a document icon. It asks for permission to read email and files, and to stay connected.",
      "Sam gets an email: 'the signed agreement is ready, view it here'. The link genuinely goes to Microsoft, so the link checkers think it's safe.",
      "Sam signs in on the real Microsoft page, does the phone check, then sees 'This app wants to read your mail and files'. He clicks Accept. The app now has its own key.",
      "From the crook's computer, the app reads through Sam's email: contracts, settlements, everything the legal team is working on.",
      "The help desk notices and changes Sam's password. It makes no difference: the app never used his password, so its key still works.",
      "The app also helps itself to 1,400 files from Sam's online storage and the legal team's shared folders."
    ]
  },
  "quishing": {
    intro: "The dodgy link is hidden inside a QR code, the square barcode you scan with a phone. The company's email checks can't read it, and the person scans it on their own phone, away from all the company's protection.",
    steps: [
      "Dan and 40 colleagues get an email asking them to re-register their phone check by Friday. It has a document with a QR code in it and no links anywhere, so the email checker has nothing to look at.",
      "Dan scans the code with his own phone. It opens the fake website over his phone's data, outside all of the company's protection.",
      "The fake page passes Dan's password and his 'yes it's me' tap straight on to the real Microsoft, and keeps a copy of his 'already signed in' pass.",
      "Using that pass, the crook adds their own phone to Dan's account, so they can get back in whenever they like.",
      "From Dan's real email, the crook sends the same QR email to 600 colleagues. Coming from someone they know, it's far more convincing."
    ]
  },
  "evil-twin": {
    intro: "At a conference, the crook sets up Wi-Fi with exactly the same name as the venue's. Laptops join it without asking, a fake page asks for work passwords, and everything goes through the crook's laptop.",
    steps: [
      "Two rows back, the crook's laptop starts broadcasting Wi-Fi with exactly the venue's name, and a stronger signal. A twin.",
      "The crook sends fake 'you've been disconnected' messages, pretending to be the venue's Wi-Fi. Ellie's laptop believes them and drops off.",
      "Ellie's laptop reconnects straight away, choosing the strongest signal with that name: the crook's.",
      "A 'Welcome to the conference Wi-Fi' page asks Ellie to sign in with her work email and password. She does, and the crook now has them.",
      "Everything Ellie does online now goes through the crook's laptop. Anything not scrambled can be read, or even changed, along the way.",
      "That evening, the crook signs in to the company's old remote-access system with Ellie's password. It only asks for a password, so they're straight in."
    ]
  },
  "insider": {
    intro: "Mark is leaving to work for a competitor. In his last two weeks he quietly takes the customer list and the prices, using access he's genuinely allowed to have. No break-in needed.",
    steps: [
      "Mark hands in his notice. He's joining a competitor in two weeks, and keeps all his access until his last day.",
      "In one lunch break he downloads the whole Sales team's files: every customer's contracts, prices and contacts, not just his own 40 accounts. Like photocopying the whole filing cabinet, not just your own folder.",
      "He packs it all into one password-protected bundle, so the company's checking tools can't see what's inside.",
      "He copies the bundle onto a memory stick he brought from home.",
      "Just to be safe, he also uploads it to his personal online storage, from the office network."
    ]
  }
};
