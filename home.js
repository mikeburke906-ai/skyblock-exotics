
import { db, auth } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const dlg = document.getElementById('newListing');
document.getElementById('newListingBtn').onclick = ()=> dlg.showModal();

const grid = document.getElementById('grid');
async function load(){
  const qs = await getDocs(query(collection(db,'listings'), orderBy('createdAt','desc')));
  let count=0; grid.innerHTML="";
  qs.forEach(d=>{
    count++;
    const x=d.data();
    const card=document.createElement('article');
    card.className="card card-hover rounded-2xl p-4";
    card.innerHTML=`
      <div class="flex items-center justify-between">
        <span class="badge">${x.rarity||''}</span>
        <span class="text-xs text-slate-400">${x.type||''}</span>
      </div>
      ${x.imageUrl? `<img src="${x.imageUrl}" class="mt-3 h-36 w-full object-cover rounded-xl border border-white/10">` : ''}
      <h3 class="mt-3 font-semibold">${x.title||''}</h3>
      <div class="text-sm mt-1">${x.priceType==='usd' ? '$'+x.price?.toLocaleString() : (x.price?.toLocaleString()||'')+' coins'}</div>
      <div class="text-xs text-slate-400 mt-1">Seller: ${x.sellerName||'-'}</div>
    `;
    grid.appendChild(card);
  });
  document.getElementById('count').textContent = count + " results";
  document.getElementById('emptyState').classList.toggle('hidden', count>0);
}
load();

document.getElementById('saveListing').onclick = async (e)=>{
  e.preventDefault();
  const user = auth.currentUser; if(!user) return alert("Sign in to post");
  const form = document.querySelector('#newListing form');
  const fd = new FormData(form);
  const docu = Object.fromEntries(fd.entries());
  docu.price = Number(docu.price);
  docu.sellerUid = user.uid; docu.sellerName = user.displayName||user.email; docu.createdAt = serverTimestamp();
  await addDoc(collection(db,'listings'), docu);
  form.reset(); document.getElementById('newListing').close(); load();
};
