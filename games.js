
import { db, auth } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, addDoc, collection, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { sha256 } from "https://cdn.skypack.dev/js-sha256@0.9.0";

const balRef = (uid)=>doc(db,"balances",uid);

async function adjustBalance(uid, type, delta){
  const ref = balRef(uid);
  const snap = await getDoc(ref);
  const cur = snap.exists()? snap.data(): {coins:0, usd:0};
  const next = {...cur};
  next[type] = (cur[type]||0) + delta;
  if(next[type] < 0) throw new Error("Insufficient balance");
  await setDoc(ref, {...next, updatedAt: serverTimestamp()}, {merge:true});
}

function seed(){ return crypto.getRandomValues(new Uint32Array(4)).join("-"); }

auth.onAuthStateChanged(async (user)=>{
  const listEl = document.getElementById('gamesList');

  function render(gameId, g){
    const me = user?.uid;
    const youAre = me===g.creatorUid? 'creator' : me===g.joinerUid? 'joiner' : 'viewer';
    const stake = \`\${g.stakeAmount} \${g.stakeType}\`;
    const el = document.createElement('div');
    el.className = "rounded-xl border border-white/10 bg-white/5 p-4 grid md:grid-cols-6 gap-2 text-sm";
    el.innerHTML = \`
      <div class='md:col-span-2'>
        <div class="text-xs text-slate-400">Game</div>
        <div class="font-semibold">\${gameId.slice(-6)} • \${stake}</div>
      </div>
      <div>
        <div class="text-xs text-slate-400">Creator</div>
        <div>\${g.creatorName||g.creatorUid}</div>
      </div>
      <div>
        <div class="text-xs text-slate-400">Joiner</div>
        <div>\${g.joinerName||'-'}</div>
      </div>
      <div>
        <div class="text-xs text-slate-400">Status</div>
        <div class="font-medium">\${g.status}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="join px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Join</button>
        <button class="reveal px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">Reveal</button>
        <button class="finalize px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600">Finalize</button>
      </div>
    \`;
    el.querySelector('.join').onclick = async ()=>{
      if(!user) return alert("Sign in");
      if(g.joinerUid) return alert("Already joined");
      await adjustBalance(user.uid, g.stakeType, -g.stakeAmount);
      const jSeed = seed();
      await updateDoc(doc(db,"games",gameId), {
        joinerUid: user.uid, joinerName: user.displayName||user.email,
        joinerCommit: sha256(jSeed), joinerSeed: jSeed, status: "joined"
      });
    };
    el.querySelector('.reveal').onclick = async ()=>{
      if(!user) return alert("Sign in");
      const key = (youAre==='creator')? 'creatorSeed' : (youAre==='joiner')? 'joinerSeed' : null;
      if(!key) return alert("Only players can reveal");
      const snap = await getDoc(doc(db,"games",gameId));
      const gg = snap.data();
      if(!gg[key]) return alert("No seed set for you (create/join again)");
      await updateDoc(doc(db,"games",gameId), { [key+"Revealed"]: true });
    };
    el.querySelector('.finalize').onclick = async ()=>{
      const snap = await getDoc(doc(db,"games",gameId));
      const gg = snap.data();
      if(!(gg.creatorSeed && gg.joinerSeed && gg.creatorSeedRevealed && gg.joinerSeedRevealed)) return alert("Both revealed first");
      const res = parseInt(sha256(gg.creatorSeed + gg.joinerSeed).slice(-2),16) % 2;
      const winnerUid = res===0? gg.creatorUid : gg.joinerUid;
      const loserUid = res===0? gg.joinerUid : gg.creatorUid;
      if(!winnerUid || !loserUid) return alert("Need two players");
      // pay winner
      await adjustBalance(winnerUid, gg.stakeType, gg.stakeAmount*2);
      await updateDoc(doc(db,"games",gameId), { winnerUid, status: "finished", finishedAt: serverTimestamp() });
      alert("Winner paid.");
    };
    return el;
  }

  const q = query(collection(db,"games"), orderBy("createdAt","desc"));
  onSnapshot(q, (qs)=>{
    listEl.innerHTML = "";
    qs.forEach(d=> listEl.appendChild(render(d.id, d.data())) );
  });

  document.getElementById('createFlip').onsubmit = async (e)=>{
    e.preventDefault();
    if(!user) return alert("Sign in");
    const fd = new FormData(e.target);
    const stakeType = fd.get('stakeType');
    const stakeAmount = parseInt(fd.get('stakeAmount'));
    // pull from balance (escrow creator stake)
    await adjustBalance(user.uid, stakeType, -stakeAmount);
    const cSeed = seed();
    const game = {
      stakeType, stakeAmount,
      creatorUid: user.uid, creatorName: user.displayName||user.email,
      creatorCommit: sha256(cSeed), creatorSeed: cSeed,
      status: "open", createdAt: serverTimestamp()
    };
    const ref = await addDoc(collection(db,"games"), game);
    alert("Game created: " + ref.id.slice(-6));
    e.target.reset();
  };

  document.getElementById('refresh').onclick = ()=>{}; // realtime
});
