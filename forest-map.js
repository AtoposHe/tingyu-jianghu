/* Forest scenery and collision share the same roads, clearings and solid props. */
(() => {
 const navigation=typeof module!=='undefined'&&module.exports?require('./navigation.js'):GridNavigation;
 const width=1600,height=1100,radius=10;
 const inside=(x,y,b,p=0)=>x>=b[0]-p&&x<=b[0]+b[2]+p&&y>=b[1]-p&&y<=b[1]+b[3]+p;
 const distance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
 const polygon=(x,y,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 // Coordinates traced against the final painting, not the generation sketch.
 const roads=[
  {width:78,points:[[552,70],[560,150],[575,220],[600,300],[590,410],[575,465],[550,530],[510,605],[475,690],[475,815],[500,865]]},
  {width:90,points:[[350,310],[480,330],[590,315]]},
  {width:72,points:[[350,380],[350,435],[385,480],[475,475],[580,460]]},
  {width:72,points:[[400,485],[320,525],[245,555],[225,585],[-40,585]]},
  {width:88,points:[[595,310],[705,275],[800,220],[875,195],[960,190],[1050,220],[1150,245],[1250,235],[1340,265],[1430,310],[1430,350],[1400,400],[1390,540],[1370,620],[1400,690],[1350,745],[1310,780]]},
  {width:86,points:[[475,680],[630,690],[735,720],[820,740],[900,720],[1000,685],[1110,700],[1200,690],[1320,640],[1370,620]]},
  {width:72,points:[[1370,620],[1460,620],[1540,600],[1640,605]]}
 ];
 const clearings=[{id:'clinicYard',x:340,y:310,rx:225,ry:88},{id:'westGlade',x:235,y:580,rx:80,ry:57},{id:'eastGlade',x:1390,y:700,rx:72,ry:73},{id:'southGlade',x:520,y:870,rx:83,ry:57},{id:'creekGlade',x:820,y:730,rx:115,ry:65}];
 const water=[[1120,0],[1235,0],[1245,100],[1210,200],[1260,300],[1245,400],[1210,500],[1145,600],[1160,700],[1120,800],[1060,900],[1135,1000],[1120,1100],[1015,1100],[1025,1000],[970,900],[1020,800],[1040,700],[1035,600],[1090,500],[1135,400],[1120,300],[1080,200],[1110,100]];
 const bridges=[[1040,190,240,104],[990,645,240,106]];
 const fences=[[140,405,280,405],[430,405,525,405],[800,135,970,135]];
 const props=[
  {id:'clinic',art:'clinic',label:'杏竹医馆',box:[150,-65,390,285],depth:212,solid:[195,65,280,125]},
  ...fences.map((f,i)=>({id:'fence'+i,art:'fence',box:[f[0],f[1]-40,f[2]-f[0],45],depth:f[1],fence:f})),
  {id:'centerRock',art:'boulder',box:[650,370,100,85],depth:445,solid:[673,420,50,22]},
  {id:'southRock',art:'boulder',box:[780,855,110,90],depth:935,solid:[805,900,60,25]}
 ];
 const trees=[{art:'bamboo',box:[-60,-60,230,380]},{art:'bamboo',box:[-80,680,210,350]},{art:'tree',box:[620,-110,235,300]},{art:'tree',box:[690,325,210,260]},{art:'tree',box:[20,820,260,330]},{art:'tree',box:[1460,-80,210,330]},{art:'tree',box:[1430,840,225,300]}];
 trees.forEach(({art,box},i)=>props.push({id:'tree'+i,art,box,depth:box[1]+box[3]-12,trunk:[box[0]+box[2]/2,box[1]+box[3]-18,17]}));
 function onGround(x,y,p=radius){return clearings.some(c=>((x-c.x)/(c.rx-p))**2+((y-c.y)/(c.ry-p))**2<=1)||roads.some(r=>r.points.slice(1).some((b,i)=>distance(x,y,r.points[i],b)<=r.width/2-p));}
 const mines=[{id:'iron-west',ore:'iron',x:220,y:570,approach:{x:250,y:610}},{id:'iron-north',ore:'iron',x:810,y:170,approach:{x:810,y:225}},{id:'iron-east',ore:'iron',x:1410,y:690,approach:{x:1380,y:740}},{id:'copper-east',ore:'copper',x:1450,y:390,approach:{x:1390,y:410}},{id:'copper-north',ore:'copper',x:970,y:155,approach:{x:970,y:215}}];
 const herbSpots=[{id:'herb-0',x:520,y:330},{id:'herb-1',x:180,y:600},{id:'herb-2',x:805,y:755},{id:'herb-3',x:520,y:880},{id:'herb-4',x:400,y:490},{id:'herb-5',x:1390,y:550},{id:'herb-6',x:865,y:215},{id:'herb-7',x:1305,y:775}];
 const exits=[{id:'west',name:'西行山道',x:20,y:585,open:false},{id:'east',name:'东行山径',x:1580,y:605,open:false}];
 function walkable(x,y){if(x<12||x>1588||y<100||y>1060||!onGround(x,y))return false;
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
 function drawGround(c,images){c.drawImage(images.forestTerrain,0,0,width,height);for(const b of bridges)c.drawImage(images.bridge,b[0],b[1]-18,b[2],b[3]+40);}
 const api={id:'forest',name:'听雨林',width,height,props,mines,herbSpots,roads,clearings,fences,bridges,water,exits,onGround,walkable,canStep,drawGround,findPath:navigation.create(width,height,walkable,canStep),
  spawn:{x:552,y:220},portal:{x:552,y:130},doctor:{x:335,y:285,interactionRange:108,talk:{x:415,y:340}},
  surfaceAt:(x,y)=>({id:'forest',height:0,speed:1,name:x<530&&y<410?'青竹林 · 杏竹医馆':x>1250?'东崖矿径':y>620?'溪畔幽径':'听雨林 · 林间岔路'}),
  assets:{forestTerrain:'assets/maps/forest-v4.png',clinic:'assets/forest/clinic.png',bamboo:'assets/forest/bamboo.png',doctor:'assets/q/doctor.png',baizhi:'assets/forest/baizhi.png',lingzhi:'assets/forest/lingzhi.png',ironOre:'assets/items/iron-ore.png',copperOre:'assets/items/copper-ore.png',fence:'assets/forest/fence-v2.png',boulder:'assets/forest/boulder-v2.png',bridge:'assets/forest/bridge-v2.png'}};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.ForestMap=api;
})();
