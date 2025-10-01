
import { db, auth } from './firebase.js';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const balRef = (uid) => doc(db, "balances", uid);
const transfersCol = (uid) => query(collection(db, "transfers"), where("uid","==",uid), orderBy("createdAt","desc"));

async function ensureBalance(uid){
  const snap = await getDoc(balRef(uid));
  if(!snap.exists()){
    await setDoc(balRef(uid), { coins: 0, usd: 0, updatedAt: serverTimestamp() });
  }
}

auth.onAuthStateChanged(async (user)=>{
  if(!user){ return; }
  await ensureBalance(user.uid);

  onSnapshot(balRef(user.uid), (snap)=>{
    const d = snap.data();
    document.getElementById('balanceCoins').textContent = (d?.coins ?? 0).toLocaleString();
    document.getElementById('balanceUsd').textContent = '$' + (d?.usd ?? 0).toLocaleString();
  });

  onSnapshot(transfersCol(user.uid), (qs)=>{
    const list = document.getElementById('transfersList');
    list.innerHTML = "";
    qs.forEach(docu=>{
      const t = docu.data();
      const el = document.createElement('div');
      el.className = "rounded-xl border border-white/10 bg-white/5 p-4 grid md:grid-cols-4 gap-2 text-sm";
      el.innerHTML = \`
        <div><div class="text-xs text-slate-400">Type</div><div class="font-medium">\${t.type}</div></div>
        <div><div class="text-xs text-slate-400">Amount</div><div class="font-medium">\${t.amount}</div></div>
        <div><div class="text-xs text-slate-400">Reason</div><div class="font-medium">\${t.reason||'-'}</div></div>
        <div><div class="text-xs text-slate-400">At</div><div class="font-medium">\${t.createdAt?.toDate?.().toLocaleString?.() || '-'}</div></div>
      \`;
      list.appendChild(el);
    })
  });

  document.getElementById('reqDeposit').onclick = async ()=>{
    const amount = prompt("Enter amount + currency, e.g. '10000000 coins' or '50 usd'");
    if(!amount) return;
    const reason = prompt("Optional note (e.g., 'sent via PayPal to ...')") || "";
    await setDoc(doc(collection(db, "depositRequests")), {
      uid: user.uid, user: user.displayName||user.email, amount, reason, createdAt: serverTimestamp(), status: "open",
    });
    alert("Deposit request posted. DM the admin with proof. You'll be credited after verification.");
  };

  document.getElementById('refresh').onclick = ()=>{}; // no-op, realtime
});
