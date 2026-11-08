/* Shared painted VFX renderer. Animation is deterministic and uses no timers. */
(() => {
  'use strict';
  const clamp=n=>Math.min(1,Math.max(0,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  function sample(p,hitAt=.64) {
    const impactTime=(p-hitAt)/(1-hitAt);
    return {
      charge:smooth(p/.18)*(1-smooth((p-.36)/.14)),
      launch:smooth((p-.43)/(hitAt-.43)),
      wave:p<.38?0:smooth((p-.38)/.06)*(1-smooth((p-hitAt)/.14)),
      impact:p<hitAt?0:(1-smooth(impactTime/.92)),
      impactTime:clamp(impactTime),
      dim:Math.sin(clamp(p)*Math.PI)*.17,
    };
  }
  class BattleFX {
    constructor() {
      this.images={};
      this.reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.ready=Promise.all([['wave','assets/fx/palm-wave.png'],['impact','assets/fx/palm-impact.png']].map(([key,src])=>new Promise((resolve,reject)=>{
        const image=new Image();this.images[key]=image;image.onload=resolve;image.onerror=()=>reject(new Error(`特效素材加载失败：${src}`));image.src=src;
      })));
      // Drawn ribbons and rings remain available if a painted asset fails.
      this.ready.catch(()=>{});
    }
    shake(p,hitAt) {
      if(this.reducedMotion)return {x:0,y:0};
      const t=(p-hitAt)/.16,envelope=t>=0&&t<=1?Math.pow(1-t,2):0;
      return {x:Math.sin(t*53)*5*envelope,y:Math.cos(t*39)*2.8*envelope};
    }
    background(c,{p,hitAt,pos,w,h,time}) {
      const a=sample(p,hitAt),s=pos.scale,point=pos.enemy;
      c.save();c.fillStyle=`rgba(22,53,49,${a.dim})`;c.fillRect(0,0,w,h);
      if(a.charge>.01) {
        const spin=this.reducedMotion?0:time*.6;
        c.translate(point.x,point.y);c.scale(s,s);c.globalAlpha=a.charge;
        const glow=c.createRadialGradient(0,-100,8,0,-100,130);glow.addColorStop(0,'#eddb8f55');glow.addColorStop(.5,'#60b9ab22');glow.addColorStop(1,'#60b9ab00');
        c.fillStyle=glow;c.fillRect(-150,-250,300,270);
        for(let ring=0;ring<3;ring++) {
          c.strokeStyle=ring%2?'#c4f3d5':'#e0bb62';c.lineWidth=ring===0?2.4:1.1;
          c.beginPath();c.ellipse(0,0,64+ring*13,16+ring*4,0,0,Math.PI*2);c.stroke();
        }
        for(let i=0;i<12;i++) {
          const angle=i*Math.PI/6+spin,x=Math.cos(angle)*83,y=Math.sin(angle)*21;
          c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle=i%2?'#e3c16f':'#b3e8c8';c.fillRect(-2,-2,4,4);c.restore();
        }
      }
      c.restore();
    }
    foreground(c,{p,hitAt,actor,target,dir,s,time,w,h}) {
      const a=sample(p,hitAt),hand={x:actor.x+dir*72*s,y:actor.y-138*s};
      if(a.charge>.01) {
        c.save();c.translate(actor.x,actor.y-132*s);c.scale(s,s);c.globalAlpha=a.charge*.85;
        const spin=this.reducedMotion?0:time;
        for(let j=0;j<3;j++) {
          c.save();c.rotate(j*1.04+spin*(j%2?-.45:.6));
          c.strokeStyle=j%2?'#bbeed2':'#e6c16b';c.lineWidth=j===0?2.3:1.3;
          c.beginPath();c.ellipse(0,0,44+j*9,72+j*10,0,Math.PI*.13,Math.PI*1.78);c.stroke();c.restore();
        }
        // Fine motes converge rather than sitting in a static halo.
        for(let i=0;i<23;i++) {
          const t=(i*.173+p*2.6)%1,angle=i*2.399+spin*.2,r=118-t*83;
          const x=Math.cos(angle)*r,y=Math.sin(angle)*r*.8;
          c.globalAlpha=a.charge*Math.sin(t*Math.PI);c.fillStyle=i%3?'#eed28b':'#b2e8cf';
          c.save();c.translate(x,y);c.rotate(angle);c.fillRect(-3,-1.1,6,2.2);c.restore();
        }
        c.restore();
      }
      if(a.wave>.01) {
        const x=hand.x+(target.x-dir*18*s-hand.x)*a.launch;
        const y=hand.y+(target.y-139*s-hand.y)*a.launch-Math.sin(a.launch*Math.PI)*12*s;
        c.save();c.globalAlpha=a.wave*.6;c.lineCap='round';
        for(let j=0;j<4;j++) {
          c.beginPath();c.moveTo(hand.x,hand.y+(j-1.5)*11*s);
          c.bezierCurveTo(hand.x+(x-hand.x)*.32,hand.y+(j-1.5)*26*s,
            hand.x+(x-hand.x)*.72,y+(j-1.5)*18*s,x,y+(j-1.5)*5*s);
          c.strokeStyle=j%2?'#efd497':'#65c6b7';c.lineWidth=(j%2?3:10)*s;c.stroke();
        }
        c.restore();
        const width=(185+a.launch*85)*s,height=width*2/3;
        c.save();c.translate(x,y);c.scale(dir,1);c.globalAlpha=a.wave;
        const image=this.images.wave;
        if(image?.complete&&image.naturalWidth)c.drawImage(image,-width*.67,-height*.52,width,height);
        else {c.strokeStyle='#e4cb8a';c.lineWidth=5;c.beginPath();c.ellipse(0,0,30*s,65*s,0,-Math.PI/2,Math.PI/2);c.stroke();}
        c.restore();
      }
      if(a.impact>.01) {
        const t=a.impactTime,eased=1-Math.pow(1-t,3),size=(130+145*eased)*s;
        const x=target.x-dir*9*s,y=target.y-137*s;
        c.save();
        if(!this.reducedMotion&&t<.12){c.fillStyle=`rgba(255,246,209,${(1-t/.12)*.13})`;c.fillRect(0,0,w,h);}
        c.translate(x,y);c.globalAlpha=a.impact;
        const image=this.images.impact;
        if(image?.complete&&image.naturalWidth)c.drawImage(image,-size/2,-size/2,size,size);
        for(let ring=0;ring<2;ring++) {
          c.strokeStyle=ring?'#b7ead0':'#ecc778';c.lineWidth=(2-ring*.7)*s;
          c.beginPath();c.ellipse(0,0,(32+eased*96+ring*12)*s,(32+eased*96+ring*12)*s,0,.2+ring,5.8+ring);c.stroke();
        }
        c.restore();
        c.save();c.globalAlpha=a.impact*.8;
        c.strokeStyle='#d5b76c';c.lineWidth=2*s;c.beginPath();c.ellipse(target.x,target.y+1,(25+eased*132)*s,(6+eased*24)*s,0,0,Math.PI*2);c.stroke();
        for(let i=0;i<28;i++) {
          const angle=i*2.399,r=(20+t*(100+(i%5)*14))*s;
          const px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r*.72+t*t*35*s;
          c.save();c.translate(px,py);c.rotate(angle+t*3);c.fillStyle=i%3?'#dfc075':'#89cbb4';
          c.fillRect(-2*s,-(2+i%3)*s,4*s,(4+i%3*2)*s);c.restore();
        }
        c.restore();
      }
    }
  }
  BattleFX.sample=sample;
  if(typeof module!=='undefined'&&module.exports)module.exports=BattleFX;else window.BattleFX=BattleFX;
})();
