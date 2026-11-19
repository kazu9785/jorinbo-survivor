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
function heroResetCombat(){heroFacing=0;heroShots=0;heroShotUntil=0;heroHurtUntil=0;heroLastAwakened=gameNow();document.querySelectorAll('.hero-fx').forEach(e=>e.remove());}
function heroSetPose(frame,flip=false,bob=0){
 let art=document.getElementById('hero-sprite');
 if(!art){art=document.createElement('div');art.id='hero-sprite';player.appendChild(art);}
 const url='hero_'+gameData.character+'.png';
 art.style.backgroundImage=`url('${url}')`;art.style.backgroundSize='400% 200%';
 art.style.backgroundPosition=`${frame%4*100/3}% ${frame<4?0:100}%`;
 art.style.transform=`translate(-50%,-67%) translateY(${bob}px) scaleX(${flip?-1:1})`;
 art.classList.toggle('hero-hurt',gameNow()<heroHurtUntil);
}
function heroUpdateMotion(x,y){
 const now=gameNow(),dx=playerX-x,dy=playerY-y,moving=Math.hypot(dx,dy)>.15;
 if(moving)heroFacing=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?0:2;
 if(now<heroHurtUntil){heroSetPose(7);return;}
 if(now<heroShotUntil){heroSetPose(6,Math.cos(heroAttackAngle)<0);return;}
 const step=Math.floor(now/160)%2;
 const frame=moving&&(heroFacing===1||heroFacing===3)?4+step:heroFacing;
 heroSetPose(frame,moving&&heroFacing===3,reducedEffects()||!moving?0:step?-1:1);
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
 const angle=Math.atan2(closest.y-playerY,closest.x-playerX);heroAttackAngle=angle;heroShotUntil=gameNow()+Math.min(95,getPlayerStats().shotInterval*.55);heroShots++;
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
