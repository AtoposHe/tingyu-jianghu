/* Independent weapon PNGs follow calibrated hand anchors, preserving reusable character bodies. */
(() => {
  const data=typeof module!=='undefined'&&module.exports?require('./weapon-art.js'):globalThis.WeaponArt;
  const sprites=typeof module!=='undefined'&&module.exports?require('./sprites.js'):globalThis.QSprites;
  const images={},loads={};
  const grips={heroIdle:[856,567],heroWindup:[882,591],heroAttack:[1060,525],heroHit:[660,600],slash:[1010,743],
    heroRun0:[310,222],heroRun1:[740,265],heroRun2:[1183,198],heroRun3:[1638,183],heroRun4:[323,687],heroRun5:[744,705],heroRun6:[1180,653],heroRun7:[1655,640]};
  const weaponSpec={wood:{grip:[512,1390],length:145},qingfeng:{grip:[362,1870],length:172},steel:{grip:[362,1870],length:184}};
  function load(){return Promise.all(Object.keys(data).filter(id=>id!=='smith').map(id=>{
    if(!loads[id])loads[id]=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[id]=img;resolve(img);};img.onerror=()=>reject(Error(data[id].src));img.src=data[id].src;});return loads[id];
  }));}
  function pose(key,height){const frame=data[key]||sprites.data[key],[sx,sy,sw,sh]=frame.box,scale=height/(frame.referenceHeight||sh),grip=grips[key]||grips.heroIdle;
    return {frame,scale,sx,sy,sw,sh,dx:(sx-frame.anchor[0])*scale,dy:(sy-frame.anchor[1])*scale,dw:sw*scale,dh:sh*scale,x:(grip[0]-frame.anchor[0])*scale,y:(grip[1]-frame.anchor[1])*scale,grip};}
  function slashAngle(p,hitAt=.53){const t=Math.max(0,Math.min(1,(p-(hitAt-.2))/.4));return -.8+3*t;}
  function drawHero(c,key,height,id,options={}){
    if(!weaponSpec[id]||!images[id]?.complete)return sprites.draw(c,key,height);
    let body=key==='heroHit'?'heroIdle':key;
    if(options.slashing)body=options.progress<options.hitAt-.14?'heroWindup':options.progress<options.hitAt+.25?'slash':'heroIdle';
    if(body==='heroIdle'&&images['idle_'+id]?.complete){const g=pose('idle_'+id,height);c.drawImage(images['idle_'+id],g.sx,g.sy,g.sw,g.sh,g.dx,g.dy,g.dw,g.dh);return true;}
    const g=pose(body,height),image=body==='slash'?images.slash:null;
    if(body==='slash'&&image?.complete)c.drawImage(image,g.sx,g.sy,g.sw,g.sh,g.dx,g.dy,g.dw,g.dh);else sprites.draw(c,body,height);
    const spec=weaponSpec[id],w=data[id],scale=spec.length/w.box[3]*height/275;
    const angle=options.slashing?slashAngle(options.progress,options.hitAt):body.startsWith('heroRun') ? .65 : .4;
    c.save();c.translate(g.x,g.y);c.rotate(angle);c.drawImage(images[id],-spec.grip[0]*scale,-spec.grip[1]*scale,w.size[0]*scale,w.size[1]*scale);c.restore();
    // Paint the fingers over the hilt, so a sword is held rather than floating over a fist.
    const source=body==='slash'?images.slash:null;
    if(source?.complete)c.drawImage(source,g.grip[0]-34,g.grip[1]-29,68,62,g.x-34*g.scale,g.y-29*g.scale,68*g.scale,62*g.scale);
    else if(sprites.drawPatch)sprites.drawPatch(c,body,g.grip[0]-30,g.grip[1]-25,60,55,height);
    return true;
  }
  const api={load,drawHero,pose,slashAngle,grips,weaponSpec,data};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.WeaponSprites=api;
})();
