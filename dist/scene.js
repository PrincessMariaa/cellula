import * as THREE from './vendor/three.module.js';
const TAU=Math.PI*2;
const colors={biology:0x8fa76c,chemistry:0xc69b55,physics:0x7b9bbf};
export class CellScene {
 constructor(container,onSelect){
  this.container=container;this.onSelect=onSelect;this.layer='biology';this.cut=true;this.angle={x:.13,y:-.25};this.zoom=6.4;this.volume=1;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.motion=!this.reduced;this.showFlows=true;this.animationTime=0;this.lastSimTime=0;this.drifters=[];
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(36,1,.1,80);this.camera.position.set(0,.17,this.zoom);this.camera.lookAt(0,0,0);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0,0);this.renderer.localClippingEnabled=true;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.28;container.prepend(this.renderer.domElement);
  this.scene.add(new THREE.HemisphereLight(0xfffff0,0x8a9a79,2.3));const key=new THREE.DirectionalLight(0xffffff,3.1);key.position.set(-3,6,5);this.scene.add(key);const fill=new THREE.DirectionalLight(0xd9f3e8,1.5);fill.position.set(4,-1,2);this.scene.add(fill);const rim=new THREE.DirectionalLight(0xf4e9b9,2);rim.position.set(0,0,-4);this.scene.add(rim);
  this.turntable=new THREE.Group();this.scene.add(this.turntable);this.cell=new THREE.Group();this.turntable.add(this.cell);this.picks=[];this.mitoMaterials=[];this.labels=new Map();this.cellRadius=1.58;this.shape=new THREE.Vector3(1.11,.92,.88);
  this.buildCell();this.buildIsotopeOverlay();this.buildMembranePores();this.buildTransport();this.buildChemistry();this.buildPhysics();this.buildShadow();this.setLayer('biology');
  this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.drag=null;this.pinch=null;
  const c=this.renderer.domElement;
  c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};});
  c.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.angle.y+=dx*.008;this.angle.x=THREE.MathUtils.clamp(this.angle.x+dy*.008,-1.3,1.3);this.drag.x=e.clientX;this.drag.y=e.clientY;if(Math.hypot(e.clientX-this.drag.startX,e.clientY-this.drag.startY)>4)this.drag.moved=true;});
  c.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved)this.pick(e);this.drag=null;});c.addEventListener('pointercancel',()=>this.drag=null);
  c.addEventListener('wheel',e=>{e.preventDefault();this.zoom=THREE.MathUtils.clamp(this.zoom+e.deltaY*.003,4.7,9);},{passive:false});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
 }
 mat(color,opts={}){return new THREE.MeshPhysicalMaterial({color,roughness:.46,metalness:.02,clearcoat:.4,clearcoatRoughness:.35,...opts});}
 mesh(geometry,material,parent=this.cell,name=null){const m=new THREE.Mesh(geometry,material);parent.add(m);if(name){m.userData.organelle=name;this.picks.push(m);}return m;}
 sphere(radius,material,parent=this.cell,name=null,segments=32){return this.mesh(new THREE.SphereGeometry(radius,segments,Math.round(segments*.7)),material,parent,name);}
 tube(points,radius,material,parent=this.cell,name=null){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return this.mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*5),radius,5,false),material,parent,name);}
 anchor(name,pos){const obj=new THREE.Object3D();obj.position.set(...pos);this.cell.add(obj);this.labels.set(name,obj);}
 buildCell(){
  const r=this.cellRadius, geo=new THREE.SphereGeometry(r,80,56);const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),bump=1+.035*Math.sin(x*2.9+y)*Math.cos(z*2.5)+.018*Math.cos(y*4-z);pos.setXYZ(i,x*this.shape.x*bump,y*this.shape.y*bump,z*this.shape.z*bump);}geo.computeVertexNormals();
  this.shellMat=this.mat(0xc6d9a3,{transparent:true,opacity:.32,roughness:.24,side:THREE.DoubleSide,depthWrite:false});this.shell=this.mesh(geo,this.shellMat,this.cell,'membrane');
  this.innerShell=this.mesh(geo.clone(),this.mat(0xe1eac2,{transparent:true,opacity:.1,side:THREE.BackSide,depthWrite:false}),this.cell);this.innerShell.scale.setScalar(.982);
  this.restSurface=new Float32Array(pos.array);
  this.cutPlane=new THREE.Plane(new THREE.Vector3(0,0,-1),.33); // Reoriented into world space every frame.
  this.shellMat.clippingPlanes=[this.cutPlane];
  this.rimMat=this.mat(0x9caf77,{transparent:true,opacity:.7,roughness:.4});const pts=[];
  for(let i=0;i<=128;i++){const a=i/128*TAU;const x=r*this.shape.x*Math.cos(a),y=r*this.shape.y*Math.sin(a);pts.push([x*.98,y*.98,.33]);}
  this.cutRim=this.tube(pts,.024,this.rimMat,this.cell,'membrane');
  const nucleus=new THREE.Group();nucleus.position.set(-.43,.14,.25);nucleus.rotation.z=-.2;this.cell.add(nucleus);
  this.nucleusMat=this.mat(0xb9b2ca,{roughness:.35,transparent:true,opacity:.93});const nm=this.sphere(.63,this.nucleusMat,nucleus,'nucleus',56);nm.scale.set(1,.94,.95);
  this.sphere(.52,this.mat(0xcac2d8,{transparent:true,opacity:.25,depthWrite:false}),nucleus).position.z=.07;
  const nucleolus=this.sphere(.19,this.mat(0x8c7d9e,{roughness:.43}),nucleus,'nucleus');nucleolus.position.set(.13,-.04,.47);
  const poreMat=this.mat(0x9a90ac);for(let i=0;i<32;i++){const z=1-2*(i+.5)/32,a=i*2.399963,rxy=Math.sqrt(1-z*z);const p=new THREE.Vector3(rxy*Math.cos(a),z*.94,rxy*Math.sin(a)*.95).multiplyScalar(.635);const pore=this.mesh(new THREE.TorusGeometry(.026,.008,5,10),poreMat,nucleus,'nucleus');pore.position.copy(p);pore.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),p.clone().normalize());}
  const chromatin=this.mat(0xa79bb8,{transparent:true,opacity:.6});for(let j=0;j<5;j++){const pp=[];for(let i=0;i<=20;i++){const a=i/20*TAU*1.5;pp.push([Math.cos(a)*(.3+j*.017),Math.sin(a)*.24,Math.sin(a*1.7+j)*.13+.42]);}this.tube(pp,.011,chromatin,nucleus,'nucleus');}
  const erMat=this.mat(0x93bcb1,{transparent:true,opacity:.72,roughness:.4});
  for(let j=0;j<6;j++){const pp=[];for(let i=0;i<=24;i++){const a=-.15+i/24*Math.PI*1.7,rr=.73+j*.065;pp.push([-.43+Math.cos(a)*rr,.14+Math.sin(a)*rr*.72,-.1+Math.sin(a*2+j*.5)*.12-j*.035]);}this.tube(pp,.025,erMat,this.cell,'er');}
  for(let j=0;j<4;j++){const pp=[];for(let i=0;i<=15;i++){const a=i/15*TAU;pp.push([.18+Math.cos(a)*(.25+j*.06),-.49+Math.sin(a)*(.15+j*.035),.35+Math.sin(a*2+j)*.06]);}this.tube(pp,.023,erMat,this.cell,'er');}
  const ribosomeMat=this.mat(0x6c9087);for(let i=0;i<65;i++){const a=i*2.399963,rr=.73+(i%6)*.065;const b=this.sphere(.014,ribosomeMat,this.cell,null,8);b.position.set(-.43+Math.cos(a)*rr,.14+Math.sin(a)*rr*.72,-.03-(i%6)*.035);}
  const mitoPlaces=[[.84,.49,.28,-.6,.9],[.78,-.54,.57,.55,1],[-.94,-.62,.36,-.9,.76],[-.58,.99,-.18,.8,.65],[1.12,-.03,-.35,.5,.74]];
  for(const [x,y,z,rot,scale] of mitoPlaces){const group=new THREE.Group();group.position.set(x,y,z);group.rotation.set(.3,rot*.3,rot);group.scale.setScalar(scale);this.cell.add(group);this.drifters.push({group,base:group.position.clone(),angle:rot,phase:x*5});const mm=this.mat(0xc59a65,{roughness:.4,clearcoat:.5});this.mitoMaterials.push(mm);const body=this.mesh(new THREE.CapsuleGeometry(.14,.4,8,18),mm,group,'mitochondria');body.rotation.z=Math.PI/2;body.scale.z=.8;
   const inner=this.mat(0x956d45,{roughness:.65});for(let j=0;j<7;j++){const xx=-.23+j*.075;this.tube([[xx-.025,-.09,.09],[xx+.025,-.04,.125],[xx-.02,.02,.13],[xx+.026,.08,.1]],.013,inner,group,'mitochondria');}
  }
  const golgi=new THREE.Group();golgi.position.set(.45,.93,.15);golgi.rotation.z=-.2;this.cell.add(golgi);const golgiMat=this.mat(0xd8bf82,{roughness:.6});for(let j=0;j<5;j++){const pp=[];for(let i=0;i<18;i++){const a=-1.2+i/17*2.4;pp.push([Math.sin(a)*(.33-j*.025),j*.085-.2+Math.cos(a)*.1,Math.cos(a)*.07]);}this.tube(pp,.032,golgiMat,golgi,'golgi');}
  for(let i=0;i<6;i++){const vesicle=this.sphere(.035+(i%2)*.014,this.mat(0xd5c292,{transparent:true,opacity:.7}),this.cell,'golgi',16);vesicle.position.set(.75+(i%3)*.1,.8+(i%2)*.13,.1+i*.04);}
  const cytoMat=this.mat(0xd1dfbb,{transparent:true,opacity:.35,depthWrite:false});for(let j=0;j<14;j++){const a=j/14*TAU,pp=[];for(let i=0;i<8;i++){const t=i/7;pp.push([Math.cos(a)*t*1.48,Math.sin(a)*t*1.25,Math.sin(t*4+j)*.27-.15]);}this.tube(pp,.008,cytoMat);}
  const smallMat=this.mat(0xb2c995,{roughness:.7});let seed=32;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<80;i++){let p;do{p=new THREE.Vector3((random()-.5)*3.3,(random()-.5)*2.7,(random()-.5)*2.2);}while(p.length()>1.46||p.distanceTo(new THREE.Vector3(-.43,.14,.25))<.7);const s=this.sphere(.011+random()*.018,smallMat,this.cell,null,8);s.position.copy(p);}
  this.proteins=[];const proteinMat=this.mat(0x779883,{roughness:.5});for(let i=0;i<23;i++){const a=i/23*TAU;const p=new THREE.Vector3(Math.cos(a)*r*this.shape.x,Math.sin(a)*r*this.shape.y,.17+Math.sin(a*3)*.17);const protein=this.mesh(new THREE.CapsuleGeometry(.034,.13,4,8),proteinMat,this.cell,'membrane');protein.position.copy(p);protein.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(p.x/this.shape.x,p.y/this.shape.y,p.z).normalize());this.proteins.push(protein);}
  this.anchor('nucleus',[-.82,.44,.75]);this.anchor('mitochondria',[.97,-.57,.65]);this.anchor('membrane',[1.61,.53,.25]);
 }
 buildMembranePores(){
  this.membranePores=[];this.poreMat=this.mat(0x6d9c98,{roughness:.35});this.apertureMat=new THREE.MeshBasicMaterial({color:0x486a70,transparent:true,opacity:.65,side:THREE.DoubleSide});
  for(let i=0;i<12;i++){const a=i/12*TAU+.15,p=new THREE.Vector3(Math.cos(a)*this.cellRadius*this.shape.x*.985,Math.sin(a)*this.cellRadius*this.shape.y*.985,.33);const group=new THREE.Group();group.position.copy(p);group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(p.x/this.shape.x,p.y/this.shape.y,.18).normalize());this.cell.add(group);const ring=this.mesh(new THREE.TorusGeometry(.074,.016,7,18),this.poreMat,group,'pores');const aperture=this.mesh(new THREE.CircleGeometry(.059,18),this.apertureMat,group,'pores');aperture.position.z=.002;this.membranePores.push({group,ring,aperture});}
  this.anchor('pores',[-1.48,-.40,.43]);
 }
 buildTransport(){
  this.transport=new THREE.Group();this.cell.add(this.transport);this.streams=[];
  const configs=[{key:'passiveNa',color:0xd5a05f,angle:.1},{key:'passiveK',color:0x729cbe,angle:2.6},{key:'passiveCl',color:0xa896bf,angle:4.3},{key:'pump',factor:-3,color:0xd5a05f,angle:.1+Math.PI/6},{key:'pump',factor:2,color:0x729cbe,angle:2.6+Math.PI/6},{key:'waterRate',color:0x6ebbb4,angle:5.5,water:true}];
  const geometry=new THREE.SphereGeometry(.024,8,6);
  for(const config of configs){const m=new THREE.InstancedMesh(geometry,this.mat(config.color,{roughness:.3,transparent:true,opacity:.85}),24);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;this.transport.add(m);this.streams.push({...config,mesh:m});}this.flowDummy=new THREE.Object3D();
 }
 updateTransport(o,t){
  this.transport.visible=this.showFlows;if(!this.showFlows)return;
  for(const stream of this.streams){const flux=o[stream.key]*(stream.factor??1),magnitude=Math.abs(flux),threshold=stream.water?.00008:.0002;stream.mesh.visible=magnitude>threshold;if(!stream.mesh.visible)continue;const intensity=Math.min(1,magnitude/(stream.water?.015:.15)),count=Math.max(2,Math.ceil(24*intensity));stream.mesh.count=count;const rate=.07+Math.min(.55,Math.sqrt(magnitude)*(stream.water?3:1));
   for(let i=0;i<count;i++){const progress=(t*rate+i/count)%1,inward=flux>0,u=inward?1.28-progress*.55:.73+progress*.55,a=stream.angle+(i%2)*.10;this.flowDummy.position.set(Math.cos(a)*this.cellRadius*this.shape.x*u,Math.sin(a)*this.cellRadius*this.shape.y*u,.33+(i%3-1)*.035);const size=(stream.water?.75:1)*(0.7+0.3*Math.sin(progress*Math.PI));this.flowDummy.scale.setScalar(size);this.flowDummy.updateMatrix();stream.mesh.setMatrixAt(i,this.flowDummy.matrix);}stream.mesh.instanceMatrix.needsUpdate=true;
  }
 }
 updateSurface(o,t){
  const amplitude=3*o.rippleNm/(o.radius*1000); // Display the l=6 coefficient at 3× for readability.
  for(const shell of [this.shell,this.innerShell]){const a=shell.geometry.attributes.position.array;for(let i=0;i<a.length;i+=3){const x=this.restSurface[i],y=this.restSurface[i+1],z=this.restSurface[i+2],az=Math.atan2(y/this.shape.y,x/this.shape.x),wave=Math.sin(6*az+t*.45)*Math.cos(z*3+t*.23);const scale=1+amplitude*wave;a[i]=x*scale;a[i+1]=y*scale;a[i+2]=z*scale;}shell.geometry.attributes.position.needsUpdate=true;}
  for(const d of this.drifters){d.group.position.set(d.base.x+Math.sin(t*.08+d.phase)*.018,d.base.y+Math.cos(t*.07+d.phase)*.015,d.base.z+Math.sin(t*.06+d.phase)*.012);d.group.rotation.z=d.angle+Math.sin(t*.05+d.phase)*.035;}
  this.poreMat.color.setHSL(.46,.18+o.gate*.22,.52);for(const p of this.membranePores)p.aperture.scale.setScalar(.12+.88*o.gate);
 }
 buildChemistry(){
  this.chemistry=new THREE.Group();this.cell.add(this.chemistry);this.molecules=[];const atpMat=this.mat(0xd4a544,{emissive:0xbd8735,emissiveIntensity:.14,roughness:.3}),adpMat=this.mat(0x8ba8ba,{roughness:.5});
  for(let i=0;i<95;i++){const a=i*2.399963,rr=.65+((i*37)%100)/100*.8,z=Math.sin(i*1.17)*.65;const m=this.sphere(.025+(i%3)*.005,i%5===0?adpMat:atpMat,this.chemistry,null,10);m.userData={base:new THREE.Vector3(Math.cos(a)*rr,Math.sin(a)*rr*.8,z),phase:i*.7,atp:i%5!==0};m.position.copy(m.userData.base);this.molecules.push(m);}
  this.atpMat=atpMat;
 }
 buildPhysics(){
  this.physics=new THREE.Group();this.turntable.add(this.physics);this.physicsBaseline=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(this.cellRadius,24,12)),new THREE.LineBasicMaterial({color:0x9bb2c1,transparent:true,opacity:.11}));this.physicsBaseline.scale.copy(this.shape);this.physics.add(this.physicsBaseline);
  this.arrows=[];for(let i=0;i<16;i++){const a=i/16*TAU,dir=new THREE.Vector3(Math.cos(a),Math.sin(a),.05).normalize(),origin=dir.clone().multiplyScalar(1.8);origin.x*=this.shape.x;origin.y*=this.shape.y;const arrow=new THREE.ArrowHelper(dir,origin,.24,0x7fa9c0,.085,.05);this.physics.add(arrow);this.arrows.push({arrow,dir});}
  const ringGeo=new THREE.TorusGeometry(this.cellRadius*1.12,.006,4,90);this.fieldRings=[];for(let j=0;j<3;j++){const ring=this.mesh(ringGeo,new THREE.MeshBasicMaterial({color:0x96b4cc,transparent:true,opacity:.3}),this.physics);ring.rotation.set(.4+j*.65,j*.7,.1);ring.scale.copy(this.shape);this.fieldRings.push(ring);}
 }
 buildShadow(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,5,64,64,62);g.addColorStop(0,'rgba(88,109,56,.12)');g.addColorStop(1,'rgba(88,109,56,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const tex=new THREE.CanvasTexture(c);const p=new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.1),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));p.position.set(0,-1.63,-1.1);this.scene.add(p);}
 buildIsotopeOverlay(){
  this.isotopeDots=new THREE.Group();this.cell.add(this.isotopeDots);this.isotopeMarkers=[];
  const geometry=new THREE.SphereGeometry(.033,8,6);this.heavyIsotopeMat=new THREE.MeshBasicMaterial({color:0x193b4c,depthTest:false});this.lightIsotopeMat=new THREE.MeshBasicMaterial({color:0xe9eff3,depthTest:false});
  for(let i=0;i<100;i++){const dot=new THREE.Mesh(geometry,this.lightIsotopeMat);dot.renderOrder=20;this.isotopeDots.add(dot);this.isotopeMarkers.push(dot);}
  this.isotopeDots.visible=false;
 }
 setIsotopeOverlay(data){this.isotopeDots.visible=Boolean(data?.enabled);if(!data?.enabled)return;
  const heavy=Math.round(100*data.fraction);
  for(let i=0;i<100;i++){const a=i*2.39996323,r=data.location==='membrane'?1.55:data.location==='outside'?1.9:1.2*Math.sqrt((i+.5)/100);const dot=this.isotopeMarkers[i];dot.material=((i*37)%100)<heavy?this.heavyIsotopeMat:this.lightIsotopeMat;dot.position.set(Math.cos(a)*r*1.11,Math.sin(a)*r*.92,.45);}
 }
 setLayer(layer){this.layer=layer;this.chemistry.visible=layer==='chemistry';this.physics.visible=layer==='physics';this.shellMat.opacity=layer==='biology'?.32:layer==='chemistry'?.19:.13;this.nucleusMat.opacity=layer==='chemistry'?.6:.93;this.container.querySelectorAll('.organelle-label').forEach(el=>el.hidden=layer!=='biology');}
 setCutaway(cut){this.cut=cut;this.cutRim.visible=cut;this.shellMat.clippingPlanes=cut?[this.cutPlane]:[];this.shellMat.needsUpdate=true;}
 reset(){this.angle={x:.13,y:-.25};this.zoom=6.4;}
 setMotion(enabled){this.motion=enabled;}
 setFlows(enabled){this.showFlows=enabled;}
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 pick(e){const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects(this.picks);const h=hits.find(hit=>hit.object!==this.shell||!this.cut||hit.point.clone().applyMatrix4(this.cell.matrixWorld.clone().invert()).z<.33);if(h)this.onSelect(h.object.userData.organelle);}
 update(o,time,dt){
  if(time<this.lastSimTime)this.animationTime=0;else if(this.motion&&!this.reduced)this.animationTime+=Math.max(0,time-this.lastSimTime);this.lastSimTime=time;const t=this.animationTime;
  this.updateSurface(o,t);this.updateTransport(o,t);
  const target=Math.cbrt(o.volume);this.volume+=(target-this.volume)*Math.min(1,dt*6);this.cell.scale.setScalar(this.volume);this.turntable.rotation.set(this.angle.x,this.angle.y,0);this.camera.position.z=this.zoom;this.camera.lookAt(0,0,0);this.turntable.updateMatrixWorld(true);
  // Keep the cut plane attached to the rotating cell.
  this.cutPlane.set(new THREE.Vector3(0,0,-1),.33).applyMatrix4(this.cell.matrixWorld);
  const energy=THREE.MathUtils.clamp(o.atp/3,0,1.3);for(const m of this.mitoMaterials){m.color.setHSL(.085,.24+energy*.19,.56+energy*.035);m.emissive.setHex(0x9c6923);m.emissiveIntensity=.02+Math.max(0,o.mitoPotential/150)*.075;}
  this.shellMat.color.set(this.layer==='physics'?new THREE.Color().setHSL(.58,THREE.MathUtils.clamp(Math.abs(o.voltage)/150,.15,.65),.72):0xc6d9a3);
  if(this.chemistry.visible){let i=0;for(const m of this.molecules){const p=m.userData.phase,b=m.userData.base,mt=t*.17;m.position.set(b.x+Math.sin(mt+p)*.075,b.y+Math.cos(mt*.8+p)*.06,b.z+Math.sin(mt*.7+p*2)*.07);m.visible=!m.userData.atp||((i++%10)/10<Math.min(.95,energy*.8));}this.atpMat.emissiveIntensity=.06+energy*.16;}
  if(this.physics.visible){for(const {arrow,dir} of this.arrows){const inward=o.waterRate>=0;arrow.setDirection(dir.clone().multiplyScalar(inward?-1:1));const rad=(this.cellRadius*this.volume+.15);arrow.position.copy(dir).multiplyScalar(rad+(inward?.23:0));arrow.position.x*=this.shape.x;arrow.position.y*=this.shape.y;arrow.setLength(.10+Math.min(.27,Math.abs(o.waterRate)*12),.065,.04);arrow.visible=Math.abs(o.waterRate)>.00008;}for(const ring of this.fieldRings)ring.material.opacity=.12+Math.min(.25,Math.abs(o.voltage)/300);}
  const w=this.container.clientWidth,h=this.container.clientHeight;for(const [name,anchor] of this.labels){const e=this.container.querySelector(`[data-organelle="${name}"]`);if(!e)continue;const p=anchor.getWorldPosition(new THREE.Vector3()).project(this.camera);e.style.left=`${THREE.MathUtils.clamp((p.x*.5+.5)*w,name==='membrane'?10:105,w-(name==='membrane'?97:8))}px`;e.style.top=`${THREE.MathUtils.clamp((-p.y*.5+.5)*h,62,h-76)}px`;}
  const dist=this.zoom,worldPerPx=2*dist*Math.tan(THREE.MathUtils.degToRad(36/2))/h;const scaleWidth=this.cellRadius/worldPerPx;const scaleBar=this.container.querySelector('.scale-bar i');if(scaleBar)scaleBar.style.width=`${scaleWidth}px`;
  this.renderer.render(this.scene,this.camera);
 }
}
