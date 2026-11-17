/* Ver.1.4.0: bounded world coordinates, follow camera and presentation only.
 * No account/save schema changes. Gacha results are committed before animation.
 */
const ARENA_THEMES = [
    {id:'fire',name:'溶岩の砦',color:'#ff9e61'},
    {id:'ice',name:'氷晶の湖',color:'#9ceaff'},
    {id:'forest',name:'古樹の聖域',color:'#a3e59b'},
    {id:'dark',name:'深淵の祭壇',color:'#c29cff'},
    {id:'thunder',name:'雷霆の神殿',color:'#ffe899'},
    {id:'sand',name:'砂帝の遺跡',color:'#f4d18e'},
    {id:'abyss',name:'沈没した王都',color:'#77d9e4'},
    {id:'moon',name:'月蝕の庭',color:'#dec9ff'},
    {id:'phoenix',name:'虹翼の天宮',color:'#ffe3a1'}
];
let worldWidth=0,worldHeight=0,cameraX=0,cameraY=0;
let worldMouse=null, worldTheme=0, worldBannerTimer=null;
let visualParticles=[];
function getViewportSize(){return {width:gameArea.clientWidth||window.innerWidth,height:gameArea.clientHeight||window.innerHeight};}
function worldBounds(){const v=getViewportSize();return {width:worldWidth||v.width,height:worldHeight||v.height};}
function worldVisibleBounds(margin=0){
    const v=getViewportSize(),w=worldBounds();
    const mx=Math.min(margin,v.width/4),my=Math.min(margin,v.height/4);
    return {left:cameraX+mx,right:Math.min(w.width,cameraX+v.width)-mx,
        top:cameraY+my,bottom:Math.min(w.height,cameraY+v.height)-my};
}
function prepareWorldWave(){
    const v=getViewportSize();
    worldWidth=Math.round(Math.max(v.width,Math.min(2800,Math.max(1200,v.width*1.65))));
    worldHeight=Math.round(Math.max(v.height,Math.min(2200,Math.max(1000,v.height*1.65))));
    worldLayer.style.width=worldWidth+'px';worldLayer.style.height=worldHeight+'px';
    worldMouse=null;
    clearWorldEffects();
    setWorldTheme((currentWave-1)%ARENA_THEMES.length);
    document.getElementById('wave-stage-name').textContent=ARENA_THEMES[worldTheme].name+' ／ 第'+Math.ceil(currentWave/10)+'章';
}
function setWorldTheme(index,boss=false){
    worldTheme=Math.max(0,index);
    const theme=ARENA_THEMES[worldTheme];
    const map=document.getElementById('world-map');
    map.style.backgroundPosition=`${worldTheme%3*50}% ${Math.floor(worldTheme/3)*50}%`;
    if(!reducedEffects()){map.classList.remove('map-arrive');void map.offsetWidth;map.classList.add('map-arrive');}
    gameArea.style.setProperty('--stage-color',theme.color);
    gameArea.classList.toggle('world-boss',boss);
    document.getElementById('stage-location').textContent=`${theme.name} · WAVE ${currentWave}`;
}
function worldBossTheme(boss){
    const info=getBossType(boss);
    setWorldTheme(ARENA_THEMES.findIndex(t=>t.id===info.id),true);
    gameArea.classList.toggle('world-awakened',boss.bossPhase===2);
}
function updateWorldCamera(){
    const v=getViewportSize(),w=worldBounds();
    cameraX=Math.max(0,Math.min(w.width-v.width,playerX-v.width/2));
    cameraY=Math.max(0,Math.min(w.height-v.height,playerY-v.height/2));
    worldLayer.style.transform=`translate3d(${-cameraX}px,${-cameraY}px,0)`;
    const marker=document.getElementById('map-player');
    marker.style.left=(playerX/w.width*100)+'%';marker.style.top=(playerY/w.height*100)+'%';
    const box=document.getElementById('map-viewport');
    box.style.left=(cameraX/w.width*100)+'%';box.style.top=(cameraY/w.height*100)+'%';
    box.style.width=(Math.min(1,v.width/w.width)*100)+'%';box.style.height=(Math.min(1,v.height/w.height)*100)+'%';
    const boss=enemies.find(e=>e.type==='boss');
    const pin=document.getElementById('map-boss');pin.hidden=!boss;
    if(boss){pin.style.left=(boss.x/w.width*100)+'%';pin.style.top=(boss.y/w.height*100)+'%';}
}
function worldPointerTarget(){
    if(!worldMouse)return;
    mouseX=cameraX+worldMouse.x;mouseY=cameraY+worldMouse.y;
}
function worldMovePlayer(factor){
    worldPointerTarget();
    const dx=mouseX-playerX,dy=mouseY-playerY,dist=Math.hypot(dx,dy);
    if(dist<.25)return;
    // Keep upgrades meaningful without teleporting across the large map.
    const step=Math.min(dist,dist*factor,Math.min(18,4+factor*35));
    playerX+=dx/dist*step;playerY+=dy/dist*step;
}
function resizeWorld(){
    if(!worldWidth)return;
    const v=getViewportSize();
    worldWidth=Math.max(worldWidth,v.width);worldHeight=Math.max(worldHeight,v.height);
    worldLayer.style.width=worldWidth+'px';worldLayer.style.height=worldHeight+'px';
    clampPlayerPosition();updateWorldCamera();
}
function worldSpawnPosition(){
    const b=worldVisibleBounds(25),points=[];
    for(let i=0;i<12;i++){
        const horizontal=i%2===0;
        points.push(horizontal?{x:i%4===0?b.left:b.right,y:b.top+Math.random()*(b.bottom-b.top)}:
            {x:b.left+Math.random()*(b.right-b.left),y:i%4===1?b.top:b.bottom});
    }
    // Candidates are inside the finite map and far from the player, even at a corner.
    const distance=p=>Math.hypot(p.x-playerX,p.y-playerY);
    const safe=points.filter(p=>distance(p)>=Math.min(260,getViewportSize().width*.5));
    return safe.length?safe[Math.floor(Math.random()*safe.length)]:points.reduce((a,b)=>distance(a)>distance(b)?a:b);
}
function clampWorldEnemy(enemy){
    const w=worldBounds(),m=enemy.type==='boss'?65:24;
    enemy.x=Math.max(m,Math.min(w.width-m,enemy.x));enemy.y=Math.max(m,Math.min(w.height-m,enemy.y));
}
function reducedEffects(){return liteMode || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
function worldBurst(x,y,color='#ffd88b',large=false){
    if(reducedEffects())return;
    const count=large?16:5,now=gameNow();
    for(let i=0;i<count && visualParticles.length<64;i++){
        const element=document.createElement('i');element.className='world-spark';element.style.background=color;
        worldLayer.appendChild(element);
        const angle=i*Math.PI*2/count;
        visualParticles.push({element,x,y,vx:Math.cos(angle)*(large?3:1.7),vy:Math.sin(angle)*(large?3:1.7),born:now,life:large?650:300});
    }
}
function worldPulse(x,y,color,radius){
    if(reducedEffects())return;
    const element=document.createElement('div');element.className='world-pulse world-transient';
    element.style.left=x+'px';element.style.top=y+'px';element.style.borderColor=color;
    element.style.width=radius*2+'px';element.style.height=radius*2+'px';worldLayer.appendChild(element);
    gameSetTimeout(()=>element.remove(),750);
}
function updateWorldEffects(){
    const now=gameNow();
    for(let i=visualParticles.length-1;i>=0;i--){
        const p=visualParticles[i],age=now-p.born;
        if(age>=p.life||reducedEffects()){p.element.remove();visualParticles.splice(i,1);continue;}
        p.x+=p.vx;p.y+=p.vy;
        p.element.style.transform=`translate(${p.x}px,${p.y}px)`;p.element.style.opacity=1-age/p.life;
    }
}
function clearWorldEffects(){
    visualParticles.forEach(p=>p.element.remove());visualParticles=[];
    if(worldBannerTimer!=null)clearTimeout(worldBannerTimer);worldBannerTimer=null;
    document.getElementById('world-banner').classList.remove('visible');
    worldLayer.querySelectorAll('.world-transient').forEach(el=>el.remove());
    gameArea.classList.remove('world-awakened');
}
function worldBanner(title,subtitle){
    const box=document.getElementById('world-banner');
    document.getElementById('world-banner-title').textContent=title;
    document.getElementById('world-banner-subtitle').textContent=subtitle;
    box.classList.remove('visible');void box.offsetWidth;box.classList.add('visible');
    if(worldBannerTimer!=null)clearTimeout(worldBannerTimer);
    worldBannerTimer=setTimeout(()=>box.classList.remove('visible'),1900);
}

let gachaBusy=false,gachaPresentation=null,gachaTimers=[];
function summonEquipment(count){
    if(gachaBusy)return;
    void window.GameAudio?.unlock?.();
    startGachaPresentation(equipmentRoll(count));
}
function gachaLater(fn,ms){const id=setTimeout(()=>{gachaTimers=gachaTimers.filter(t=>t!==id);fn();},ms);gachaTimers.push(id);}
function clearGachaTimers(){gachaTimers.forEach(clearTimeout);gachaTimers=[];}
function gachaChest(element,grade,open=false){
    element.style.backgroundPosition=`${(grade-1)*25}% ${open?100:0}%`;
}
function renderGachaCards(results,animated=false){
    const area=document.getElementById('gacha-reveal-cards');area.replaceChildren();
    results.forEach((item,index)=>{
        const card=document.createElement('article');card.className='gacha-reveal-card'+(animated?' reveal-animated':'');
        card.style.setProperty('--rarity',EQ_COLORS[item.grade-1]);card.style.animationDelay=(index*.08)+'s';
        const tag=document.createElement('strong');tag.textContent=EQ_GRADES[item.grade-1];card.appendChild(tag);
        card.appendChild(equipmentIcon(item.slot,item.grade));appendEqText(card,equipmentName(item));
        appendEqText(card,equipmentAffixText(item),'equipment-affixes');area.appendChild(card);
    });
}
function revealGachaResults(){
    if(!gachaPresentation||gachaPresentation.revealed)return;
    clearGachaTimers();gachaPresentation.revealed=true;
    const {results,grade}=gachaPresentation;
    const scene=document.getElementById('gacha-scene');scene.classList.add('is-open');
    gachaChest(document.getElementById('gacha-chest'),grade,true);
    document.getElementById('gacha-heading').textContent=grade===5?'UR · 伝説の装備！':grade===4?'SSR · 希少な輝き！':'召喚成功！';
    document.getElementById('gacha-description').textContent=results.length+'個の装備を獲得しました。ボックスに保存済みです。';
    const mythic=results.some(i=>i.skills.some(id=>EQ_AFFIXES[id].tier===2));
    document.getElementById('gacha-mythic').hidden=!mythic;
    renderGachaCards(results,!reducedEffects());
    document.getElementById('gacha-reveal-cards').hidden=false;
    document.getElementById('gacha-open').hidden=true;
    document.getElementById('gacha-skip').hidden=true;
    document.getElementById('gacha-done').hidden=false;
    document.getElementById('gacha-done').focus();
    playSound(grade>=5?'gacha_legend':grade>=3?'gacha_rare':'gacha_open',.5);
}
function finishGachaPresentation(){
    clearGachaTimers();gachaBusy=false;gachaPresentation=null;
    const dialog=document.getElementById('gacha-dialog');if(dialog.open)dialog.close();
    renderEquipment();
}
function startGachaPresentation(results){
    if(!results.length)return;
    gachaBusy=true;
    const grade=Math.max(...results.map(i=>i.grade));
    gachaPresentation={results,grade,revealed:false};
    const dialog=document.getElementById('gacha-dialog'),scene=document.getElementById('gacha-scene');
    scene.className='gacha-scene grade-'+grade;
    scene.style.setProperty('--rarity',EQ_COLORS[grade-1]);
    scene.classList.toggle('calm',reducedEffects());
    gachaChest(document.getElementById('gacha-chest'),grade);
    document.getElementById('gacha-heading').textContent='宝箱が現れた！';
    document.getElementById('gacha-description').textContent='宝箱を開いて装備を確認しよう。';
    document.getElementById('gacha-reveal-cards').replaceChildren();document.getElementById('gacha-reveal-cards').hidden=true;
    document.getElementById('gacha-mythic').hidden=true;
    document.getElementById('gacha-open').hidden=false;document.getElementById('gacha-open').disabled=false;
    document.getElementById('gacha-skip').hidden=false;document.getElementById('gacha-done').hidden=true;
    try{dialog.showModal();renderEquipment();playSound('gacha_charge',.4);}
    catch(error){gachaBusy=false;gachaPresentation=null;renderEquipment();return;}
    if(reducedEffects())revealGachaResults();
}
function openGachaChest(){
    if(!gachaPresentation||gachaPresentation.revealed||gachaTimers.length)return;
    document.getElementById('gacha-open').disabled=true;
    document.getElementById('gacha-scene').classList.add('is-charging');
    playSound('gacha_charge',.45);
    gachaLater(revealGachaResults,reducedEffects()?0:950);
}
function initPresentation(){
    document.getElementById('gacha-open').addEventListener('click',openGachaChest);
    document.getElementById('gacha-skip').addEventListener('click',revealGachaResults);
    document.getElementById('gacha-done').addEventListener('click',finishGachaPresentation);
    const dialog=document.getElementById('gacha-dialog');
    dialog.addEventListener('cancel',event=>{event.preventDefault();if(gachaPresentation?.revealed)finishGachaPresentation();else revealGachaResults();});
    dialog.addEventListener('close',()=>{clearGachaTimers();gachaBusy=false;gachaPresentation=null;renderEquipment();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&gachaPresentation)revealGachaResults();});
    gameArea.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){worldMouse=null;mouseX=playerX;mouseY=playerY;}});
    window.addEventListener('resize',resizeWorld);
}
