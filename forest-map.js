/* Listening-rain forest continues the road south of the village. */
(() => {
 const navigation=typeof module!=='undefined'&&module.exports?require('./navigation.js'):GridNavigation;
 const width=1600,height=1100;
 const inside=(x,y,b)=>x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3];
 const polygon=(x,y,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const water=[[1320,0],[1420,0],[1350,180],[1260,340],[1190,440],[1145,530],[1080,660],[1020,790],[950,940],[895,1100],[795,1100],[850,940],[920,790],[980,660],[1045,530],[1090,440],[1160,340],[1250,180]],bridges=[[1080,300,260,155],[865,700,270,155]];
 const props=[
  {id:'clinic',art:'clinic',label:'杏竹医馆',box:[150,75,390,300],depth:370,solid:[210,170,230,155]},
  {id:'bambooNW',art:'bamboo',box:[35,5,210,355],depth:342,trunk:[133,336,19]},
  {id:'bambooNE',art:'bamboo',box:[620,10,200,340],depth:325,trunk:[725,320,18]},
  {id:'bambooClinic',art:'bamboo',box:[10,220,180,300],depth:500,trunk:[90,490,18]},
  {id:'forestOakWest',art:'tree',box:[40,490,230,305],depth:780,trunk:[150,773,24]},
  {id:'forestOakCenter',art:'tree',box:[600,410,200,265],depth:665,trunk:[700,656,22]},
  {id:'forestOakSouth',art:'tree',box:[250,830,260,330],depth:1110,trunk:[380,1090,24]},
  {id:'forestOakEast',art:'tree',box:[1350,590,245,335],depth:910,trunk:[1470,905,24]},
  {id:'forestBambooSouth',art:'bamboo',box:[1190,790,180,305],depth:1080,trunk:[1280,1068,18]}
 ];
 function walkable(x,y){if(x<35||x>1565||y<105||y>1060)return false;if(polygon(x,y,water)&&!bridges.some(b=>inside(x,y,b)))return false;
  if(inside(x,y,[1450,220,130,370]))return false;if(((x-330)/100)**2+((y-930)/55)**2<1)return false;
  for(const p of props){if(p.solid&&inside(x,y,p.solid))return false;if(p.trunk&&Math.hypot(x-p.trunk[0],y-p.trunk[1])<p.trunk[2]+10)return false;}return true;
 }
 function canStep(a,b){const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/7));for(let i=1;i<=n;i++)if(!walkable(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true;}
 const mines=[{id:'iron-west',ore:'iron',x:310,y:550},{id:'iron-north',ore:'iron',x:960,y:270},{id:'iron-east',ore:'iron',x:1360,y:855},{id:'copper-east',ore:'copper',x:1370,y:435},{id:'copper-north',ore:'copper',x:1060,y:400}];
 const herbSpots=[{id:'herb-0',x:590,y:365},{id:'herb-1',x:340,y:720},{id:'herb-2',x:940,y:690},{id:'herb-3',x:540,y:950},{id:'herb-4',x:260,y:475},{id:'herb-5',x:1380,y:690},{id:'herb-6',x:1030,y:260},{id:'herb-7',x:800,y:950}];
 const api={id:'forest',name:'听雨林',width,height,props,mines,herbSpots,walkable,canStep,findPath:navigation.create(width,height,walkable,canStep),
  spawn:{x:552,y:220},portal:{x:552,y:130},doctor:{x:350,y:410,talk:{x:360,y:455}},
  surfaceAt:(x,y)=>({id:'forest',height:0,speed:1,name:x<820&&y<520?'青竹林 · 杏竹医馆':x>1200?'东崖矿径':y>760?'溪畔幽径':'听雨林 · 林间岔路'}),
  assets:{forestTerrain:'assets/maps/forest.png',clinic:'assets/forest/clinic.png',bamboo:'assets/forest/bamboo.png',doctor:'assets/q/doctor.png',baizhi:'assets/forest/baizhi.png',lingzhi:'assets/forest/lingzhi.png'}};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.ForestMap=api;
})();
