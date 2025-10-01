
import { db, auth } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const grid = document.getElementById('grid');
async function load(){
  const qs = await getDocs(query(collection(db,'listings'), orderBy('createdAt','desc')));
  let count=0;
  grid.innerHTML="";
  qs.forEach(d=>{
    count++;
    const x=d.data();
    const el=document.createElement('div');
    el.className="rounded-2xl border border-white/10 bg-white/5 p-4";
    el.innerHTML = \`
      <div class="text-sm text-slate-400">\${x.rarity} • \${x.type}</div>
      <div class="font-semibold mt-1">\${x.title}</div>
      <div class="text-sm mt-2">\${x.priceType==='usd' ? '$'+x.price.toLocaleString() : x.price.toLocaleString()+' coins'}</div>
      <div class="text-xs text-slate-400 mt-1">Seller: \${x.sellerName||'-'}</div>
    \`;
    grid.appendChild(el);
  });
  document.getElementById('count').textContent = count + " results";
}
load();

document.getElementById('createForm').onsubmit = async (e)=>{
  e.preventDefault();
  const user = auth.currentUser; if(!user) return alert("Sign in to post");
  const fd = new FormData(e.target);
  const docu = Object.fromEntries(fd.entries());
  docu.price = Number(docu.price);
  docu.sellerUid = user.uid; docu.sellerName = user.displayName||user.email; docu.createdAt = serverTimestamp();
  await addDoc(collection(db, 'listings'), docu);
  e.target.reset(); load();
};
document.getElementById('resetBtn').onclick = ()=> document.getElementById('createForm').reset();
