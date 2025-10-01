
import { db, auth } from './firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { sha256 } from "https://cdn.skypack.dev/js-sha256@0.9.0";

const balRef = (uid)=>doc(db,"balances",uid);

async function adjust(uid, delta){
  const snap = await getDoc(balRef(uid));
  const cur = snap.exists()? snap.data(): {coins:0, usd:0};
  const nextCoins = (cur.coins||0) + delta;
  if(nextCoins < 0) throw new Error("Insufficient balance");
  await setDoc(balRef(uid), { ...cur, coins: nextCoins, updatedAt: serverTimestamp() }, { merge:true });
}

async function getHouseSeed(){
  const today = new Date().toISOString().slice(0,10);
  const ref = doc(db,"house","plinko_"+today);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    // If not set, create a placeholder so admin can later set it (or set server-side).
    await setDoc(ref, { seed: "SET_BY_ADMIN", createdAt: serverTimestamp() }, { merge:true });
    return "SET_BY_ADMIN";
  }
  return snap.data().seed || "SET_BY_ADMIN";
}

function plinkoSlots(rows){
  // symmetric multipliers example (house edge comes from rounding)
  // center low, edges high
  const base = {
    12:[0.3,0.5,0.7,0.9,1,1.2,3,1.2,1,0.9,0.7,0.5,0.3],
    14:[0.2,0.4,0.6,0.8,0.9,1,1.2,5,1.2,1,0.9,0.8,0.6,0.4,0.2],
    16:[0.2,0.3,0.5,0.7,0.8,0.9,1,2.5,8,2.5,1,0.9,0.8,0.7,0.5,0.3,0.2],
    18:[0.2,0.3,0.5,0.6,0.7,0.8,0.9,1,2,10,2,1,0.9,0.8,0.7,0.6,0.5,0.3,0.2],
  };
  return base[rows] || base[16];
}

function prngHash(h){
  let i=0;
  return ()=>{
    const out = parseInt(h.slice((i%30), (i%30)+6),16)/0xFFFFFF;
    i+=5;
    return out;
  };
}

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

function drawBoard(rows){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  const cols = rows+1;
  const spacingX = canvas.width/(cols+2);
  const spacingY = canvas.height/(rows+3);
  ctx.fillStyle = "white";
  for(let r=0; r<rows; r++){
    for(let c=0; c<=r; c++){
      const x = (cols/2 - r/2 + c + 1.5)*spacingX;
      const y = (r+1.5)*spacingY;
      ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
    }
  }
}

function simulate(rows, rand){
  let pos = 0; // left steps
  for(let r=0; r<rows; r++){
    const stepRight = rand() > 0.5;
    if(!stepRight) pos+=1;
  }
  // pos determines slot index from left (0..rows)
  return pos;
}

auth.onAuthStateChanged(async (user)=>{
  const houseSeed = await getHouseSeed();
  document.getElementById('houseSeed').textContent = "House seed (today): " + houseSeed;

  const playBtn = document.getElementById('play');
  const rowsSel = document.getElementById('rows');
  const betEl = document.getElementById('bet');
  const nonceEl = document.getElementById('nonce');
  const resultEl = document.getElementById('result');

  function redraw(){ drawBoard(parseInt(rowsSel.value)); }
  redraw(); rowsSel.onchange = redraw;

  playBtn.onclick = async ()=>{
    if(!user) return alert("Sign in");
    const bet = parseInt(betEl.value,10);
    const rows = parseInt(rowsSel.value,10);
    const nonce = nonceEl.value || "0";
    if(!bet || bet<=0) return;
    await adjust(user.uid, -bet); // debit
    const hash = sha256(houseSeed + "|" + user.uid + "|" + nonce + "|" + Date.now());
    const rand = prngHash(hash);
    const slot = simulate(rows, rand);
    const multipliers = plinkoSlots(rows);
    const mult = multipliers[slot] ?? 0;
    const win = Math.floor(bet * mult);
    if(win>0){ await adjust(user.uid, win); }
    resultEl.textContent = "Slot " + slot + " • x" + mult + " • Winnings: " + win.toLocaleString();
  };
});
