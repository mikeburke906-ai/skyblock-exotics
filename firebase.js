// IMPORTANT: This file expects your existing working Firebase config.
// Replace the config object below with YOURS (Project settings -> Web app).
// If you already have /firebase.js working, keep it and ignore this file.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export function uiAuthBindings() {
  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const userBadge = document.getElementById("userBadge");
  const userName = document.getElementById("userName");
  const userAvatar = document.getElementById("userAvatar");
  if (signInBtn) signInBtn.onclick = () => signInWithPopup(auth, provider);
  if (signOutBtn) signOutBtn.onclick = () => signOut(auth);
  onAuthStateChanged(auth, (user) => {
    if (userBadge) userBadge.classList.toggle("hidden", !user);
    if (signInBtn) signInBtn.classList.toggle("hidden", !!user);
    if (user && userName) userName.textContent = user.displayName || user.email;
    if (user && userAvatar) userAvatar.src = user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName||user.email);
  });
}
