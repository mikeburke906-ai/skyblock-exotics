
// Keep using your working Google Sign-In + Firestore config.
// If you want, paste it here. Otherwise, the pages just import this and expect Auth/DB to exist.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
export const app = initializeApp({/* paste your config here if needed */});
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export function uiAuthBindings(){
  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const userBadge = document.getElementById("userBadge");
  const userName = document.getElementById("userName");
  const userAvatar = document.getElementById("userAvatar");
  if (signInBtn) signInBtn.onclick = () => signInWithPopup(auth, provider);
  if (signOutBtn) signOutBtn.onclick = () => signOut(auth);
  onAuthStateChanged(auth, (user)=>{
    if (userBadge) userBadge.classList.toggle("hidden", !user);
    if (signInBtn) signInBtn.classList.toggle("hidden", !!user);
    if (user){
      if (userName) userName.textContent = user.displayName || user.email;
      if (userAvatar) userAvatar.src = user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName||user.email);
    }
  });
}
