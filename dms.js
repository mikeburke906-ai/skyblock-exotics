
import { db, auth } from './firebase.js';
import { collection, addDoc, doc, setDoc, getDoc, onSnapshot, serverTimestamp, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let activeThreadId = null;

function participantsKey(a,b){ return [a,b].sort().join("_"); }

auth.onAuthStateChanged((user)=>{
  if(!user) return;

  const myThreadsQ = query(collection(db,"threads"), where("participants","array-contains", user.uid), orderBy("updatedAt","desc"));
  onSnapshot(myThreadsQ, (qs)=>{
    const list = document.getElementById('threads'); list.innerHTML="";
    qs.forEach(d=>{
      const t=d.data();
      const el=document.createElement('button');
      el.className="text-left px-3 py-2 rounded-lg hover:bg-white/10";
      el.innerHTML = \`<div class='text-sm font-medium'>\${t.title||'Chat'}</div><div class='text-xs text-slate-400'>\${(t.lastText||'').slice(0,40)}</div>\`;
      el.onclick=()=>openThread(d.id, t);
      list.appendChild(el);
    });
  });

  document.getElementById('newThread').onclick = async ()=>{
    const other = prompt("Enter recipient UID or email (for now enter UID you want to DM):");
    if(!other) return;
    const t = { participants:[user.uid, other], key: participantsKey(user.uid, other), updatedAt: serverTimestamp(), createdAt: serverTimestamp(), title:"Direct Message"};
    const ref = await addDoc(collection(db,"threads"), t);
    openThread(ref.id, t);
  };

  document.getElementById('sendForm').onsubmit = async (e)=>{
    e.preventDefault();
    if(!activeThreadId) return;
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if(!text) return;
    const m = { threadId: activeThreadId, from: user.uid, text, createdAt: serverTimestamp() };
    await addDoc(collection(db,"messages"), m);
    await setDoc(doc(db,"threads", activeThreadId), { lastText: text, updatedAt: serverTimestamp() }, { merge:true });
    input.value = "";
  };
});

function openThread(id, t){
  activeThreadId=id;
  document.getElementById('activeHeader').textContent = "Chat • " + (t.title||id.slice(-6));
  const msgs = document.getElementById('messages'); msgs.innerHTML="";
  const q = query(collection(db,"messages"), where("threadId","==", id), orderBy("createdAt","asc"));
  onSnapshot(q,(qs)=>{
    msgs.innerHTML="";
    qs.forEach(d=>{
      const m=d.data();
      const el=document.createElement('div');
      el.className="px-3 py-2 rounded-xl border border-white/10 " + (m.from===auth.currentUser?.uid ? "self-end bg-indigo-500/20":"bg-white/5");
      el.textContent = m.text;
      msgs.appendChild(el);
    });
    msgs.scrollTop = msgs.scrollHeight;
  });
}
