
// Firebase via CDN for static hosting (GitHub Pages/Netlify)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
  getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, limit, startAfter,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAa9ueAXgwOICP5VFejAwm1boAk1z9Dnuk",
  authDomain: "skyblock-exotics.firebaseapp.com",
  projectId: "skyblock-exotics",
  storageBucket: "skyblock-exotics.firebasestorage.app",
  messagingSenderId: "509667613542",
  appId: "1:509667613542:web:c1d3a36d4f3f0f313546a7",
  measurementId: "G-L73QB5MPWC"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// re-exports for convenience
export {
  signInWithPopup, onAuthStateChanged, signOut,
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
  getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, limit, startAfter, getCountFromServer
};
