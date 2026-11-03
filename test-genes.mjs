import assert from 'node:assert/strict';
import {geneRates,referenceGenes} from './dist/genes.js';
import {createRun,replaceBath,stepRun,balanceError} from './dist/isotope-model.js';
assert.deepEqual(geneRates(referenceGenes()),{glucose:{transport:1,processing:1,storage:1},glutamine:{transport:1,processing:1,storage:1}});
for(const myc of [0,1,4])for(const kras of [0,1,4])for(const p53 of [0,1,4])for(const p53Loss of [false,true]){const g={myc,kras,p53,p53Loss,krasMutant:true};for(const [id,rates] of Object.entries(geneRates(g))){assert(Object.values(rates).every(v=>v>=0&&Number.isFinite(v)));const s=createRun(id);s.rates=rates;replaceBath(s,.99);for(let i=0;i<1000;i++)stepRun(s,.04);assert(balanceError(s)<1e-8);}}
const r=geneRates(referenceGenes()),m=geneRates({...referenceGenes(),myc:2});assert(m.glutamine.transport>r.glutamine.transport);assert(geneRates({...referenceGenes(),p53Loss:true}).glucose.processing>r.glucose.processing);
console.log('PASS: reference equivalence, gene-control extremes, atom balance and defined hypothesis responses.');
