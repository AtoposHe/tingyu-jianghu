/* Forest scenery and collision share the same roads, clearings and solid props. */
(() => {
 const navigation=typeof module!=='undefined'&&module.exports?require('./navigation.js'):GridNavigation;
 const width=1600,height=1100,radius=10;
 const inside=(x,y,b,p=0)=>x>=b[0]-p&&x<=b[0]+b[2]+p&&y>=b[1]-p&&y<=b[1]+b[3]+p;
 const distance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
 const polygon=(x,y,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const roads=[
  {width:148,points:[[552,80],[580,270],[680,440],[680,620],[610,820],[600,1020]]},
  {width:138,points:[[400,480],[590,480],[680,440]]},
  {width:105,points:[[400,550],[400,630],[460,670]]},
  {width:130,points:[[680,620],[460,670],[300,750]]},
  {width:140,points:[[680,440],[860,380],[1080,380],[1310,380],[1390,500],[1370,790],[1300,950]]},
  {width:132,points:[[610,820],[900,855],[1120,855],[1370,790]]}
 ];
 const clearings=[{id:'clinicYard',x:385,y:445,rx:265,ry:157},{id:'westGlade',x:300,y:750,rx:142,ry:112},{id:'northMine',x:925,y:345,rx:145,ry:100},{id:'eastMine',x:1370,y:515,rx:132,ry:130},{id:'eastGlade',x:1370,y:815,rx:152,ry:177},{id:'southGlade',x:660,y:990,rx:135,ry:76},{id:'creekGlade',x:920,y:875,rx:155,ry:105}];
 const water=[[1135,0],[1225,0],[1190,250],[1190,500],[1160,680],[1160,900],[1110,1100],[1010,1100],[1060,900],[1060,680],[1090,500],[1090,250]];
 const bridges=[[1030,328,250,104],[1010,802,250,106]];
 const fences=[[155,590,330,590],[465,590,630,590],[790,280,1010,280],[1260,665,1340,665],[1420,665,1510,665]];
 const props=[
  {id:'clinic',art:'clinic',label:'杏竹医馆',box:[140,-5,425,330],depth:318,solid:[205,150,275,165]},
  ...fences.map((f,i)=>({id:'fence'+i,art:'fence',box:[f[0],f[1]-45,f[2]-f[0],50],depth:f[1],fence:f})),
  {id:'westRock',art:'boulder',box:[70,650,115,95],depth:737,solid:[95,705,65,30]},
  {id:'eastRock',art:'boulder',box:[1465,430,120,110],depth:530,solid:[1490,490,70,40]},
  {id:'southRock',art:'boulder',box:[765,1005,125,105],depth:1090,solid:[790,1065,75,30]},
  {id:'creekRock',art:'boulder',box:[980,580,125,105],depth:675,solid:[1000,635,75,40]}
 ];
 const trees=[[-80,-40,240,335],[15,20,210,330],[550,-90,220,310],[745,-80,220,330],[900,-70,240,300],[1285,-50,260,330],[1450,100,245,330],[-65,290,235,320],[5,480,160,220],[310,585,135,175],[390,780,165,225],[765,545,205,260],[835,50,150,200],[1240,70,150,210],[1460,550,190,265],[45,820,245,330],[180,890,240,300],[450,1040,220,300],[940,1020,210,290],[1420,955,230,310],[1220,1000,180,280]];
 trees.forEach((box,i)=>props.push({id:'tree'+i,art:i<2||i===2||i===7?'bamboo':'tree',box,depth:box[1]+box[3]-12,trunk:[box[0]+box[2]/2,box[1]+box[3]-18,17]}));
 function onGround(x,y,p=radius){return clearings.some(c=>((x-c.x)/(c.rx-p))**2+((y-c.y)/(c.ry-p))**2<=1)||roads.some(r=>r.points.slice(1).some((b,i)=>distance(x,y,r.points[i],b)<=r.width/2-p));}
 const mines=[{id:'iron-west',ore:'iron',x:300,y:790},{id:'iron-north',ore:'iron',x:915,y:340},{id:'iron-east',ore:'iron',x:1390,y:855},{id:'copper-east',ore:'copper',x:1380,y:505},{id:'copper-north',ore:'copper',x:1020,y:310}].map(n=>({...n,approach:{x:n.x,y:n.y+48}}));
 const herbSpots=[{id:'herb-0',x:530,y:550},{id:'herb-1',x:230,y:750},{id:'herb-2',x:905,y:930},{id:'herb-3',x:680,y:1010},{id:'herb-4',x:370,y:700},{id:'herb-5',x:1420,y:720},{id:'herb-6',x:850,y:340},{id:'herb-7',x:1280,y:925}];
 function walkable(x,y){if(x<35||x>1565||y<100||y>1060||!onGround(x,y))return false;
  // The PNG handrails also block on dry banks: only the visible central deck is walkable.
  const bridge=bridges.find(b=>inside(x,y,[b[0],b[1]-10,b[2],b[3]+25]));
  if(bridge&&!inside(x,y,[bridge[0]-radius,bridge[1]+30,bridge[2]+radius*2,bridge[3]-55],-radius))return false;
  if(polygon(x,y,water)&&!bridges.some(b=>inside(x,y,b,-radius)))return false;
  if(fences.some(f=>distance(x,y,[f[0],f[1]],[f[2],f[3]])<=radius+5))return false;
  for(const p of props){if(p.solid&&inside(x,y,p.solid,radius))return false;if(p.trunk&&Math.hypot(x-p.trunk[0],y-p.trunk[1])<p.trunk[2]+radius)return false;}
  if(mines.some(n=>((x-n.x)/43)**2+((y-(n.y-12))/29)**2<=1))return false;
  return true;
 }
 function canStep(a,b){const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/5));for(let i=1;i<=n;i++)if(!walkable(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true;}
 function drawGround(c,images){
  c.drawImage(images.forestFloor,0,0,width,height);
  c.save();c.lineCap='round';c.lineJoin='round';
  const pattern=c.createPattern(images.forestPath,'repeat');
  for(const outline of [true,false]){for(const a of clearings){c.beginPath();c.ellipse(a.x,a.y,a.rx+(outline?9:0),a.ry+(outline?9:0),0,0,Math.PI*2);c.fillStyle=outline?'#72764b':pattern;c.fill();}
   for(const r of roads){c.beginPath();c.moveTo(...r.points[0]);r.points.slice(1).forEach(p=>c.lineTo(...p));c.lineWidth=r.width+(outline?18:0);c.strokeStyle=outline?'#72764b':pattern;c.stroke();}}
  // Water is drawn over ground; only the two separately painted bridge decks cross it.
  c.beginPath();c.moveTo(...water[0]);water.slice(1).forEach(p=>c.lineTo(...p));c.closePath();c.fillStyle='#608f87';c.fill();c.strokeStyle='#b5c5a2';c.lineWidth=12;c.stroke();
  c.strokeStyle='#a6ccc0';c.lineWidth=2;for(let i=0;i<20;i++){const y=30+i*56,x=y<500?1140:1110;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+15,y+8,x+35,y);c.stroke();}
  for(const b of bridges)c.drawImage(images.bridge,b[0],b[1]-18,b[2],b[3]+40);
  // Sparse small worn stepping stones: decoration has no tall/solid silhouette.
  c.fillStyle='#b7ad8b';for(const p of [[573,180],[590,293],[645,385],[656,548],[645,708],[611,933]]){c.beginPath();c.ellipse(p[0],p[1],23,9,-.1,0,Math.PI*2);c.fill();}
  c.restore();
 }
 const api={id:'forest',name:'听雨林',width,height,props,mines,herbSpots,roads,clearings,fences,bridges,water,onGround,walkable,canStep,drawGround,findPath:navigation.create(width,height,walkable,canStep),
  spawn:{x:552,y:220},portal:{x:552,y:130},doctor:{x:350,y:410,interactionRange:108,talk:{x:400,y:485}},
  surfaceAt:(x,y)=>({id:'forest',height:0,speed:1,name:x<670&&y<600?'青竹林 · 杏竹医馆':x>1250?'东崖矿径':y>760?'溪畔幽径':'听雨林 · 林间岔路'}),
  assets:{forestFloor:'assets/forest/floor-v2.png',forestPath:'assets/forest/path-v2.png',clinic:'assets/forest/clinic.png',bamboo:'assets/forest/bamboo.png',doctor:'assets/q/doctor.png',baizhi:'assets/forest/baizhi.png',lingzhi:'assets/forest/lingzhi.png',ironOre:'assets/items/iron-ore.png',copperOre:'assets/items/copper-ore.png',fence:'assets/forest/fence-v2.png',boulder:'assets/forest/boulder-v2.png',bridge:'assets/forest/bridge-v2.png'}};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.ForestMap=api;
})();
