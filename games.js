import { auth, provider, signInWithPopup, onAuthStateChanged, db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from './firebase.js';

const gamesList = document.getElementById('gamesList');
const createBtn = document.getElementById('createFlip');

createBtn.addEventListener('click', async () => {
  const user = auth.currentUser || await signInWithPopup(auth, provider);
  const flip = { createdAt: serverTimestamp(), creator: user.user.displayName || 'Anon', result: null };
  await addDoc(collection(db, 'coinflips'), flip);
});

const q = query(collection(db, 'coinflips'), orderBy('createdAt','desc'));
onSnapshot(q, (snap) => {
  gamesList.innerHTML = '';
  snap.docs.forEach(doc => {
    const data = doc.data();
    const div = document.createElement('div');
    div.className = 'p-3 rounded-xl bg-white/10';
    div.textContent = `${data.creator} started a flip`;
    gamesList.appendChild(div);
  });
});
