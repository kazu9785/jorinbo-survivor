/* Visuals only: damage, range and cooldown remain in script.js. */
const SKILL_VISUAL_COLORS={sphere:'#52efff',bomb:'#ffae42',energy:'#dc70ff',satellite:'#80dfff'};
function skillVisualNode(kind,x,y,size,life,extra='') {
    if(worldLayer.querySelectorAll('.skill-cast-visual').length>=12)return null;
    const el=document.createElement('div');
    el.className=`skill-cast-visual world-transient skill-cast-${kind} ${extra}`;
    el.setAttribute('aria-hidden','true');
    el.style.setProperty('--skill-color',SKILL_VISUAL_COLORS[kind]);
    Object.assign(el.style,{left:x+'px',top:y+'px',width:size+'px',height:size+'px'});
    worldLayer.appendChild(el);
    gameSetTimeout(()=>el.remove(),life);
    return el;
}
function skillCastVisual(kind) {
    if(!Object.hasOwn(SKILL_VISUAL_COLORS,kind))return;
    const quiet=reducedEffects();
    const sizes={sphere:220,bomb:310,energy:330,satellite:150};
    const el=skillVisualNode(kind,playerX,playerY,quiet?88:sizes[kind],quiet?400:({sphere:800,bomb:1650,energy:2050,satellite:1850}[kind]),quiet?'skill-cast-quiet':'');
    if(!el)return;
    const art=document.createElement('div');art.className='skill-cast-art';
    art.style.backgroundImage=`url("${gameAssetUrl('skill_'+kind+'.png?v=1.9.3')}")`;
    el.appendChild(art);
    if(!quiet){
        for(let i=0;i<(kind==='energy'?3:1);i++){
            const ring=document.createElement('i');ring.className='skill-cast-ring';
            ring.style.animationDelay=(i*90)+'ms';el.appendChild(ring);
        }
    }
}
function skillSatelliteImpact(x,y) {
    if(reducedEffects())return;
    const el=skillVisualNode('satellite',x,y,110,1650,'skill-target-impact');
    if(!el)return;
    const beam=document.createElement('i');beam.className='skill-laser-column';
    el.appendChild(beam);
    const ring=document.createElement('i');ring.className='skill-cast-ring';el.appendChild(ring);
}
