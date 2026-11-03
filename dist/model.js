// Cellula v0.3: educational energy, pump-leak, membrane mechanics and pore gating.
// Amounts are expressed in mM × V0; V0 is a reference cell volume (radius 10 µm).
export const defaults = Object.freeze({glucose:5, oxygen:0.2, osmolarity:300, temperature:37, potassium:5, demand:1, blockade:0,stiffness:80,bending:20,poreOpening:0,poreType:0,waterPermeability:1,stretchGating:0,respiration:100,protonLeak:1,exchange:1,reserve:10});
const R=8.314462618, F=96485.33212, T0=310.15, P0=0.025, kB=1.380649e-23;
const rtf0=R*T0/F*1000, cl0=145*Math.exp(-70/rtf0);
export const fixed = Object.freeze({pool:4.5,mitoPool:.5,cytoFraction:.9,matrixFraction:.1, impermeant:150-cl0, gNa:3*P0/(rtf0*Math.log(145/15)+70), gK:2*P0/(-70-rtf0*Math.log(5/135)), gCl:0.001});
const basalSupply=0.1*(5/6)*0.8*(1+2*(1-0.2/0.21))+(4/9)/.9;
export function initialState(){return {time:0,na:15,k:135,cl:cl0,atp:2.7,volume:1,gate:0,mitoAtp:.4,mitoPotential:150};}
export function observe(s,p){
  const v=s.volume, na=s.na/v, k=s.k/v, cl=s.cl/v, atp=s.atp/(.9*v), adp=(fixed.pool-s.atp)/(.9*v);
  const temp=p.temperature+273.15, rtf=R*temp/F*1000, area=v**(2/3);
  const q=2**((p.temperature-37)/10), leakQ=1.3**((p.temperature-37)/10);
  // Effective spherical elastic shell. No tension is sustained under compression.
  const areaStrain=Math.max(0,area/(1+p.reserve/100)-1),tension=p.stiffness*areaStrain;
  const radius=10*Math.cbrt(v),laplacePressure=2*tension/radius; // mN/m and µm -> kPa
  const targetGate=p.poreOpening/100+(1-p.poreOpening/100)*p.stretchGating*tension**2/(2**2+tension**2);
  // Additional conductance is a tunable pore population, not a resolved pore radius.
  const poreG=0.006*area*leakQ*s.gate;
  const poreNa=p.poreType===2?0:poreG,poreK=p.poreType===1?0:poreG,poreCl=p.poreType===0?poreG:0;
  const naOut=150*p.osmolarity/300-p.potassium, clOut=145*p.osmolarity/300;
  const eNa=rtf*Math.log(naOut/na), eK=rtf*Math.log(p.potassium/k), eCl=-rtf*Math.log(clOut/cl);
  const naSat=(na**3/(10**3+na**3))/(15**3/(10**3+15**3));
  const pump=P0*area*q*(1-p.blockade/100)*(atp/(1+atp))/(3/4)*naSat*(p.potassium/(1+p.potassium))/(5/6);
  const gNa=fixed.gNa*area*leakQ+poreNa, gK=fixed.gK*area*leakQ+poreK, gCl=fixed.gCl*area*leakQ+poreCl;
  const voltage=(gNa*eNa+gK*eK+gCl*eCl-pump)/(gNa+gK+gCl);
  const jNa=gNa*(voltage-eNa), jK=gK*(voltage-eK), jCl=gCl*(voltage-eCl);
  const g=p.glucose/(1+p.glucose), o=p.oxygen/(0.01+p.oxygen), feedback=adp/(0.5+adp);
  const glycolysis=0.1*g*feedback*q*(1+2*(1-o));
  const matrixATP=s.mitoAtp/(.1*v),matrixADP=(fixed.mitoPool-s.mitoAtp)/(.1*v);
  const respiratoryDrive=(g/(5/6))*(o/(.2/.21))*(p.respiration/100)*Math.max(0,1-s.mitoPotential/220)/(1-150/220)*q;
  const synthase=(4/9)*(matrixADP/(.5+matrixADP))/(2/3)*Math.max(0,(s.mitoPotential-60)/90)*q*v;
  const atpExchange=(20/9)*p.exchange*(s.mitoAtp/fixed.mitoPool-s.atp/fixed.pool)*v;
  const oxidative=Math.max(0,atpExchange)/(.9*v);
  const potentialRate=30*(respiratoryDrive-.85*synthase/((4/9)*v)-.15*p.protonLeak*s.mitoPotential/150);
  const reverseExchange=Math.max(0,-atpExchange)/(.9*v);
  const maintenance=(basalSupply-P0/.9)*p.demand*q*(atp/(0.3+atp))/(3/3.3);
  const osmInside=(s.na+s.k+s.cl+fixed.impermeant)/v;
  const osmDelta=osmInside-p.osmolarity;
  const pressure=R*temp*osmDelta/1000,netPressure=pressure-laplacePressure;
  const waterRate=0.18*p.waterPermeability*area*netPressure/(R*temp*300/1000);
  // Equipartition coefficient for one l=6 spherical bending mode, not total RMS.
  const radiusM=radius*1e-6;
  const rippleNm=radius*1000/Math.sqrt(1680*p.bending+40*(tension*.001)*radiusM**2/(kB*temp));
  const activity=100*(atp/(1+atp))/(3/4)*Math.exp(-1.5*(v-1)**2);
  return {matrixATP,matrixADP,mitoPotential:s.mitoPotential,respiratoryDrive,synthase,atpExchange,potentialRate,atp,adp,na,k,cl,naOut,clOut,voltage,eNa,eK,eCl,pump,pumpPercent:100*pump/(P0*area*q),glycolysis,oxidative,supply:glycolysis+oxidative,use:maintenance+pump/(.9*v)+reverseExchange,maintenance,osmInside,osmDelta,pressure,waterRate,volume:v,radius,activity,jNa,jK,jCl,areaStrain,tension,laplacePressure,netPressure,rippleNm,targetGate,gate:s.gate,poreFluxNa:-poreNa*(voltage-eNa),poreFluxK:-poreK*(voltage-eK),poreFluxCl:poreCl*(voltage-eCl),passiveNa:-jNa,passiveK:-jK,passiveCl:jCl};
}
function derivative(s,p){const o=observe(s,p);return {na:-o.jNa-3*o.pump,k:-o.jK+2*o.pump,cl:o.jCl,atp:(o.glycolysis-o.maintenance)*.9*s.volume+o.atpExchange-o.pump,mitoAtp:o.synthase-o.atpExchange,mitoPotential:o.potentialRate,volume:o.waterRate,gate:(o.targetGate-s.gate)/.8};}
const keys=['na','k','cl','atp','volume','gate','mitoAtp','mitoPotential'];
function add(s,d,h){const r={...s};for(const k of keys)r[k]+=h*d[k];return r;}
export function advance(s,p,dt){
  const a=derivative(s,p),b=derivative(add(s,a,dt/2),p),c=derivative(add(s,b,dt/2),p),d=derivative(add(s,c,dt),p);
  const next={...s,time:s.time+dt};for(const k of keys)next[k]+=dt*(a[k]+2*b[k]+2*c[k]+d[k])/6;
  const valid=keys.every(k=>Number.isFinite(next[k]))&&next.volume>=0.45&&next.volume<=1.8&&next.atp>=0&&next.atp<=fixed.pool&&next.na>0&&next.k>0&&next.cl>0&&next.gate>=0&&next.gate<=1&&next.mitoAtp>=0&&next.mitoAtp<=fixed.mitoPool&&next.mitoPotential>=0&&next.mitoPotential<=220;
  return {state:valid?next:s,valid};
}
export const presets = [
 {id:'baseline',name:'Balanced environment',tag:'START HERE',summary:'A steady reference cell. ATP supply balances demand; pumps maintain the ion gradients.',params:{}},
 {id:'hypoxia',name:'Low oxygen',tag:'ENERGY',summary:'Less oxygen limits oxidative ATP supply. Watch ATP fall, then look for changes in pumping and voltage.',params:{oxygen:0.002}},
 {id:'dilute',name:'Dilute environment',tag:'OSMOSIS',summary:'Lower bath osmolarity drives water into the cell. Swelling dilutes internal solutes and changes voltage.',params:{osmolarity:230}},
 {id:'salty',name:'Concentrated environment',tag:'OSMOSIS',summary:'Higher bath osmolarity draws water out. The cell shrinks and internal solutes become more concentrated.',params:{osmolarity:400}},
 {id:'potassium',name:'High extracellular K⁺',tag:'VOLTAGE',summary:'Raising external potassium reduces its outward gradient, making the membrane potential less negative.',params:{potassium:25}},
 {id:'pump',name:'Block the ion pump',tag:'COUPLING',summary:'Pump inhibition removes active Na⁺/K⁺ transport. Ion leaks gradually change voltage and volume.',params:{blockade:100}},
 {id:'starve',name:'Glucose withdrawal',tag:'METABOLISM',summary:'With glucose removed, the simplified cell loses both ATP supply pathways. No alternative fuels are included.',params:{glucose:0}},
 {id:'pores',name:'Open membrane pores',tag:'TRANSPORT',summary:'Broad ion pores open over about one second. Follow the ion traffic, depolarization, and pump response.',params:{poreOpening:75}},
 {id:'stretch',name:'Stretch opens the gate',tag:'MECHANOBIOLOGY',summary:'A mildly dilute bath swells the cell. Surface tension then opens stretch-sensitive ion pores, linking mechanics to voltage.',params:{osmolarity:275,stiffness:160,stretchGating:1,reserve:0}},
 {id:'water',name:'Fast water channels',tag:'WATER FLOW',summary:'A dilute bath with increased water permeability. Compare the speed of swelling with the Dilute environment preset.',params:{osmolarity:230,waterPermeability:4}},
 {id:'uncouple',name:'Mitochondrial uncoupling',tag:'BIOENERGETICS',summary:'Increase proton leak. Watch the mitochondrial potential fall, respiration change, and ATP delivery respond.',params:{protonLeak:8}},
 {id:'respiration',name:'Respiratory inhibition',tag:'MITOCHONDRIA',summary:'Reduce respiratory-chain capacity. Follow mitochondrial potential, matrix ATP, cytosolic ATP, and plasma-membrane pumping.',params:{respiration:10}},
 {id:'exchange',name:'Restrict ATP exchange',tag:'COMPARTMENTS',summary:'Slow ATP/ADP exchange between matrix and cytosol. The two energy pools can now respond differently.',params:{exchange:.1}},
];
