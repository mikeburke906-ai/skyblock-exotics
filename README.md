# Skyblock Exotics Market (Free, Static + Firebase)

A clean, modern marketplace to list and browse exotic Skyblock armor. Uses **GitHub Pages/Netlify** (free) + **Firebase (Spark plan, free)** for data.

## Features
- Google sign-in (Firebase Auth)
- Create, view, and delete your own listings
- Price in **coins** or **USD**
- Filters (rarity, price type), search, and sort
- Optional payment link + contact (Discord or email)
- Modern responsive UI (Tailwind)

---

## 1) Firebase Setup (free)
1. Go to https://console.firebase.google.com → Add project (no Analytics needed).
2. Build → Authentication → Sign-in method → Enable **Google**.
3. Build → Firestore Database → Create database (test mode) → then open **Rules** and paste `firestore.rules` from this repo.
4. Project settings → Web app → Register app → copy the config and paste into `firebase.js` replacing placeholders.
5. Deploy Firestore rules (optional via CLI) or paste in console rules editor.

## 2) Local Test
- Just open `index.html` with a simple local server (recommended for modules). For example:
  - Python: `python3 -m http.server 5173`
  - Node: `npx serve .`
- Visit http://localhost:5173 and sign in to test.

## 3) Free Hosting
### GitHub Pages
1. Create a repo (e.g., `skyblock-exotics`), push files.
2. Settings → Pages → Build from branch (`main`), root folder.
3. Your site becomes `https://<username>.github.io/skyblock-exotics`.

### Point your domain (Bluehost)
- On Bluehost DNS:
  - **CNAME** for `www` → `<username>.github.io`.
  - Optional: **A** for apex `@` → GitHub Pages IPs (185.199.108.153 / .109 / .110 / .111).
- In GitHub repo → Settings → Pages → Custom domain → `exoticmarket.site` (or `www.exoticmarket.site`) → Enforce HTTPS.

### Netlify (drag-and-drop alternative)
- Connect repo or drag folder at https://app.netlify.com/.
- Netlify domain settings → add `exoticmarket.site`, follow DNS prompts.

## 4) Customize
- Branding: replace favicon, colors, and header title in `index.html`.
- Add categories or more fields in the form + Firestore documents.
- If you want image uploads, enable Firebase Storage and add an upload widget.

## Notes
- This app **does not** process payments. Use external links at your own risk, consider escrow.
- To allow edits, update Firestore rules and add UI for editing.
