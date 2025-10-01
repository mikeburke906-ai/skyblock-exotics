
# Skyblock Exotics — Wallet + Games + DMs (Upgrade)

**What's new**
- On-site **Wallet** (coins & USD) with admin **credit/debit** + full **Transfers** audit
- Coinflip uses wallet **escrow** and **auto-payout**
- **Plinko** with daily house seed for deterministic outcomes
- **Direct Messages** (DMs) between users
- **Admin** dashboard for deposits and requests
- Modernized UI & navigation

## Fast Setup
1) Keep your **working `firebase.js`** (Google sign-in already enabled). If needed, copy your config into `firebase.js` here.
2) In Firestore, create a document `admins/{YOUR_UID}` with `{ enabled: true }`.
3) Open **Rules** and paste `firestore.rules` from this folder → Publish.
4) Deploy or run locally: `python3 -m http.server 5173` → http://localhost:5173

## Collections
- `balances/{uid}`: { coins, usd, updatedAt }
- `transfers`: { uid, type: 'coins'|'usd', amount, reason, by, createdAt }
- `depositRequests`: { uid, user, amount:'100 usd', reason, status:'open|approved|rejected', createdAt, updatedAt }
- `games`: wallet-escrowed coinflips (creator/joiner, commits, seeds, winnerUid, status)
- `house/plinko_YYYY-MM-DD`: { seed: 'your_random_string' } set by admin daily
- `threads`, `messages`: DMs
- `listings`, `reports`, `reviews`, `payouts`: same as before

## Notes
- Admin **must** exist via console/security to credit balances.
- Plinko multipliers are example values; tweak in `plinko.js`.
- This is client-only; don't store secrets in the code.
