// Browser test of the built prototype (needs: npm i -D playwright && npx playwright install chromium)
const { chromium } = require('playwright'); const path = require('path');
(async()=>{const b=await chromium.launch();
for (const w of [1280,390]) {
const ctx=await b.newContext({viewport:{width:w,height:900},acceptDownloads:true}); const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts/.test(m.text()))errs.push(m.text())});
p.on('dialog',d=>d.accept());
await p.goto('file://'+path.join(__dirname,'../index.html')); await p.waitForTimeout(300);
const t0=await p.evaluate(()=>document.body.innerText); const navOk=!/Try an example/.test(t0);
const noHints=!/Optional\./.test(t0)&&!(await p.$('#reset'));
await p.fill('#nm','Maria'); await p.click('#go'); await p.waitForTimeout(150);
const noTags=!(await p.$('[data-sec]'));
// Back on the first section goes to the welcome screen; Continue returns to the assessment
await p.click('#back'); await p.waitForTimeout(100); const backOk=!!(await p.$('#cont')); await p.click('#cont'); await p.waitForTimeout(100);
// try to move on without answering: Next must not leave the first section, and the notice must show
await p.click('#next'); await p.waitForTimeout(150);
const warn=await p.evaluate(()=>document.querySelector('.notice')?.innerText||'');
const blocked=(await p.evaluate(()=>document.querySelector('.intro .kicker')?.textContent||'')).includes('1 of') && !!(await p.$('fieldset.missing'));
// now answer everything
for (let s=0;s<12;s++){
  for (let r=0;r<40;r++){ const n=await p.evaluate(()=>{let n=0;const names=new Set([...document.querySelectorAll('input[type=radio]')].map(i=>i.name));
    for(const nm of names){const g=[...document.querySelectorAll(`input[name="${nm}"]`)]; if(!g.some(i=>i.checked)){const i=g.find(i=>!i.disabled); if(i){i.click();return 1}}}
    const G={};for(const c of document.querySelectorAll('input[type=checkbox]'))(G[c.name]??=[]).push(c);
    for(const g of Object.values(G)) if(!g.some(c=>c.checked)){const c=g.find(c=>!c.disabled); if(c){c.click();return 1}}
    for(const s of document.querySelectorAll('select')) if(!s.value){s.selectedIndex=1; s.dispatchEvent(new Event('change',{bubbles:true}));return 1} return 0}); await p.waitForTimeout(30); if(!n) break; }
  await p.waitForTimeout(80);
  const nx=await p.$('#next'); if(nx){await nx.click();await p.waitForTimeout(80);continue}
  await p.click('#finish'); await p.waitForTimeout(250);
  if (await p.$('#dl')) break;
}
const txt=await p.evaluate(()=>document.body.innerText); if(!(await p.$('#dl'))){console.log('NOT ON PLAN:',txt.slice(0,600));process.exit(1)}
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#dl')]); const f=await dl.path(); const J=JSON.parse(require('fs').readFileSync(f,'utf8'));

// reload: should resume
await p.reload(); await p.waitForTimeout(200); const resumed=(await p.evaluate(()=>document.body.innerText)).includes("Maria's Good Span");
// the logo starts again (after confirming)
await p.click('#home'); await p.waitForTimeout(150); const logoOk=!!(await p.$('#go'));
console.log(w,'nav clean',navOk,'| no hints or start-again button',noHints,'| no section tags',noTags,'| back to welcome',backOk,'| logo starts again',logoOk,'| Next blocked until answered',blocked,'| early finish warning:',warn.slice(0,70),'| plan title ok',/Maria's Good Span\./.test(txt),'| ref',J.member.id,'| practices',J.plan.months[0].practices.length,'| has pilot in export',JSON.stringify(J).includes('pilot'),'| plan kept after reload',resumed,'| sw',await p.evaluate(()=>document.documentElement.scrollWidth),'| errs',errs);
await ctx.close(); }
await b.close();})();
