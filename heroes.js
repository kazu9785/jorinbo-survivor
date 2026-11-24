/* Five heroes. Existing equipment slots and old leaderboard offsets remain stable. */
const HERO_IDS=['rookie','balance','power','speed','tank'];
const HERO_COSTS={rookie:0,balance:800,power:1200,speed:1200,tank:1500};
function validRoster(r){return !!r&&r.version===1&&Object.keys(r).every(k=>['version','owned'].includes(k))&&Array.isArray(r.owned)&&r.owned.includes('rookie')&&r.owned.length<=5&&new Set(r.owned).size===r.owned.length&&r.owned.every(id=>HERO_IDS.includes(id));}
function packRoster(r){return r.owned.reduce((bits,id)=>bits|(1<<HERO_IDS.indexOf(id)),0);}
function repairRoster(r,legacy=false){if(Number.isInteger(r)&&r>=1&&r<=31&&(r&1))return {version:1,owned:HERO_IDS.filter((id,i)=>r&(1<<i))};return validRoster(r)?{version:1,owned:[...r.owned]}:{version:1,owned:['rookie']};}
function heroOwned(id){return gameData.roster?.owned.includes(id)===true;}
function heroEquipmentCharacter(){return gameData.character==='rookie'?'balance':gameData.character;}
function heroPurchase(id){
 if(!canEditTraining()||!HERO_IDS.includes(id)||heroOwned(id))return false;
 const cost=HERO_COSTS[id];if(gameData.coins<cost)return false;
 if(!confirm(CHARACTERS[id].name+'を '+cost+' Gで解放しますか？\n解放後はいつでも切り替えられます。'))return false;
 gameData.coins-=cost;gameData.roster.owned.push(id);saveData();updateCoinDisplays();return true;
}
let heroFacing=0,heroShotUntil=0,heroHurtUntil=0,heroShots=0,heroAttackAngle=0,heroLastAwakened=-Infinity;
function heroResetCombat(){heroFacing=0;heroShots=0;heroShotUntil=0;heroHurtUntil=0;heroLastAwakened=gameNow();heroSetPose();document.querySelectorAll('.hero-fx').forEach(e=>e.remove());}
// Wardrobe art is cached once per page and follows the game's manual-update token.
const HERO_ART_VERSION = '1.9.5';
const heroArtUrls = new Map();
function heroArtBackground(file) {
    if (!heroArtUrls.has(file)) {
        const src = gameAssetUrl(file + '?v=' + HERO_ART_VERSION);
        heroArtUrls.set(file, 'url("' + src + '")');
    }
    return heroArtUrls.get(file);
}
const HERO_MOTION_FRAMES={"rookie":{"size":[1254,1254],"frames":[[92,46,114,256,47.8],[325,46,112,257,48.7],[588,47,57,256,49.1],[814,47,99,256,46.0],[1056,48,112,255,50.4],[75,323,127,244,52.0],[308,322,133,245,49.6],[529,324,174,240,49.7],[797,324,126,242,40.9],[1055,325,132,240,38.8],[89,577,114,231,52.6],[317,576,122,232,50.8],[580,578,89,228,35.0],[808,578,112,229,35.3],[1058,578,122,230,38.9],[79,816,122,224,50.8],[312,814,133,225,51.5],[529,819,174,219,50.3],[790,818,143,221,44.8],[1060,818,120,221,45.8],[65,1053,143,193,49.7],[287,1053,151,193,47.4],[491,1056,191,190,45.8],[744,1055,191,190,49.5],[1026,1054,169,191,49.7]]},"balance":{"size":[1254,1254],"frames":[[68,11,144,256,46.9],[309,10,144,257,45.8],[564,11,81,256,56.8],[798,11,122,256,49.2],[1047,10,133,257,53.0],[59,276,135,241,57.0],[299,276,142,242,51.1],[533,279,170,237,50.0],[798,279,138,237,38.8],[1058,278,138,237,39.9],[76,524,118,229,55.9],[306,524,136,230,53.3],[565,525,104,229,44.7],[797,526,130,227,37.7],[1059,526,126,227,42.9],[67,759,127,233,54.7],[305,759,139,232,52.5],[531,763,168,226,49.4],[783,762,154,231,41.6],[1060,762,126,231,45.2],[43,1004,160,241,48.1],[268,1005,186,240,40.6],[470,1009,251,236,38.8],[735,1010,217,235,48.2],[1028,1010,183,233,50.0]]},"power":{"size":[1254,1254],"frames":[[74,11,132,241,50.8],[311,11,127,241,53.1],[550,11,104,241,46.2],[785,10,118,243,47.9],[1031,11,125,242,49.2],[72,258,141,240,39.8],[313,260,136,235,39.3],[531,259,135,232,52.2],[764,261,141,232,51.4],[1029,261,126,236,63.5],[75,506,130,232,37.7],[313,508,126,230,39.3],[532,507,123,232,60.6],[771,507,133,232,60.2],[1030,508,122,231,65.2],[75,750,137,234,33.6],[309,750,141,229,38.1],[522,751,135,232,62.6],[772,750,133,233,54.9],[1019,751,135,233,66.3],[56,998,165,235,51.8],[289,999,158,234,60.8],[487,1004,230,228,38.3],[727,1004,227,227,43.2],[1002,1001,176,231,46.0]]},"speed":{"size":[1254,1254],"frames":[[87,10,126,266,45.6],[309,9,122,267,49.7],[548,10,115,267,45.7],[791,9,116,267,53.4],[1030,10,114,264,54.8],[86,282,127,261,45.3],[302,282,133,261,48.5],[525,283,161,259,49.4],[771,282,141,261,58.5],[1033,281,117,261,52.1],[92,547,113,244,42.9],[315,546,112,244,42.9],[544,546,117,243,38.9],[776,547,124,243,54.8],[1042,546,100,243,52.0],[90,794,117,238,42.3],[313,794,120,239,47.9],[529,794,151,238,49.0],[778,794,128,238,57.8],[1035,794,109,238,55.0],[71,1038,144,212,49.7],[295,1038,149,214,45.6],[512,1039,180,213,43.3],[758,1039,159,213,44.3],[1010,1038,158,213,49.7]]},"tank":{"size":[1254,1254],"frames":[[65,9,154,245,52.5],[309,8,150,246,49.3],[574,9,97,245,41.2],[799,9,132,244,48.9],[1036,9,151,244,45.7],[52,260,170,246,53.8],[299,260,161,245,52.2],[544,262,162,243,49.4],[790,260,156,246,45.8],[1034,260,159,246,48.1],[67,511,148,238,47.3],[317,510,142,238,56.7],[575,511,104,237,34.1],[796,512,138,236,34.4],[1037,513,155,235,51.3],[60,754,156,239,56.1],[298,754,161,239,54.4],[536,755,169,233,49.4],[797,756,152,237,39.1],[1034,756,155,237,44.9],[45,999,178,248,59.0],[292,994,180,254,44.7],[505,997,205,249,50.0],[758,1005,195,240,40.5],[1021,1003,186,242,52.7]]}};
let heroMotionPhase=0,heroMotionLast=null,heroMotionKey='',heroMotionChanged=0,heroMotionPrevious=null;
function heroDirection(dx,dy){return (Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8;}
function heroDirectionSprite(direction){return {column:direction<=4?direction:8-direction,flip:direction>4};}
function heroMotionLayer(id){
 let layer=document.getElementById(id);if(!layer){layer=document.createElement('div');layer.id=id;layer.className='hero-motion-layer';player.appendChild(layer);}return layer;
}
function heroDrawHeight(row){return row===4?80:88;}
function heroPaintFrame(el,frame,bob,lean,recoil,opacity){
 const atlas=HERO_MOTION_FRAMES[frame.id],box=atlas.frames[frame.row*5+frame.column];
 const height=heroDrawHeight(frame.row),scale=height/box[3];
 Object.assign(el.style,{width:box[2]*scale+'px',height:height+'px',backgroundImage:heroArtBackground('motion_'+frame.id+'.png'),backgroundSize:`${atlas.size[0]*scale}px ${atlas.size[1]*scale}px`,backgroundPosition:`${-box[0]*scale}px ${-box[1]*scale}px`,opacity:String(opacity),transformOrigin:`${box[4]}% 90%`,transform:`translate(${-box[4]}%,-100%) translate(${recoil.x}px,${30+bob+recoil.y}px) rotate(${lean}deg) scaleX(${frame.flip?-1:1})`});
 el.classList.toggle('hero-hurt',gameNow()<heroHurtUntil);
}
function heroDrawMotion(row,direction,bob=0,lean=0,recoil={x:0,y:0}){
 const now=gameNow(),d=heroDirectionSprite(direction),frame={id:gameData.character,row,...d},key=[frame.id,row,d.column,d.flip].join(':');
 const current=heroMotionLayer('hero-sprite'),previous=heroMotionLayer('hero-sprite-previous');
 if(key!==heroMotionKey){heroMotionPrevious=heroMotionCurrent;heroMotionCurrent=frame;heroMotionKey=key;heroMotionChanged=now;}
 const blend=reducedEffects()?1:Math.min(1,(now-heroMotionChanged)/55);
 if(heroMotionPrevious&&blend<1){heroPaintFrame(previous,heroMotionPrevious,bob,lean,recoil,1-blend);heroPaintFrame(current,frame,bob,lean,recoil,blend);}else{previous.style.opacity='0';heroPaintFrame(current,frame,bob,lean,recoil,1);}
 // During the short crossfade use the more visible sprite, not the union of two poses.
 hitTrackHero(heroMotionPrevious&&blend<.5?heroMotionPrevious:frame,bob,lean,recoil);
}
let heroMotionCurrent=null;
function heroSetPose(){heroMotionKey='';heroMotionCurrent=null;heroMotionPrevious=null;heroMotionLast=null;heroMotionPhase=0;heroDrawMotion(0,0);}
function heroUpdateMotion(x,y){
 const now=gameNow(),dt=heroMotionLast===null?0:Math.max(0,Math.min(50,now-heroMotionLast));heroMotionLast=now;
 const dx=playerX-x,dy=playerY-y,distance=Math.hypot(dx,dy),moving=distance>.15,quiet=reducedEffects();
 if(moving){heroFacing=heroDirection(dx,dy);heroMotionPhase+=(dt/1000)*Math.min(2.8,1.5+distance*.12)*Math.PI*2;}
 const phase=heroMotionPhase%(Math.PI*2),walk=[1,2,3,2][Math.floor(phase/(Math.PI/2))%4];
 let direction=heroFacing,row=moving?walk:0;
 let bob=quiet?0:moving?-Math.abs(Math.sin(phase))*2:Math.sin(now/650)*.45;
 let lean=quiet?0:moving?Math.sin(phase)*1.3:0;
 const recoil={x:0,y:0};
 if(now<heroShotUntil){direction=heroDirection(Math.cos(heroAttackAngle),Math.sin(heroAttackAngle));row=4;const t=(heroShotUntil-now)/160;if(!quiet){recoil.x=-Math.cos(heroAttackAngle)*3*t;recoil.y=-Math.sin(heroAttackAngle)*3*t;}}
 if(now<heroHurtUntil){if(!quiet){lean+=Math.sin((heroHurtUntil-now)*.07)*5;bob+=2;} }
 heroDrawMotion(row,direction,bob,lean,recoil);
}
// The home, selection and training menus all use the same full-body portrait.
// The adjacent text supplies the character's name; no placeholder <img> is needed.
function heroPortrait(character, slot = document.createElement('span')) {
    slot.classList.add('hero-portrait');
    slot.setAttribute('aria-hidden', 'true');
    slot.style.setProperty('--hero-sheet', heroArtBackground(character.image));
    return slot;
}
function heroEffect(el,id,column){
 const row=HERO_IDS.indexOf(id);el.style.backgroundImage="url('hero_effects.png')";el.style.backgroundSize='400% 500%';el.style.backgroundPosition=`${column*100/3}% ${row*25}%`;
}
function heroFx(id,column,x,y,angle=0,size=48){
 if(reducedEffects()&&column!==2)return;
 if(document.querySelectorAll('.hero-fx').length>=(reducedEffects()?6:22))return;
 const e=document.createElement('div');e.className='hero-fx';heroEffect(e,id,column);
 Object.assign(e.style,{left:x+'px',top:y+'px',width:size+'px',height:size+'px','--fx-angle':angle+'rad'});worldLayer.appendChild(e);gameSetTimeout(()=>e.remove(),220);
}
function heroAscended(){
 const t=gameData.training.balance;
 return gameData.character==='balance'&&t.levels.a===5&&t.levels.b===5&&t.levels.c===5&&(t.bestWave>=50||t.uses>=80);
}
function heroFire(damage,count,size){
 if(!waveEventActive||isGameOver||isPaused||!enemies.length)return;
 let closest=null,dist=Infinity;for(const e of enemies){const d=(e.x-playerX)**2+(e.y-playerY)**2;if(d<dist){closest=e;dist=d;}}
 const id=gameData.character,range=id==='tank'?420:600;if(!closest||dist>range*range)return;
 const target=hitEnemyAim(closest),angle=Math.atan2(target.y-playerY,target.x-playerX);heroAttackAngle=angle;heroShotUntil=gameNow()+Math.min(160,getPlayerStats().shotInterval*.55);heroShots++;
 const strong=id==='balance'&&heroShots%5===0;
 const awakened=heroAscended()&&gameNow()-heroLastAwakened>=12000;
 const trained=(activeTraining?.level||0)>=3;
 const speed=id==='speed'?15:id==='power'?7:id==='tank'?6:9;
 for(let i=0;i<Math.min(40,count);i++){
  if(bullets.length>=220)break;
  const a=angle+(count>1?-.15+.3*i/(count-1):0),el=acquireBulletElement();el.className='bullet hero-bullet';
  const visual=Math.min(68,Math.max(id==='tank'?36:22,size*1.8));
  Object.assign(el.style,{width:visual+'px',height:visual+'px',left:playerX+'px',top:playerY+'px',transform:`translate(-50%,-50%) rotate(${a}rad)`});heroEffect(el,id,strong||trained?3:1);worldLayer.appendChild(el);
  bullets.push({element:el,x:playerX,y:playerY,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage:damage*(strong?1.75:1),hero:id,hitShape:hitPose('shot/'+id+'/'+(strong||trained?3:1),visual,visual,.5,.5,a),hit:new Set(),remaining:id==='speed'?2:1,expiresAt:gameNow()+range/speed*1000/60});
 }
 heroFx(id,0,playerX+Math.cos(angle)*22,playerY+Math.sin(angle)*22,angle,38);
 playSound('hero_'+id,.32);
 if(awakened){
  heroLastAwakened=gameNow();heroFx('balance',2,playerX,playerY,0,150);showDamageText(playerX,playerY-65,'覚醒！');
  playerCurrentHp=Math.min(playerMaxHp,playerCurrentHp+playerMaxHp*.15);updateHpDisplay();
  for(const b of enemyBullets)b.element.remove();enemyBullets=[];
  for(const e of [...enemies])if(hitEnemyArea(e,playerX,playerY,520))damageEnemy(e,damage*8);
 }
}
function heroHit(b,e,impact=hitEnemyAim(e)){
 const {x,y}=impact;damageEnemy(e,equipmentBulletDamage(e,trainingBulletDamage(e,b.damage)));heroFx(b.hero,2,x,y,0,42);
 if(!waveEventActive||isGameOver||isPaused)return;
 if(b.hero==='power')for(const other of [...enemies])if(other!==e&&hitEnemyArea(other,x,y,65))damageEnemy(other,b.damage*.3);
 if(b.hero==='tank'&&e.type!=='boss'&&enemies.includes(e)){
  const a=Math.atan2(b.vy,b.vx),arena=getArenaSize();e.x=Math.max(25,Math.min(arena.width-25,e.x+Math.cos(a)*20));e.y=Math.max(25,Math.min(arena.height-25,e.y+Math.sin(a)*20));
  e.hitPrevX=e.x;e.hitPrevY=e.y;e.element.style.left=e.x+'px';e.element.style.top=e.y+'px';enemySpatialVersion++;
 }
}
