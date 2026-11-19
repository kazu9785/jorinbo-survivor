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
const HERO_MOTION_FRAMES={"rookie":{"size":[1246,1263],"frames":[[95,14,103,293],[335,14,96,294],[588,16,67,292],[817,16,82,291],[1051,16,101,291],[91,324,107,268],[332,327,101,264],[545,330,157,257],[810,329,108,262],[1050,328,109,263],[96,608,100,251],[335,607,98,252],[593,609,77,250],[818,610,94,248],[1048,609,103,249],[95,872,100,209],[332,872,109,209],[542,875,141,206],[787,876,122,204],[1053,875,101,206],[84,1092,125,168],[324,1093,124,167],[548,1094,151,166],[777,1093,140,166],[1039,1093,121,166]]},"balance":{"size":[1246,1262],"frames":[[85,13,108,264],[316,14,112,263],[574,13,69,264],[803,12,106,265],[1053,12,105,265],[65,292,132,236],[306,293,136,236],[539,293,153,235],[801,294,124,234],[1052,294,124,232],[87,541,108,222],[316,542,126,220],[579,542,86,220],[805,543,110,219],[1059,543,104,220],[71,776,123,226],[313,777,135,225],[537,776,157,224],[791,776,140,225],[1054,777,117,226],[56,1015,142,235],[274,1017,224,235],[498,1021,250,230],[748,1021,194,230],[1031,1020,166,231]]},"power":{"size":[1247,1261],"frames":[[88,10,106,242],[325,10,112,242],[566,10,97,242],[808,10,109,242],[1050,11,115,241],[85,263,123,238],[322,264,127,236],[543,265,130,233],[788,265,128,234],[1045,266,123,233],[87,510,118,239],[323,511,126,237],[545,512,119,236],[782,513,131,235],[1044,514,120,234],[86,762,125,237],[323,762,130,237],[536,762,135,236],[794,765,126,233],[1043,765,124,233],[60,1014,156,230],[298,1015,152,229],[499,1020,249,222],[748,1022,219,215],[1019,1017,169,224]]},"speed":{"size":[1246,1262],"frames":[[108,10,127,278],[335,10,124,279],[563,11,115,278],[794,10,126,279],[1028,11,117,277],[109,302,118,250],[334,302,114,250],[538,303,152,246],[778,303,137,248],[1030,303,110,247],[114,560,109,234],[336,560,110,234],[560,560,114,233],[783,561,124,233],[1028,561,106,233],[109,803,116,228],[326,803,121,228],[544,803,144,228],[778,804,129,227],[1031,803,105,228],[88,1043,144,211],[307,1043,145,212],[519,1044,203,212],[763,1044,162,211],[1013,1044,144,211]]},"tank":{"size":[1263,1246],"frames":[[84,10,129,241],[321,10,127,241],[593,10,81,241],[823,9,117,241],[1059,10,131,239],[70,263,148,236],[315,264,145,235],[565,266,139,229],[813,265,142,233],[1056,264,143,235],[73,511,139,234],[320,510,134,235],[591,511,98,234],[814,510,138,234],[1056,510,148,234],[70,755,144,231],[312,755,147,230],[557,755,149,225],[813,754,146,231],[1054,754,144,231],[58,1000,159,234],[307,996,167,239],[528,998,187,233],[779,1003,179,225],[1047,1002,164,230]]}};
let heroMotionPhase=0,heroMotionLast=null,heroMotionKey='',heroMotionChanged=0,heroMotionPrevious=null;
function heroDirection(dx,dy){return (Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8;}
function heroDirectionSprite(direction){return {column:direction<=4?direction:8-direction,flip:direction>4};}
function heroMotionLayer(id){
 let layer=document.getElementById(id);if(!layer){layer=document.createElement('div');layer.id=id;layer.className='hero-motion-layer';player.appendChild(layer);}return layer;
}
function heroPaintFrame(el,frame,bob,lean,recoil,opacity){
 const atlas=HERO_MOTION_FRAMES[frame.id],box=atlas.frames[frame.row*5+frame.column];
 const height=frame.row===4?80:88,scale=height/box[3];
 Object.assign(el.style,{width:box[2]*scale+'px',height:height+'px',backgroundImage:`url('motion_${frame.id}.png')`,backgroundSize:`${atlas.size[0]*scale}px ${atlas.size[1]*scale}px`,backgroundPosition:`${-box[0]*scale}px ${-box[1]*scale}px`,opacity:String(opacity),transform:`translate(-50%,-100%) translate(${recoil.x}px,${30+bob+recoil.y}px) rotate(${lean}deg) scaleX(${frame.flip?-1:1})`});
 el.classList.toggle('hero-hurt',gameNow()<heroHurtUntil);
}
function heroDrawMotion(row,direction,bob=0,lean=0,recoil={x:0,y:0}){
 const now=gameNow(),d=heroDirectionSprite(direction),frame={id:gameData.character,row,...d},key=[frame.id,row,d.column,d.flip].join(':');
 const current=heroMotionLayer('hero-sprite'),previous=heroMotionLayer('hero-sprite-previous');
 if(key!==heroMotionKey){heroMotionPrevious=heroMotionCurrent;heroMotionCurrent=frame;heroMotionKey=key;heroMotionChanged=now;}
 const blend=reducedEffects()?1:Math.min(1,(now-heroMotionChanged)/55);
 if(heroMotionPrevious&&blend<1){heroPaintFrame(previous,heroMotionPrevious,bob,lean,recoil,1-blend);heroPaintFrame(current,frame,bob,lean,recoil,blend);}else{previous.style.opacity='0';heroPaintFrame(current,frame,bob,lean,recoil,1);}
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
const HERO_CLEAR_PIXEL='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
function heroFixPortrait(img){
 const m=img.getAttribute('src')?.match(/(?:^|\/)hero_(rookie|balance|power|speed|tank)\.png(?:\?.*)?$/);if(!m)return;
 img.style.backgroundImage=`url('hero_${m[1]}.png')`;img.style.backgroundSize='400% 200%';img.style.backgroundPosition='0 0';img.style.backgroundRepeat='no-repeat';img.style.objectFit='contain';img.src=HERO_CLEAR_PIXEL;img.classList.add('hero-portrait');
}
new MutationObserver(records=>{for(const r of records){if(r.type==='attributes'&&r.target.tagName==='IMG')heroFixPortrait(r.target);for(const n of r.addedNodes||[]){if(n.nodeType!==1)continue;if(n.tagName==='IMG')heroFixPortrait(n);n.querySelectorAll?.('img').forEach(heroFixPortrait);}}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
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
 const angle=Math.atan2(closest.y-playerY,closest.x-playerX);heroAttackAngle=angle;heroShotUntil=gameNow()+Math.min(160,getPlayerStats().shotInterval*.55);heroShots++;
 const strong=id==='balance'&&heroShots%5===0;
 const awakened=heroAscended()&&gameNow()-heroLastAwakened>=12000;
 const trained=(activeTraining?.level||0)>=3;
 const speed=id==='speed'?15:id==='power'?7:id==='tank'?6:9;
 for(let i=0;i<Math.min(40,count);i++){
  if(bullets.length>=220)break;
  const a=angle+(count>1?-.15+.3*i/(count-1):0),el=acquireBulletElement();el.className='bullet hero-bullet';
  const visual=Math.min(68,Math.max(id==='tank'?36:22,size*1.8));
  Object.assign(el.style,{width:visual+'px',height:visual+'px',left:playerX+'px',top:playerY+'px',transform:`translate(-50%,-50%) rotate(${a}rad)`});heroEffect(el,id,strong||trained?3:1);worldLayer.appendChild(el);
  bullets.push({element:el,x:playerX,y:playerY,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage:damage*(strong?1.75:1),hero:id,hit:new Set(),remaining:id==='speed'?2:1,expiresAt:gameNow()+range/speed*1000/60});
 }
 heroFx(id,0,playerX+Math.cos(angle)*22,playerY+Math.sin(angle)*22,angle,38);
 playSound('hero_'+id,.32);
 if(awakened){
  heroLastAwakened=gameNow();heroFx('balance',2,playerX,playerY,0,150);showDamageText(playerX,playerY-65,'覚醒！');
  playerCurrentHp=Math.min(playerMaxHp,playerCurrentHp+playerMaxHp*.15);updateHpDisplay();
  for(const b of enemyBullets)b.element.remove();enemyBullets=[];
  for(const e of [...enemies])if(Math.hypot(e.x-playerX,e.y-playerY)<520)damageEnemy(e,damage*8);
 }
}
function heroHit(b,e){
 const x=e.x,y=e.y;damageEnemy(e,equipmentBulletDamage(e,trainingBulletDamage(e,b.damage)));heroFx(b.hero,2,x,y,0,42);
 if(!waveEventActive||isGameOver||isPaused)return;
 if(b.hero==='power')for(const other of [...enemies])if(other!==e&&Math.hypot(other.x-x,other.y-y)<65)damageEnemy(other,b.damage*.3);
 if(b.hero==='tank'&&e.type!=='boss'&&enemies.includes(e)){
  const a=Math.atan2(b.vy,b.vx),arena=getArenaSize();e.x=Math.max(25,Math.min(arena.width-25,e.x+Math.cos(a)*20));e.y=Math.max(25,Math.min(arena.height-25,e.y+Math.sin(a)*20));enemySpatialVersion++;
 }
}
