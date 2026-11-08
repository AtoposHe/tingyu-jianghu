/* Small grid pathfinder shared by new explorable regions. */
(() => {
 function create(width,height,walkable,canStep,cell=20){
  const cols=Math.ceil(width/cell),rows=Math.ceil(height/cell),point=(x,y)=>({x:x*cell+cell/2,y:y*cell+cell/2}),id=(x,y)=>y*cols+x;
  return function findPath(from,target){
   const free=(x,y)=>x>=0&&x<cols&&y>=0&&y<rows&&walkable(point(x,y).x,point(x,y).y);
   const sx=Math.floor(from.x/cell),sy=Math.floor(from.y/cell);let tx=Math.floor(target.x/cell),ty=Math.floor(target.y/cell);
   if(!free(tx,ty)){let best;for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){if(!free(tx+x,ty+y))continue;const p=point(tx+x,ty+y),d=Math.hypot(p.x-target.x,p.y-target.y);if(!best||d<best.d)best={x:tx+x,y:ty+y,d};}if(!best||best.d>70)return [];tx=best.x;ty=best.y;}
   const start=id(sx,sy),end=id(tx,ty),open=[{x:sx,y:sy,g:0,f:0}],scores=new Map([[start,0]]),came=new Map(),closed=new Set();
   while(open.length){open.sort((a,b)=>b.f-a.f);const cur=open.pop(),cid=id(cur.x,cur.y);if(closed.has(cid))continue;
    if(cid===end){const out=[];let at=end;while(at!==start){out.push(point(at%cols,Math.floor(at/cols)));at=came.get(at);}return out.reverse();}
    closed.add(cid);const p=cid===start?from:point(cur.x,cur.y);
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=cur.x+dx,y=cur.y+dy,n=id(x,y);if(!free(x,y)||closed.has(n)||!canStep(p,point(x,y)))continue;if(dx&&dy&&(!canStep(p,point(cur.x+dx,cur.y))||!canStep(p,point(cur.x,cur.y+dy))))continue;const g=cur.g+(dx&&dy?1.414:1);if(g>=(scores.get(n)??Infinity))continue;scores.set(n,g);came.set(n,cid);open.push({x,y,g,f:g+Math.hypot(tx-x,ty-y)});}
   }return [];
  };
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.GridNavigation=api;
})();
