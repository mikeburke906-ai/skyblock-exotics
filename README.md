
# Skyblock Exotics — Pro Pack (Market + Games + Reputation)

Modern, Tailwind UI with Firebase backend. Features:
- Marketplace with listings (coins or USD), filters, sorting.
- Provably-fair coinflip (commit-reveal), realtime games, win/loss stats.
- Reputation hub: player reports, reviews (1–5), confirmed payout proofs.
- Site stats cards on homepage (counts of listings/games/payouts/reviews).

## 1) Firebase Setup (Free)
1. Go to https://console.firebase.google.com → Add project.
2. Build → Authentication → Get started → Sign-in method → Enable **Google**.
3. Build → **Firestore Database** → Create database (Production mode) → Location (US ok).
4. Open **Rules** tab → paste `firestore.rules` from this repo → **Publish**.
5. Project settings → **Web app** (</>) → Register app → copy the **Config** and paste into `firebase.js` (replace placeholders).

**Authorized domains** (Auth → Settings):
- `localhost`, `127.0.0.1`, `exoticmarket.site`, `www.exoticmarket.site`, and optionally `<username>.github.io`.

## 2) Local Test
Run a small server so ES modules work:
```bash
python3 -m http.server 5173
```
Open http://localhost:5173
- Try **Create Listing** on the home page.
- Go to **Games** → Create a coinflip → Open a second browser or incognito to Join, Reveal, Confirm, Finalize.
- Check **Reputation** → submit a report, review, and payout proof.

## 3) Free Hosting
### GitHub Pages
- Create a repo and upload files.
- Settings → Pages → Build from branch (`main`), root (`/`).
- Custom domain: `www.exoticmarket.site` → enforce HTTPS.
- Set DNS on Bluehost:
  - CNAME `www` → `<username>.github.io`
  - A records for `@` → 185.199.108.153 / .109 / .110 / .111

### Netlify (optional)
- Drag folder to Netlify, add `exoticmarket.site`, follow DNS prompts.

## Collections Overview
- `listings`: title, type, rarity, priceType, price, description, imageUrl, contact, paymentLink, sellerUid, sellerName, createdAt.
- `games`: creator/joiner UIDs & names, stakeType/amount, creatorCommit/joinerCommit, creatorReveal/joinerReveal, creatorWinner/joinerWinner, winnerUid, status, createdAt.
- `userProfiles/{uid}`: wins, losses, updatedAt, lastGameId.
- `reports`: reported, reason, evidenceUrl, authorUid, authorName, createdAt.
- `reviews`: target, rating (1–5), text, authorUid, authorName, createdAt.
- `payouts`: from, to, type (coins/usd), amount, proofUrl, authorUid, authorName, createdAt.

## Notes
- This app **does not handle payments**. Use in-game trades or trusted escrow.
- Rules can’t validate hash commitments — verifications happen on client & socially.
- If you want admin moderation (delete reports, etc.), add a server or Cloud Functions with **custom claims**, then extend rules.
