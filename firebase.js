import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, 
  where, getDocs, doc, deleteDoc } 
  from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Your Firebase config (copy directly from Project Settings → Web app config)
const firebaseConfig = {
  apiKey: "AIzaSyAa9ueAXgwOICP5VFejAwm1boAk1z9Dnuk",
  authDomain: "skyblock-exotics.firebaseapp.com",
  projectId: "skyblock-exotics",
  storageBucket: "skyblock-exotics.appspot.com",
  messagingSenderId: "509667613542",
  appId: "1:509667613542:web:c1d3a36d4f3f0f313546a7",
  measurementId: "G-L73QB5MPWC" // optional
};

// Init
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Exports for app.js
export {
  signInWithPopup, onAuthStateChanged, signOut,
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
  where, getDocs, doc, deleteDoc
};
