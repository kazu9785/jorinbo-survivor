// 100WAVE expansion. Loaded before script.js; combat helpers run only after startup.
const NORMAL_WAVE_LIMIT = 100;
const STAGE_ENEMIES = [
    {id:'goblin',name:'短剣ゴブリン',tier:1,unlock:1,hp:.85,speed:1.8,damage:1,move:'chase',detail:'軽装の追跡兵。HPは低め。'},
    {id:'bat',name:'ファングバット',tier:1,unlock:3,hp:.65,speed:2.2,damage:.9,move:'weave',detail:'左右に揺れながら接近する。'},
    {id:'mushroom',name:'胞子キノコ',tier:1,unlock:5,hp:1.2,speed:.8,damage:1,move:'shoot',shot:'ring',detail:'低速で接近し、6方向に胞子を放つ。'},
    {id:'skeleton',name:'骸骨アーチャー',tier:1,unlock:7,hp:.9,speed:1.1,damage:1.1,move:'shoot',shot:'aim',detail:'距離を保って狙い撃ちする。'},
    {id:'beetle',name:'紅角ビートル',tier:1,unlock:9,hp:1.6,speed:1.1,damage:1.2,move:'charge',detail:'いったん止まり、狙った方向へ突進。'},
    {id:'wolf',name:'蒼鎧ウルフ',tier:2,unlock:12,hp:1,speed:2.4,damage:1.3,move:'charge',detail:'予備動作後、素早く一直線に突進。'},
    {id:'eye_mage',name:'単眼の魔導士',tier:2,unlock:16,hp:.85,speed:1,damage:1.2,move:'shoot',shot:'fan',detail:'3方向の魔弾で進路を狙う。'},
    {id:'crystal_turtle',name:'水晶ガメ',tier:2,unlock:20,hp:2.4,speed:.55,damage:1.1,move:'shoot',shot:'ring',detail:'高HPの歩く要塞。周囲へ水晶弾。'},
    {id:'harpy',name:'紅翼ハーピー',tier:2,unlock:24,hp:.9,speed:2,damage:1.2,move:'orbit',shot:'aim',detail:'プレイヤーの周囲を旋回し射撃。'},
    {id:'mech_spider',name:'機鋼スパイダー',tier:2,unlock:28,hp:1.5,speed:1.1,damage:1.3,move:'shoot',shot:'cross',detail:'角度が変わる十字弾を撃つ。'},
    {id:'death_knight',name:'黒鎧の騎士',tier:3,unlock:32,hp:1.8,speed:1.3,damage:1.6,move:'charge',detail:'重い一撃と高HP。突進前に停止。'},
    {id:'manticore',name:'金獅子マンティコア',tier:3,unlock:38,hp:1.3,speed:1.8,damage:1.5,move:'weave',shot:'fan',detail:'蛇行しながら3連の毒針を放つ。'},
    {id:'reaper',name:'紫衣の死神',tier:3,unlock:44,hp:1,speed:1.9,damage:1.7,move:'orbit',shot:'cross',detail:'旋回しながら回転する刃を撃つ。'},
    {id:'treant',name:'古樹の守り手',tier:3,unlock:50,hp:3,speed:.5,damage:1.4,move:'shoot',shot:'ring',detail:'最も頑丈な追加敵。8方向の種子弾。'},
    {id:'storm_drake',name:'白銀の雷竜',tier:3,unlock:56,hp:1.6,speed:1.7,damage:1.5,move:'orbit',shot:'fan',detail:'旋回しながら高速の雷弾を放つ。'}
];
const STAGE_ENEMY_MAP = Object.fromEntries(STAGE_ENEMIES.map((e,i)=>[e.id,{...e,atlas:i}]));
const EXTRA_BOSSES = [
    {id:'thunder',name:'雷霆キリン',awakened:'天雷神キリン',unlock:15,atlas:0,hp:1,speed:1.1,bulletSpeed:1.05,damage:1.15,interval:.9,phaseSpeed:1.2,detail:'高速移動・時間差の雷槍',reward:15},
    {id:'sand',name:'砂帝スコーピオン',awakened:'双尾の砂漠皇帝',unlock:30,atlas:1,hp:1.8,speed:.45,bulletSpeed:.85,damage:1.45,interval:1.15,phaseSpeed:1.15,detail:'最高HP・重い尾針と砂嵐',reward:22},
    {id:'abyss',name:'深海クラーケン',awakened:'深淵王クラーケン',unlock:45,atlas:2,hp:1.5,speed:.6,bulletSpeed:.9,damage:1.1,interval:1,phaseSpeed:1.2,detail:'多方向・うねる触手弾',reward:24},
    {id:'moon',name:'月影の死神',awakened:'双鎌の月蝕王',unlock:60,atlas:3,hp:.85,speed:1.25,bulletSpeed:1.05,damage:1.35,interval:.9,phaseSpeed:1.25,detail:'低HP・高速旋回刃',reward:26},
    {id:'phoenix',name:'天翔フェニックス',awakened:'虹翼の不死鳥',unlock:75,atlas:4,hp:1.3,speed:.95,bulletSpeed:1,damage:1.2,interval:.95,phaseSpeed:1.3,detail:'翼から広がる羽弾・覚醒で3波',reward:30}
];
function stageStats(wave = currentWave) {
    const w = Math.max(1, Math.min(1000000, wave));
    return {
        count:Math.min(180,8+Math.floor((w-1)*1.1)),
        hp:1+Math.max(0,w-10)*.022+Math.pow(Math.max(0,w-30)/70,1.4)*.9,
        damage:1+(w-1)*.055,
        speed:1+Math.min(.55,(w-1)*.006),
        time:Math.min(240,50+Math.floor(w*1.5))
    };
}
function stageSetSprite(element, atlas, boss = false, phase = 1) {
    element.classList.add('stage-sprite');
    element.style.backgroundImage = `url('${boss ? 'bosses_expansion.png' : 'enemies_expansion.png'}')`;
    element.style.backgroundSize = boss ? '500% 200%' : '500% 300%';
    element.style.backgroundPosition = `${(atlas%5)*25}% ${boss ? (phase-1)*100 : Math.floor(atlas/5)*50}%`;
    element.style.backgroundRepeat = 'no-repeat';
}
let stagePendingEnemies = [];
let stageNextSpawn = 0;
function stageChooseEnemy() {
    const eligible = STAGE_ENEMIES.filter(e=>e.unlock<=currentWave);
    const rare = Math.min(.22,.06+currentWave*.0016);
    const elite = Math.min(.4,.2+currentWave*.002);
    const roll = Math.random();
    const tier = roll<rare ? 3 : roll<rare+elite ? 2 : 1;
    const pool = eligible.filter(e=>e.tier===tier);
    if (pool.length && Math.random()<.78) return pool[Math.floor(Math.random()*pool.length)].id;
    const old = currentWave>=2 ? ['minion','shooter','golem','rusher'] : ['minion','shooter','golem'];
    return old[Math.floor(Math.random()*old.length)];
}
function stageFillEnemies(force = false) {
    if (!waveEventActive || isGameOver || isBossPhase || isPaused) return;
    const now=gameNow();
    if (!force && now<stageNextSpawn) return;
    stageNextSpawn=now+900;
    const cap=Math.min(getViewportSize().width<650?18:26,10+Math.floor(currentWave/5));
    let available=cap-enemies.filter(e=>e.type!=='treasure').length;
    available=Math.min(available,force?cap:4);
    while(available-->0 && stagePendingEnemies.length) spawnEnemy(stagePendingEnemies.shift());
}
function stageBossIndex() {
    // 新ボスは解禁WAVEで必ず登場。その後は全解禁済みからランダム。
    if (currentWave===100) return BOSS_TYPES.findIndex(b=>b.id==='phoenix');
    const debut=BOSS_TYPES.findIndex(b=>b.unlock===currentWave);
    if (debut>=0) return debut;
    const eligible=BOSS_TYPES.map((b,i)=>({b,i})).filter(({b})=>!b.unlock||b.unlock<=currentWave);
    return eligible[Math.floor(Math.random()*eligible.length)].i;
}
function stageEnemyBullet(e, angle, speed = 3.6) {
    if (enemyBullets.length>=180) return;
    const element=document.createElement('div');
    element.classList.add('enemy-bullet','stage-enemy-bullet','stage-bullet-tier-'+e.strengthTier);
    element.style.left=e.x+'px';element.style.top=e.y+'px';worldLayer.appendChild(element);
    enemyBullets.push({element,x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        damage:Math.ceil(stageStats().damage*e.archetype.damage*(1+(e.strengthTier-1)*.2)),
        hitRadius:6,createdAt:gameNow(),lifetime:6000});
}
function stageMoveEnemy(e, now) {
    const a=e.archetype;
    const angle=Math.atan2(playerY-e.y,playerX-e.x),dist=Math.hypot(playerX-e.x,playerY-e.y);
    let heading=angle, speed=e.speed;
    if(a.move==='weave') heading+=Math.sin((now-e.spawnedAt)/280+e.motionSeed)*.75;
    if(a.move==='orbit') heading+=e.orbitDirection*(dist<160?2:dist>260?.35:Math.PI/2);
    if(a.move==='shoot' && dist<260) speed=dist<135?-e.speed*.6:0;
    if(a.move==='charge') {
        const elapsed=(now-e.spawnedAt)%2800;
        const warning=elapsed>=1300&&elapsed<1950;
        e.element.classList.toggle('stage-charge-warning',warning);
        if(warning) {speed=0;e.chargeAngle=angle;}
        if(elapsed>=1950) {heading=e.chargeAngle??angle;speed*=1.8;}
    }
    if(a.shot && now-e.lastAttackTime>Math.max(1700,3100-currentWave*8)) {
        e.lastAttackTime=now;
        if(a.shot==='aim') stageEnemyBullet(e,angle);
        if(a.shot==='fan') [-.3,0,.3].forEach(offset=>stageEnemyBullet(e,angle+offset,a.id==='storm_drake'?4.5:3.6));
        if(a.shot==='ring') {
            const count=a.tier===3?8:6;
            for(let i=0;i<count;i++) stageEnemyBullet(e,angle+i*Math.PI*2/count,2.8);
        }
        if(a.shot==='cross') for(let i=0;i<4;i++)stageEnemyBullet(e,now/1500+i*Math.PI/2,3.2);
    }
    e.x+=Math.cos(heading)*speed;e.y+=Math.sin(heading)*speed;
    e.element.style.transform='translate(-50%, -50%)';
}
// 各新ボスの専用攻撃。予告中の照準を固定し、弾数・寿命を制限する。
function stageBossSignature(boss) {
    const stats=getBossAttackStats(boss),id=getBossType(boss).id;
    const phase=boss.bossPhase===2,base=boss.telegraphAngle??Math.atan2(playerY-boss.y,playerX-boss.x);
    const emit=(angle,speed=1,curve=0,size=18)=>createBossBullet(boss,angle,stats.speed*speed,stats.damage,{size,curve,lifetime:6000});
    if(id==='thunder') for(let j=0;j<(phase?5:3);j++)scheduleBossAttack(boss,()=>[-.24,0,.24].forEach(o=>emit(base+o,1.1+j*.025)),j*180);
    if(id==='sand') for(let j=0;j<(phase?3:2);j++)scheduleBossAttack(boss,()=>{
        // 扇の中央にも隙間を残す、重い尾針。
        [-.8,-.5,-.2,.2,.5,.8].forEach(o=>emit(base+o+(j%2?.12:0),.7,0,26));
    },j*450);
    if(id==='abyss') for(let j=0;j<(phase?10:7);j++)scheduleBossAttack(boss,()=>{
        for(let arm=0;arm<(phase?4:3);arm++)emit(base+j*.28+arm*Math.PI*2/(phase?4:3),.8,.004*(arm%2?1:-1),16);
    },j*120);
    if(id==='moon') for(let j=0;j<(phase?10:6);j++)scheduleBossAttack(boss,()=>{
        emit(base+j*.25,.9,.006,18);emit(base-j*.25+Math.PI,.9,-.006,18);
    },j*140);
    if(id==='phoenix') for(let j=0;j<(phase?3:2);j++)scheduleBossAttack(boss,()=>{
        for(let i=0;i<16;i++) {
            if(i===j||i===j+8)continue;
            emit(base+i*Math.PI/8+j*.13,.75+j*.08,0,16);
        }
    },j*500);
}
function stageBossPatterns(boss) {
    const id=getBossType(boss).id,phase=boss.bossPhase===2;
    const circle=phase?bossAttackDoubleCircle:bossAttackCircle;
    const spiral=phase?bossAttackAwakenedSpiral:bossAttackSpiral;
    const names={thunder:'雷槍の連撃',sand:'皇帝の尾針',abyss:'深海の触手',moon:'双月の回転刃',phoenix:'虹翼の羽嵐'};
    const signatures={thunder:'lances',sand:'fan',abyss:'spiral',moon:'spiral',phoenix:'circle'};
    return [
        [signatures[id],names[id],stageBossSignature],
        ['ring','拡散リング',circle],['aim','狙撃連射',bossAttackTripleAim],
        ['cross','回転十字',bossAttackRotatingCross],['vortex','渦の弾幕',spiral]
    ].map(([id,name,run])=>({id,name:(phase?'覚醒・':'')+name,run}));
}
