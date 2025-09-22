
import {
  auth, provider, signInWithPopup, onAuthStateChanged, signOut,
  db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
  doc, updateDoc, getDoc, setDoc
} from './firebase.js';

// Header auth UI
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userBadge = document.getElementById('userBadge');
const userNameEl = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
document.getElementById('year').textContent = new Date().getFullYear();

signInBtn?.addEventListener('click', async () => { try { await signInWithPopup(auth, provider); } catch (e) { alert(e.message); } });
signOutBtn?.addEventListener('click', async () => { try { await signOut(auth); } catch (e) { alert(e.message); } });
onAuthStateChanged(auth, (user) => {
  if (user) {
    signInBtn?.classList.add('hidden');
    userBadge?.classList.remove('hidden');
    userBadge?.classList.add('flex');
    userNameEl.textContent = user.displayName || user.email || 'User';
    userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email);
    ensureProfile(user.uid);
    loadStats(user.uid);
  } else {
    signInBtn?.classList.remove('hidden');
    userBadge?.classList.add('hidden');
    userBadge?.classList.remove('flex');
    document.getElementById('myStats').textContent = 'Sign in to see your wins and losses.';
  }
});

// Utils
const enc = new TextEncoder();
async function sha256Hex(str){ const buf = await crypto.subtle.digest('SHA-256', enc.encode(str)); return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
function randHex(bytes=32){ const a=new Uint8Array(bytes); crypto.getRandomValues(a); return [...a].map(b=>b.toString(16).padStart(2,'0')).join(''); }
function el(tag, cls=''){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }
function storeSeed(gameId, role, seed){ localStorage.setItem(`seed:${gameId}:${role}`, seed); }
function loadSeed(gameId, role){ return localStorage.getItem(`seed:${gameId}:${role}`) || ''; }
function clearSeed(gameId){ Object.keys(localStorage).filter(k=>k.startsWith(`seed:${gameId}:`)).forEach(k=>localStorage.removeItem(k)); }
function computeOutcome(seedA, seedB){ // even = creator, odd = joiner (simple parity on first & last bytes)
  const a = parseInt(seedA.slice(0,2),16);
  const b = parseInt(seedB.slice(-2),16);
  return (a + b) % 2;
}

// Firestore refs
const gamesCol = collection(db, 'games');
const profilesCol = collection(db, 'userProfiles');

// Create flip
document.getElementById('createFlip').addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser || (await signInWithPopup(auth, provider)).user;
  const fd = new FormData(e.target);
  const stakeType = fd.get('stakeType');
  const stakeAmount = Number(fd.get('stakeAmount') || 0);
  if (!stakeAmount || stakeAmount <= 0){ alert('Enter a valid stake amount'); return; }

  // creator seed + commit
  const seed = randHex(32);
  const commit = await sha256Hex(seed);
  const data = {
    createdAt: serverTimestamp(),
    status: 'open',
    stakeType, stakeAmount,
    creatorUid: user.uid,
    creatorName: user.displayName || user.email || 'Creator',
    creatorCommit: commit,
    joinerUid: null, joinerName: '', joinerCommit: null,
    creatorReveal: null, joinerReveal: null,
    creatorWinner: null, joinerWinner: null,
    winnerUid: null
  };
  try {
    const ref = await addDoc(gamesCol, data);
    storeSeed(ref.id, 'creator', seed);
    alert('Flip created! Wait for someone to join.');
  } catch (e) { alert(e.message); }
});

// List games live
const gamesList = document.getElementById('gamesList');
const refreshBtn = document.getElementById('refresh');
let unsub = null;
function startListener(){
  if (unsub) unsub();
  const qGames = query(gamesCol, orderBy('createdAt','desc'));
  unsub = onSnapshot(qGames, (snap)=>{
    const items = snap.docs.map(d=>({ id: d.id, ...d.data() }));
    render(items);
  });
}
refreshBtn?.addEventListener('click', startListener);
startListener();

async function ensureProfile(uid){
  const ref = doc(db, 'userProfiles', uid);
  const s = await getDoc(ref);
  if (!s.exists()) await setDoc(ref, { wins:0, losses:0, updatedAt: serverTimestamp(), lastGameId: null });
}
async function loadStats(uid){
  const ref = doc(db, 'userProfiles', uid);
  const s = await getDoc(ref);
  const el = document.getElementById('myStats');
  if (!s.exists()){ el.textContent='No stats yet.'; return; }
  const d = s.data();
  el.innerHTML = `<div>Wins: <span class="font-semibold">${d.wins||0}</span> • Losses: <span class="font-semibold">${d.losses||0}</span></div>`;
}
async function updateMyStats(gameId, winnerUid){
  const user = auth.currentUser; if (!user) return;
  const ref = doc(db, 'userProfiles', user.uid);
  const s = await getDoc(ref);
  let wins=0, losses=0;
  if (s.exists()){ wins = s.data().wins||0; losses = s.data().losses||0; }
  if (winnerUid === user.uid) wins += 1; else losses += 1;
  await setDoc(ref, { wins, losses, updatedAt: serverTimestamp(), lastGameId: gameId }, { merge:true });
  await loadStats(user.uid);
}

function render(items){
  gamesList.innerHTML = '';
  const user = auth.currentUser;
  for (const g of items){
    const card = el('div','rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2');
    const title = el('div','flex items-center justify-between');
    title.innerHTML = `<div class="font-semibold">Flip • ${g.stakeType==='usd' ? '$'+Intl.NumberFormat().format(g.stakeAmount) : Intl.NumberFormat().format(g.stakeAmount)+' coins'}</div>
      <div class="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">${g.status}</div>`;
    card.appendChild(title);

    const meta = el('div','text-sm text-slate-300');
    meta.textContent = `Creator: ${g.creatorName}${g.joinerName ? ' • Joiner: ' + g.joinerName : ''}`;
    card.appendChild(meta);

    const actions = el('div','flex flex-wrap gap-2 pt-1');
    card.appendChild(actions);

    if (!user){
      const btn = el('button','px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm');
      btn.textContent='Sign in to play'; btn.onclick = ()=> signInWithPopup(auth, provider);
      actions.appendChild(btn);
    } else {
      const isCreator = g.creatorUid === user.uid;
      const isJoiner = g.joinerUid === user.uid;

      if (g.status === 'open'){
        if (!isCreator){
          const joinBtn = el('button','px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm');
          joinBtn.textContent = 'Join Flip';
          joinBtn.onclick = async () => {
            if (g.joinerUid){ alert('Already joined'); return; }
            const seed = randHex(32); const commit = await sha256Hex(seed);
            try {
              await updateDoc(doc(db,'games',g.id), {
                joinerUid: user.uid,
                joinerName: user.displayName || user.email || 'Joiner',
                joinerCommit: commit,
                status: 'committed'
              });
              storeSeed(g.id, 'joiner', seed);
            } catch (e){ alert(e.message); }
          };
          actions.appendChild(joinBtn);
        } else {
          const wait = el('div','text-xs text-slate-400'); wait.textContent='Waiting for a joiner…'; actions.appendChild(wait);
        }
      }

      if (g.status === 'committed'){
        if (isCreator && !g.creatorReveal){
          const revealC = el('button','px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm');
          revealC.textContent='Reveal (Creator)';
          revealC.onclick = async ()=>{
            const seed = loadSeed(g.id,'creator'); if (!seed){ alert('Missing seed on this device. Reveal where you created.'); return; }
            if (await sha256Hex(seed) !== g.creatorCommit){ alert('Seed mismatch'); return; }
            try{ await updateDoc(doc(db,'games',g.id), { creatorReveal: seed }); } catch(e){ alert(e.message); }
          };
          actions.appendChild(revealC);
        }
        if (isJoiner && !g.joinerReveal){
          const revealJ = el('button','px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm');
          revealJ.textContent='Reveal (Joiner)';
          revealJ.onclick = async ()=>{
            const seed = loadSeed(g.id,'joiner'); if (!seed){ alert('Missing seed on this device.'); return; }
            if (await sha256Hex(seed) !== g.joinerCommit){ alert('Seed mismatch'); return; }
            try{ await updateDoc(doc(db,'games',g.id), { joinerReveal: seed }); } catch(e){ alert(e.message); }
          };
          actions.appendChild(revealJ);
        }
      }

      const bothRevealed = !!g.creatorReveal && !!g.joinerReveal;
      if (g.status !== 'finished' && bothRevealed){
        const outcome = computeOutcome(g.creatorReveal, g.joinerReveal);
        const winnerUid = outcome===0 ? g.creatorUid : g.joinerUid;
        const winnerLabel = outcome===0 ? 'Creator' : 'Joiner';
        const res = el('div','text-sm'); res.innerHTML = `<span class="font-semibold">Result:</span> ${winnerLabel} should win`;
        card.appendChild(res);

        if (isCreator && !g.creatorWinner){
          const confirm = el('button','px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm');
          confirm.textContent = 'Confirm result (Creator)';
          confirm.onclick = async()=>{
            try{ await updateDoc(doc(db,'games',g.id), { creatorWinner: winnerUid, status: 'revealed' }); } catch(e){ alert(e.message); }
          };
          actions.appendChild(confirm);
        }
        if (isJoiner && !g.joinerWinner){
          const confirm = el('button','px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm');
          confirm.textContent = 'Confirm result (Joiner)';
          confirm.onclick = async()=>{
            try{ await updateDoc(doc(db,'games',g.id), { joinerWinner: winnerUid, status: 'revealed' }); } catch(e){ alert(e.message); }
          };
          actions.appendChild(confirm);
        }

        if ((g.creatorWinner && g.joinerWinner) && g.creatorWinner === g.joinerWinner && !g.winnerUid){
          const finalize = el('button','px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm');
          finalize.textContent='Finalize game';
          finalize.onclick = async()=>{
            try{
              await updateDoc(doc(db,'games',g.id), { winnerUid, status: 'finished' });
              await updateMyStats(g.id, winnerUid);
              clearSeed(g.id);
            } catch(e){ alert(e.message); }
          };
          actions.appendChild(finalize);
        }
      }

      if (g.status === 'finished'){
        const who = g.winnerUid === g.creatorUid ? 'Creator' : 'Joiner';
        const badge = el('span','text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10');
        badge.textContent = 'Winner: ' + who;
        card.appendChild(badge);

        if (user && (user.uid===g.creatorUid || user.uid===g.joinerUid)){
          const sync = el('button','px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm');
          sync.textContent='Sync my stats';
          sync.onclick = async()=>{ try{ await updateMyStats(g.id, g.winnerUid); alert('Synced'); } catch(e){ alert(e.message); } };
          card.appendChild(sync);
        }
      }
    }
    gamesList.appendChild(card);
  }
}
