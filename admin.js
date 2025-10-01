
import { db, auth } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, collection, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const isAdmin = async (uid)=>{
  const snap = await getDoc(doc(db,"admins", uid));
  return snap.exists() && !!snap.data().enabled;
};

async function adjust(uid, type, delta, reason){
  const balRef = doc(db,"balances", uid);
  const snap = await getDoc(balRef);
  const cur = snap.exists()? snap.data(): {coins:0, usd:0};
  const next = {...cur}; next[type]=(cur[type]||0)+delta;
  if(next[type]<0) throw new Error("Would go negative");
  await setDoc(balRef, {...next, updatedAt: serverTimestamp()}, {merge:true});
  await setDoc(doc(collection(db,"transfers")), { uid, type, amount: delta, reason, createdAt: serverTimestamp(), by: auth.currentUser.uid });
}

auth.onAuthStateChanged(async (user)=>{
  if(!user){ alert("Sign in as admin"); return; }
  if(!(await isAdmin(user.uid))){ alert("Not an admin"); return; }

  document.getElementById('balForm').onsubmit = async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const uid = fd.get('uid');
    const type = fd.get('type');
    const amount = parseInt(fd.get('amount'),10);
    const reason = fd.get('reason')||"";
    try{
      await adjust(uid, type, amount, reason);
      alert("Updated");
      e.target.reset();
    }catch(err){ alert(err.message); }
  };

  const q = query(collection(db,"depositRequests"), where("status","==","open"), orderBy("createdAt","asc"));
  onSnapshot(q,(qs)=>{
    const list=document.getElementById('reqList'); list.innerHTML="";
    qs.forEach(d=>{
      const r=d.data();
      const el=document.createElement('div');
      el.className="rounded-lg border border-white/10 p-3 text-sm";
      el.innerHTML = \`
        <div class='font-medium'>\${r.user} • \${r.uid}</div>
        <div class='text-slate-300'>\${r.amount} — \${r.reason||'-'}</div>
        <div class='text-xs text-slate-400'>\${r.createdAt?.toDate?.().toLocaleString?.()||''}</div>
        <div class='mt-2 flex gap-2'>
          <button class='approve px-3 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600'>Approve</button>
          <button class='reject px-3 py-1 rounded bg-rose-600/80 hover:bg-rose-600'>Reject</button>
        </div>
      \`;
      el.querySelector('.approve').onclick = async ()=>{
        const [amt, currency] = (r.amount+'').toLowerCase().split(/\s+/);
        const delta = parseInt(amt,10) * (currency?.includes('usd')?1:1); // same units, collection stores currency name in reason
        await adjust(r.uid, currency?.includes('usd')?'usd':'coins', delta, "deposit approved: "+(r.reason||''));
        await updateDoc(doc(db,"depositRequests", d.id), { status: "approved", updatedAt: serverTimestamp() });
      };
      el.querySelector('.reject').onclick = async ()=>{
        await updateDoc(doc(db,"depositRequests", d.id), { status: "rejected", updatedAt: serverTimestamp() });
      };
      list.appendChild(el);
    });
  });
});
