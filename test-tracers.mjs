import assert from 'node:assert/strict';
import {elements,newTracer,pulse,chase,stepTracer} from './dist/tracers.js';
const total=t=>t.pools.reduce((a,b)=>a+b,0)+t.removed;
assert.equal(Object.keys(elements).length,9);
for(const symbol of Object.keys(elements))for(const transport of [0,.25,1,4])for(const retention of [0,1,4]){
 const t=newTracer(symbol);t.transport=transport;t.retention=retention;pulse(t);
 for(let i=0;i<15000;i++){stepTracer(t,.04);if(i===1000)chase(t);if(i===5000)pulse(t);assert(t.pools.every(v=>v>=-1e-12&&Number.isFinite(v)));}
 assert(Math.abs(total(t)-200)<1e-8);
 if(transport===0)assert.equal(t.pools[1]+t.pools[2]+t.pools[3],0);
 if(retention===0)assert.equal(t.pools[2],0);
}
const a=newTracer('C');pulse(a);for(let i=0;i<2500;i++)stepTracer(a,.04);const b=newTracer('C');pulse(b);for(let i=0;i<5000;i++)stepTracer(b,.02);assert(Math.max(...a.pools.map((v,i)=>Math.abs(v-b.pools[i])))<.03);
const c=newTracer('Fe');pulse(c);for(let i=0;i<100;i++)stepTracer(c,.04);const before=total(c);chase(c);assert.equal(c.pools[0],0);assert(Math.abs(before-total(c))<1e-10);assert(c.removed>0);
console.log('Tracer tests passed: 108 parameter combinations, conservation, positivity, blocked transport, wash accounting, timestep convergence.');
