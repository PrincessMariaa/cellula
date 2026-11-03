import assert from 'node:assert/strict';
import {profiles,createRun,replaceBath,stepRun,poolStats,balanceError} from './dist/isotope-model.js';
assert.equal(new Set(Object.values(profiles).map(p=>p.element)).size,9);
for(const [id,p] of Object.entries(profiles)){
 assert(p.pair[0]>p.pair[1]);
 for(const rate of [0,.25,1,4])for(const oxygen of [0,.2,.3]){
  const s=createRun(id);s.rates={transport:rate,processing:rate,storage:rate};
  const bath=s.heavy[0]+s.light[0];replaceBath(s,.99);assert(Math.abs(s.heavy[0]+s.light[0]-bath)<1e-10);
  for(let i=0;i<5000;i++){stepRun(s,.04,oxygen);if(i===1000)replaceBath(s,p.fraction);assert([...s.heavy,...s.light].every(v=>v>=0&&Number.isFinite(v)));}
  assert(balanceError(s)<1e-8,id+' atom conservation');
  const q=poolStats(s,1,1),diluted=poolStats(s,1,2);assert.equal(diluted.total,q.total/2);assert.equal(diluted.fraction,q.fraction);
 }
 const a=createRun(id),b=createRun(id);replaceBath(a,.99);replaceBath(b,.99);for(let i=0;i<1000;i++){stepRun(a,.04);stepRun(b,.04);}assert.deepEqual(a.heavy,b.heavy);
 const fine=createRun(id);replaceBath(fine,.99);for(let i=0;i<2000;i++)stepRun(fine,.02);assert(Math.max(...a.heavy.map((v,i)=>Math.abs(v-fine.heavy[i])))<.03,id+' convergence');
 const zero=createRun(id);replaceBath(zero,0);assert.equal(zero.heavy[0],0);replaceBath(zero,1);assert.equal(zero.light[0],0);assert.equal(poolStats(zero,0).ratio,null);
}
const norm=createRun('glucose'),hyp=createRun('glucose');replaceBath(norm,.99);replaceBath(hyp,.99);for(let i=0;i<2500;i++){stepRun(norm,.04,.2);stepRun(hyp,.04,0);}assert(norm.heavy[4]>hyp.heavy[4]);assert.equal(hyp.heavy[4],10*profiles.glucose.fraction);
const ch=createRun('cholesterol');replaceBath(ch,.99);const start=poolStats(ch,2).fraction;for(let i=0;i<5000;i++)stepRun(ch,.04);assert(poolStats(ch,2).fraction>start);
console.log('PASS: all 9 elements / 10 carriers; 120 rate and oxygen combinations; separate isotope conservation, positivity, pulse/chase, dilution, identical references, convergence, oxygen and membrane-label response.');
