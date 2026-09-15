/* Ocean Liner Curator — ship guide links into canonical reference indexes */
(function(){
  'use strict';
  const path=window.location.pathname.replace(/\/$/,'');
  if(!/^\/ships\/(?!ships$)[^/]+$/.test(path))return;
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style=document.createElement('style');
  style.textContent='.olc-reference-paths{margin:1rem auto 0;padding:.75rem .85rem;border:1px solid rgba(191,164,106,.22);border-radius:12px;background:rgba(191,164,106,.045);text-align:left}.olc-reference-paths__label{display:block;margin-bottom:.4rem;color:#b6ae9c;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}.olc-reference-paths__links{display:flex;gap:.45rem;flex-wrap:wrap}.olc-reference-paths a{display:inline-flex;align-items:center;padding:.3rem .58rem;border:1px solid rgba(191,164,106,.28);border-radius:999px;color:rgba(209,187,134,.95);font-size:.82rem;text-decoration:none}.olc-reference-paths a:hover{border-color:rgba(191,164,106,.6);color:#e6dfcf}';
  document.head.appendChild(style);
  const sameShip=s=>String(s.path||'').replace(/\.html$/,'')===path||String(s.url||'').replace(/^https?:\/\/[^/]+/,'').replace(/\/$/,'')===path;
  Promise.all([
    fetch('/tools/search/builders-data.json',{cache:'no-store'}).then(r=>r.ok?r.json():null),
    fetch('/data/curatoros-operators.json',{cache:'no-store'}).then(r=>r.ok?r.json():null),
    fetch('/data/curatoros-yards.json',{cache:'no-store'}).then(r=>r.ok?r.json():null)
  ]).then(([builders,operators,yards])=>{
    const builderShip=(builders?.ships||[]).find(sameShip);
    const operatorShip=(operators?.ships||[]).find(sameShip);
    const links=[];
    for(const b of builderShip?.builders||[]){if(b?.id&&b?.name)links.push(`<a href="/shipbuilders#builder-${encodeURIComponent(b.id)}">Builder: ${esc(b.name)}</a>`);}
    for(const o of operatorShip?.operators||[]){if(o?.id&&o?.name)links.push(`<a href="/shipping-lines#line-${encodeURIComponent(o.id)}">Line: ${esc(o.name)}</a>`);}
    if(!operatorShip?.operators?.length&&operatorShip?.operator){const entity=(operators?.operators||[]).find(x=>x.name===operatorShip.operator);if(entity?.id)links.push(`<a href="/shipping-lines#line-${encodeURIComponent(entity.id)}">Line: ${esc(entity.name)}</a>`);}
    for(const yard of yards?.yards||[]){if((yard.ships||[]).some(sameShip)&&yard?.id&&yard?.name)links.push(`<a href="/shipyards#yard-${encodeURIComponent(yard.id)}">Built at: ${esc(yard.name)}</a>`);}
    if(!links.length)return;
    const facts=[...document.querySelectorAll('.fact-row')];
    const last=facts.at(-1);
    const anchor=last?.parentElement||document.querySelector('.facts,.fact-grid,.container');
    if(!anchor||document.querySelector('.olc-reference-paths'))return;
    const box=document.createElement('div');box.className='olc-reference-paths';
    box.innerHTML=`<span class="olc-reference-paths__label">Explore this ship by reference path</span><div class="olc-reference-paths__links">${links.join('')}</div>`;
    anchor.insertAdjacentElement('afterend',box);
  }).catch(()=>{});
})();
