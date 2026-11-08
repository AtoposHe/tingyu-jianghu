/* Painted layers and navigation share these 1600 × 1000 map coordinates. */
(() => {
  'use strict';
  const width=1600,height=1000,CELL=16;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const inside=(p,box)=>p.x>=box[0]&&p.y>=box[1]&&p.x<=box[0]+box[2]&&p.y<=box[1]+box[3];
  const polygon=(x,y,points)=>{
    let yes=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++) {
      const a=points[i],b=points[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
    }
    return yes;
  };
  const stairs=[
    {id:'innSteps',name:'客栈石阶',box:[500,282,110,148],top:72,start:295,end:430},
    {id:'trainingSteps',name:'演武石阶',box:[1130,282,168,148],top:88,start:295,end:430}
  ];
  const terraces=[
    {id:'innTerrace',name:'枕间客舍 · 上层台地',box:[100,105,640,197],height:72},
    {id:'trainingTerrace',name:'竹林演武台',box:[970,115,570,187],height:88}
  ];
  const ramp={id:'westSlope',name:'西巷缓坡',box:[35,240,105,320]};
  const props=[
    {id:'inn',art:'inn',label:'枕间客舍',box:[152,18,450,258],depth:267,solid:[[170,177],[552,177],[586,265],[170,265]]},
    {id:'training',art:'training',label:'听雨武馆',box:[1155,12,380,284],depth:289,solid:[[1280,160],[1493,160],[1502,235],[1280,235]]},
    {id:'homes',art:'homes',box:[48,526,368,276],depth:786,solid:[[70,638],[380,625],[407,782],[75,790]]},
    {id:'smithy',art:'smithy',label:'溪南铁铺',box:[1338,454,224,245],depth:691,solid:[[1410,530],[1552,552],[1555,685],[1410,664]]},
    {id:'winehouse',art:'winehouse',label:'杏花酒肆',box:[205,382,285,215],depth:590,solid:[[223,490],[460,490],[476,587],[223,587]]},
    {id:'guesthouse',art:'guesthouse',label:'村长家',box:[1000,510,235,230],depth:729,solid:[[1020,635],[1215,635],[1224,732],[1020,732]]},
    {id:'westTree',art:'tree',box:[0,372,220,270],depth:625,trunk:[107,623,20]},
    {id:'eastTree',art:'tree',box:[1450,320,220,270],depth:573,trunk:[1558,572,22]},
    {id:'frontWest',art:'tree',box:[95,713,330,330],depth:1005,trunk:[250,990,25]},
    {id:'frontEast',art:'tree',box:[1330,748,330,330],depth:1040,trunk:[1483,1025,25]}
  ];
  const riverPoints=[[0,882],[200,860],[400,835],[600,781],[800,792],[1000,920]];
  const water=[[813,0],[967,0],[970,130],[930,245],[924,320],[902,375],[923,430],[950,470],[900,530],[890,590],[870,650],[872,735],[900,800],[962,870],[1030,930],[1150,1000],[680,1000],[660,930],[660,850],[663,775],[660,710],[675,640],[692,560],[704,520],[700,465],[708,405],[731,347],[765,280],[794,215],[808,150]];
  const bridge=[[695,448],[755,424],[825,414],[900,429],[966,454],[966,493],[895,466],[824,455],[755,466],[695,493]];
  function riverCenter(y) {
    const i=Math.max(0,Math.min(4,Math.floor(y/200))),a=riverPoints[i],b=riverPoints[i+1];
    return a[1]+(b[1]-a[1])*(y-a[0])/200;
  }
  function surfaceAt(x,y) {
    const p={x,y},step=stairs.find(s=>inside(p,s.box));
    if(step)return {id:step.id,name:step.name,height:step.top*clamp((step.end-y)/(step.end-step.start)),speed:.76,stairs:true};
    if(inside(p,ramp.box))return {id:ramp.id,name:ramp.name,height:72*clamp((560-y)/260),speed:.85};
    const terrace=terraces.find(s=>inside(p,s.box));
    if(terrace)return {...terrace,speed:1};
    return {id:'lower',name:y>790?'南埠村口':x<700?'溪桥中街':x>1050?'东巷 · 村长家':'浣青溪 · 石桥',height:0,speed:1};
  }
  function walkable(x,y) {
    const p={x,y};
    if(x<40||x>1560||y<125||y>965)return false;
    if(polygon(x,y,water)&&!polygon(x,y,bridge))return false;
    const stair=stairs.some(s=>inside(p,s.box));
    if(!stair&&!inside(p,ramp.box)&&((x>=100&&x<=740&&y>302&&y<383)||(x>=950&&x<=1540&&y>302&&y<387)))return false;
    for(const prop of props) {
      if(prop.solid&&polygon(x,y,prop.solid))return false;
      if(prop.trunk&&Math.hypot(x-prop.trunk[0],y-prop.trunk[1])<prop.trunk[2]+10)return false;
    }
    return true;
  }
  function canStep(a,b) {
    const distance=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(distance/7));
    let previous=a;
    for(let i=1;i<=n;i++) {
      const p={x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n};
      if(!walkable(p.x,p.y))return false;
      const delta=Math.abs(surfaceAt(p.x,p.y).height-surfaceAt(previous.x,previous.y).height);
      if(delta>Math.max(4,Math.hypot(p.x-previous.x,p.y-previous.y)*.85))return false;
      previous=p;
    }
    return true;
  }
  const cols=Math.ceil(width/CELL),rows=Math.ceil(height/CELL);
  const center=(x,y)=>({x:x*CELL+CELL/2,y:y*CELL+CELL/2});
  function findPath(from,target) {
    const sx=Math.floor(from.x/CELL),sy=Math.floor(from.y/CELL);
    let tx=Math.floor(target.x/CELL),ty=Math.floor(target.y/CELL);
    const free=(x,y)=>x>=0&&x<cols&&y>=0&&y<rows&&walkable(center(x,y).x,center(x,y).y);
    if(!free(tx,ty)) {
      let best=null;
      for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++) {
        if(!free(tx+x,ty+y))continue;
        const p=center(tx+x,ty+y),d=Math.hypot(p.x-target.x,p.y-target.y);
        if(!best||d<best.d)best={x:tx+x,y:ty+y,d};
      }
      if(!best||best.d>70)return [];
      tx=best.x;ty=best.y;
    }
    const id=(x,y)=>y*cols+x,start=id(sx,sy),end=id(tx,ty),open=[{x:sx,y:sy,g:0,f:0}];
    const came=new Map(),scores=new Map([[start,0]]),closed=new Set();
    while(open.length) {
      open.sort((a,b)=>b.f-a.f);const cur=open.pop(),cid=id(cur.x,cur.y);
      if(closed.has(cid))continue;
      if(cid===end) {
        const result=[];let current=end;
        while(current!==start){result.push(center(current%cols,Math.floor(current/cols)));current=came.get(current);}
        return result.reverse();
      }
      closed.add(cid);
      const currentPoint=cid===start?from:center(cur.x,cur.y);
      for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) {
        const x=cur.x+dx,y=cur.y+dy,nid=id(x,y);
        if(!free(x,y)||closed.has(nid)||!canStep(currentPoint,center(x,y)))continue;
        if(dx&&dy&&(!canStep(currentPoint,center(cur.x+dx,cur.y))||!canStep(currentPoint,center(cur.x,cur.y+dy))))continue;
        const g=cur.g+(dx&&dy?1.414:1)/surfaceAt(center(x,y).x,center(x,y).y).speed;
        if(g>=(scores.get(nid)??Infinity))continue;
        scores.set(nid,g);came.set(nid,cid);open.push({x,y,g,f:g+Math.hypot(tx-x,ty-y)});
      }
    }
    return [];
  }
  const api={width,height,props,stairs,terraces,riverCenter,surfaceAt,walkable,canStep,findPath,
    spawn:{x:552,y:904},elder:{x:1128,y:760,talk:{x:1128,y:792}},trainer:{x:1112,y:249,talk:{x:1128,y:280}},
    assets:{terrain:'assets/maps/terrain.png',inn:'assets/maps/inn.png',training:'assets/town/dojo.png',homes:'assets/maps/homes.png',smithy:'assets/town/smithy-left.png',winehouse:'assets/town/winehouse.png',guesthouse:'assets/town/guesthouse.png',tree:'assets/maps/tree.png',jasmine:'assets/town/jasmine.png',osmanthus:'assets/town/osmanthus.png',lotus:'assets/town/lotus.png'}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.VillageMap=api;
})();
