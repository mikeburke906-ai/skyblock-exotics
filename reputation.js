
import {
  auth, provider, signInWithPopup, onAuthStateChanged, signOut,
  db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp
} from './firebase.js';

// Simple sign-in on demand
async function requireAuth(){
  const user = auth.currentUser || (await signInWithPopup(auth, provider)).user;
  return user;
}

// Reports
const reportForm = document.getElementById('reportForm');
const reportsList = document.getElementById('reportsList');
reportForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const user = await requireAuth();
  const fd = new FormData(reportForm);
  const data = {
    reported: fd.get('reported').toString().trim(),
    reason: fd.get('reason').toString().trim(),
    evidenceUrl: (fd.get('evidenceUrl')||'').toString().trim(),
    createdAt: serverTimestamp(),
    authorUid: user.uid,
    authorName: user.displayName || user.email || 'User'
  };
  if (!data.reported || !data.reason){ alert('Fill reported + reason'); return; }
  try { await addDoc(collection(db,'reports'), data); reportForm.reset(); alert('Report submitted'); } catch(e){ alert(e.message); }
});
onSnapshot(query(collection(db,'reports'), orderBy('createdAt','desc')), (snap)=>{
  reportsList.innerHTML='';
  snap.docs.forEach(d=>{
    const x = d.data();
    const card = document.createElement('div'); card.className='rounded-xl border border-white/10 bg-white/5 p-4';
    card.innerHTML = `<div class="font-semibold">Reported: ${escapeHtml(x.reported)}</div>
      <div class="text-sm text-slate-300">Reason: ${escapeHtml(x.reason)}</div>
      ${x.evidenceUrl?`<a class="text-xs text-indigo-300" href="${x.evidenceUrl}" target="_blank">Evidence</a>`:''}
      <div class="text-xs text-slate-400 mt-1">By ${escapeHtml(x.authorName||'User')}</div>`;
    reportsList.appendChild(card);
  });
});

// Reviews
const reviewForm = document.getElementById('reviewForm');
const reviewsList = document.getElementById('reviewsList');
reviewForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const user = await requireAuth();
  const fd = new FormData(reviewForm);
  const data = {
    target: fd.get('target').toString().trim(),
    rating: Number(fd.get('rating')||'5'),
    text: fd.get('text').toString().trim(),
    createdAt: serverTimestamp(),
    authorUid: user.uid,
    authorName: user.displayName || user.email || 'User'
  };
  if (!data.target || !data.text) { alert('Fill all fields'); return; }
  try { await addDoc(collection(db,'reviews'), data); reviewForm.reset(); alert('Review posted'); } catch(e){ alert(e.message); }
});
onSnapshot(query(collection(db,'reviews'), orderBy('createdAt','desc')), (snap)=>{
  reviewsList.innerHTML='';
  snap.docs.forEach(d=>{
    const x = d.data();
    const card = document.createElement('div'); card.className='rounded-xl border border-white/10 bg-white/5 p-4';
    const stars = '★'.repeat(Math.max(1,Math.min(5, x.rating||5))) + '☆'.repeat(5-Math.max(1,Math.min(5, x.rating||5)));
    card.innerHTML = `<div class="font-semibold">${stars} for ${escapeHtml(x.target)}</div>
      <div class="text-sm text-slate-300">${escapeHtml(x.text)}</div>
      <div class="text-xs text-slate-400 mt-1">By ${escapeHtml(x.authorName||'User')}</div>`;
    reviewsList.appendChild(card);
  });
});

// Payouts
const payoutForm = document.getElementById('payoutForm');
const payoutsList = document.getElementById('payoutsList');
payoutForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const user = await requireAuth();
  const fd = new FormData(payoutForm);
  const data = {
    from: fd.get('from').toString().trim(),
    to: fd.get('to').toString().trim(),
    type: fd.get('type').toString(),
    amount: Number(fd.get('amount')||0),
    proofUrl: (fd.get('proofUrl')||'').toString().trim(),
    createdAt: serverTimestamp(),
    authorUid: user.uid,
    authorName: user.displayName || user.email || 'User'
  };
  if (!data.from || !data.to || !data.amount){ alert('Fill from/to/amount'); return; }
  try { await addDoc(collection(db,'payouts'), data); payoutForm.reset(); alert('Payout posted'); } catch(e){ alert(e.message); }
});
onSnapshot(query(collection(db,'payouts'), orderBy('createdAt','desc')), (snap)=>{
  payoutsList.innerHTML='';
  snap.docs.forEach(d=>{
    const x = d.data();
    const card = document.createElement('div'); card.className='rounded-xl border border-white/10 bg-white/5 p-4';
    card.innerHTML = `<div class="font-semibold">Payout: ${x.type==='usd'?'$'+format(x.amount):format(x.amount)+' coins'}</div>
      <div class="text-sm text-slate-300">From ${escapeHtml(x.from)} → To ${escapeHtml(x.to)}</div>
      ${x.proofUrl?`<a class="text-xs text-indigo-300" href="${x.proofUrl}" target="_blank">Proof</a>`:''}
      <div class="text-xs text-slate-400 mt-1">By ${escapeHtml(x.authorName||'User')}</div>`;
    payoutsList.appendChild(card);
  });
});

function escapeHtml(s=''){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function format(n){ try { return new Intl.NumberFormat().format(n||0);} catch { return String(n);} }
