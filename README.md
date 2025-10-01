
# Skyblock Exotics — Full Revamp

- Global header + mobile menu on **every page**
- Modern cards, dialogs, and consistent layout
- Wallet + Coinflip (escrow) + Plinko (house seed) + DMs + Admin
- Reputation tools and Market flow

## Keep your working `firebase.js`
If your Google Sign-In is already working, keep using your file. These pages just import `firebase.js`.

## Admin bootstrap
Create `admins/{YOUR_UID}` with `{ enabled: true }` and publish the included `firestore.rules`.
