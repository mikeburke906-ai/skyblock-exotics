
import { uiAuthBindings } from './firebase.js';
uiAuthBindings?.();

const openBtn = document.getElementById('openMenu');
const menu = document.getElementById('mobileMenu');
if (openBtn && menu){
  openBtn.onclick = () => menu.classList.toggle('hidden');
}

const path = location.pathname.split('/').pop();
const anchors = document.querySelectorAll('[data-nav]');
anchors.forEach(a=>{
  const name = a.getAttribute('data-nav');
  const isActive =
    (name==='market' && (path==='' || path==='index.html')) ||
    (name==='coinflip' && path==='games.html') ||
    (name==='plinko' && path==='plinko.html') ||
    (name==='wallet' && path==='wallet.html') ||
    (name==='dms' && path==='dms.html') ||
    (name==='reputation' && path==='reputation.html') ||
    (name==='admin' && path==='admin.html') ||
    (name==='faq' && location.hash==='#faq');
  if (isActive) a.classList.add('text-white','font-semibold');
});
