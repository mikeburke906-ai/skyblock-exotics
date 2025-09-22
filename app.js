
import {
  auth, provider, signInWithPopup, onAuthStateChanged, signOut,
  db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
  where, getDocs, doc, deleteDoc, getCountFromServer
} from './firebase.js';

// Header auth UI
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const userBadge = document.getElementById('userBadge');
const userNameEl = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

signInBtn?.addEventListener('click', async () => { try { await signInWithPopup(auth, provider); } catch (e) { alert(e.message); } });
signOutBtn?.addEventListener('click', async () => { try { await signOut(auth); } catch (e) { alert(e.message); } });

onAuthStateChanged(auth, (user) => {
  if (user) {
    signInBtn?.classList.add('hidden');
    userBadge?.classList.remove('hidden');
    userBadge?.classList.add('flex');
    userNameEl.textContent = user.displayName || user.email || 'User';
    userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email);
  } else {
    signInBtn?.classList.remove('hidden');
    userBadge?.classList.add('hidden');
    userBadge?.classList.remove('flex');
  }
});

// Market elements
const countEl = document.getElementById('count');
const grid = document.getElementById('grid');
const emptyState = document.getElementById('emptyState');
const qInput = document.getElementById('q');
const rarityFilter = document.getElementById('rarityFilter');
const priceTypeFilter = document.getElementById('priceTypeFilter');
const sortBy = document.getElementById('sortBy');
const createForm = document.getElementById('createForm');
const resetBtn = document.getElementById('resetBtn');
const priceType = document.getElementById('priceType');
const priceLabel = document.getElementById('priceLabel');

priceType?.addEventListener('change', () => {
  if (priceLabel) priceLabel.textContent = priceType.value === 'usd' ? 'Price (USD)' : 'Price (Coins)';
});

createForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) { alert('Sign in to post'); return; }
  const fd = new FormData(createForm);
  const data = {
    title: (fd.get('title')||'').toString().trim(),
    type: (fd.get('type')||'').toString().trim(),
    rarity: fd.get('rarity'),
    priceType: fd.get('priceType'),
    price: Number(fd.get('price')),
    description: (fd.get('description')||'').toString().trim(),
    imageUrl: (fd.get('imageUrl')||'').toString().trim(),
    contact: (fd.get('contact')||'').toString().trim(),
    paymentLink: (fd.get('paymentLink')||'').toString().trim(),
    createdAt: serverTimestamp(),
    sellerUid: user.uid,
    sellerName: user.displayName || user.email || 'Seller',
    sellerPhoto: user.photoURL || ''
  };
  if (!data.title || !data.type || !data.contact || !Number.isFinite(data.price) || data.price < 0) { alert('Fill all fields correctly'); return; }
  try {
    await addDoc(collection(db, 'listings'), data);
    createForm.reset(); if (priceLabel) priceLabel.textContent = 'Price (Coins)';
    alert('Listing posted!');
  } catch (e) { alert(e.message); }
});

resetBtn?.addEventListener('click', () => createForm.reset());

// Live listings
let lastItems = [];
const qListings = query(collection(db, 'listings'), orderBy('createdAt','desc'));
onSnapshot(qListings, (snap) => {
  lastItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render(lastItems);
});

function render(items) {
  const term = (qInput?.value || '').toLowerCase();
  const rarity = rarityFilter?.value || '';
  const pt = priceTypeFilter?.value || '';
  let filtered = items.filter(x => {
    const matchTerm = !term || (x.title + ' ' + x.type + ' ' + (x.description||'')).toLowerCase().includes(term);
    const matchRarity = !rarity || x.rarity === rarity;
    const matchPT = !pt || x.priceType === pt;
    return matchTerm && matchRarity && matchPT;
  });
  if (sortBy?.value === 'low') filtered.sort((a,b)=> (a.price||0)-(b.price||0));
  else if (sortBy?.value === 'high') filtered.sort((a,b)=> (b.price||0)-(a.price||0));
  else filtered.sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));

  if (countEl) countEl.textContent = filtered.length + ' listing' + (filtered.length===1?'':'s');
  if (!grid) return;
  grid.innerHTML='';
  if (!filtered.length) { emptyState?.classList.remove('hidden'); return; }
  emptyState?.classList.add('hidden');

  const user = auth.currentUser;
  for (const x of filtered) {
    const card = document.createElement('div');
    card.className='rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition';
    const img = document.createElement('img');
    img.className='h-40 w-full object-cover bg-slate-800';
    img.alt=x.title;
    img.src = x.imageUrl || ('https://picsum.photos/seed/'+encodeURIComponent(x.type+x.rarity)+'/600/300');
    card.appendChild(img);
    const body=document.createElement('div'); body.className='p-4 space-y-2';
    body.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-semibold">${escapeHtml(x.title)}</h3>
        <span class="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">${escapeHtml(x.rarity)}</span>
      </div>
      <div class="text-sm text-slate-300">${escapeHtml(x.type)}</div>
      <div class="text-sm"><span class="font-semibold">${x.priceType==='usd'?'$'+formatNumber(x.price):formatNumber(x.price)+' coins'}</span></div>
      <p class="text-sm text-slate-300 line-clamp-3">${escapeHtml(x.description||'')}</p>
      <div class="text-xs text-slate-400">Seller: ${escapeHtml(x.sellerName||'Seller')}</div>
      <div class="flex flex-wrap gap-2 pt-2">
        <a class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm" href="${x.paymentLink || '#'}" target="_blank" rel="noopener">${x.priceType==='usd' && x.paymentLink?'Pay':'Contact'}</a>
        <a class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm" href="${formatContact(x.contact)}" target="_blank" rel="noopener">Reach out</a>
        ${user && user.uid===x.sellerUid ? `<button data-id="${x.id}" class="del px-3 py-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-sm">Delete</button>`:''}
      </div>`;
    card.appendChild(body);
    grid.appendChild(card);
  }
  grid.querySelectorAll('button.del').forEach(btn=>{
    btn.addEventListener('click', async()=>{
      if(!confirm('Delete this listing?')) return;
      try{ await deleteDoc(doc(db,'listings',btn.dataset.id)); } catch(e){ alert(e.message); }
    });
  });
}

function escapeHtml(s=''){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function formatNumber(n){ try{return new Intl.NumberFormat().format(n||0);}catch{return String(n);}}
function formatContact(c){ if(/^https?:\/\//i.test(c)) return c; if(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) return 'mailto:'+c; return 'https://discord.com/channels/@me'; }

// Stats counters
(async () => {
  try {
    const [c1,c2,c3,c4] = await Promise.all([
      getCountFromServer(collection(db,'listings')),
      getCountFromServer(query(collection(db,'games'), where('status','==','finished'))),
      getCountFromServer(collection(db,'payouts')),
      getCountFromServer(collection(db,'reviews'))
    ]);
    const s = (id, n)=>{const el=document.getElementById(id); if(el) el.textContent = (c=>c.data().count)(n);}
    s('statListings', c1);
    s('statGames', c2);
    s('statPayouts', c3);
    s('statReviews', c4);
  } catch (e) { /* ignore */ }
})();
