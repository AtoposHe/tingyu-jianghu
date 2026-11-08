/* Each move owns its pose, timing and hit reaction. Rules stay in combat-rules. */
(() => {
  const clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  const profiles={
    straight:{id:'straight',name:'直拳',duration:1.5,hitAt:.47,color:'#e4bc6a',reaction:'jolt',knockback:7},
    jab:{id:'jab',name:'试探拳',duration:1.28,hitAt:.43,color:'#f5ebce',reaction:'flinch',knockback:4},
    mountain:{id:'mountain',name:'推山掌',duration:2.8,hitAt:.64,color:'#76bcc2',reaction:'knockback',knockback:30},
  };
  function choose(side,action){return profiles[action==='skill'?'mountain':side==='hero'?'straight':'jab'];}
  function sample(profile,p) {
    const hit=profile.hitAt;
    const palm=profile.id==='mountain';
    const arrive=palm ? .52 : .32, retreat=palm ? .76 : .65;
    const travel=p<arrive?smooth((p-(palm ? .29 : 0))/(arrive-(palm ? .29 : 0))):p<retreat?1:1-smooth((p-retreat)/(1-retreat));
    const extension=p<hit?smooth((p-(hit-.14))/.14):1-smooth((p-hit)/.17);
    const charge=palm?(p<.3?smooth(p/.3):1-smooth((p-.3)/.24)):0;
    return {travel,punch:extension,palm:palm?Math.max(extension,charge*.75):0,charge,step:travel};
  }
  const api={profiles,choose,sample};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.BattleMoves=api;
})();
