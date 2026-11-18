// Display only: truncate towards zero, stabilizing floating point noise.
function displayInteger(value) {
    const n=Number(value);
    return Number.isFinite(n) ? Math.trunc(Number(n.toPrecision(14))) : 0;
}
// Expected reward is 70% of the old amount; randomize the fractional coin.
function stageCoinReward(base) {
    const scaled=Math.max(0,base)*0.7;
    const whole=Math.floor(scaled+1e-9), fraction=Math.max(0,scaled-whole);
    return whole+(fraction>0 && Math.random()<fraction ? 1 : 0);
}
// 100WAVE expansion. Loaded before script.js; combat helpers run only after startup.
const NORMAL_WAVE_LIMIT = 100;
const LEGACY_STAGE_ENEMIES = [
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
const ENEMY_TIERS=[null,{name:'野生種',unlock:1,coins:2,chance:.08,count:1,rareChance:.35,rareCount:3},{name:'猛威種',unlock:11,coins:4,chance:.12,count:1,rareChance:.45,rareCount:4},{name:'凶禍種',unlock:26,coins:7,chance:.18,count:2,rareChance:.60,rareCount:6},{name:'災厄種',unlock:46,coins:11,chance:.25,count:2,rareChance:.75,rareCount:8},{name:'終焉種',unlock:71,coins:16,chance:.32,count:3,rareChance:.90,rareCount:12}];
const LEGACY_ENEMY_TIERS={minion:1,shooter:2,golem:3,rusher:3,treasure:2,goblin:1,bat:1,mushroom:1,skeleton:2,beetle:2,wolf:2,eye_mage:3,crystal_turtle:3,harpy:3,mech_spider:4,death_knight:4,manticore:4,reaper:4,treant:5,storm_drake:5};
const NEW_STAGE_ENEMIES=[{"id": "t1_01", "name": "若草スライム", "tier": 1, "unlock": 1, "hp": 0.9, "speed": 1.4, "damage": 1.02, "move": "chase", "shot": null, "rare": false, "detail": "まっすぐ追いかける。"}, {"id": "t1_02", "name": "短剣の小鬼", "tier": 1, "unlock": 1, "hp": 1.1, "speed": 1.6, "damage": 1.12, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t1_03", "name": "宵闇コウモリ", "tier": 1, "unlock": 1, "hp": 0.8, "speed": 2, "damage": 1.22, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t1_04", "name": "歩きキノコ", "tier": 1, "unlock": 1, "hp": 1.6, "speed": 0.65, "damage": 1.02, "move": "shoot", "shot": "ring", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t1_05", "name": "一角ラビット", "tier": 1, "unlock": 1, "hp": 0.7, "speed": 2.2, "damage": 1.12, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t1_06", "name": "棘甲虫", "tier": 1, "unlock": 1, "hp": 2, "speed": 0.7, "damage": 1.22, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t1_07", "name": "さまよう骨", "tier": 1, "unlock": 1, "hp": 1, "speed": 1.6, "damage": 1.02, "move": "orbit", "shot": "ring", "rare": false, "detail": "周囲を旋回して射撃。"}, {"id": "t1_08", "name": "突進ウリボウ", "tier": 1, "unlock": 1, "hp": 1.3, "speed": 1.5, "damage": 1.12, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t1_09", "name": "食いしん坊花", "tier": 1, "unlock": 1, "hp": 0.9, "speed": 0.9, "damage": 1.22, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t1_10", "name": "泥いたずら小鬼", "tier": 1, "unlock": 1, "hp": 1.2, "speed": 1.8, "damage": 1.02, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t1_11", "name": "琥珀の結晶兎", "tier": 1, "unlock": 1, "hp": 1.5, "speed": 2.4, "damage": 1.12, "move": "orbit", "shot": "fan", "rare": true, "detail": "結晶を多く落とすレア個体。旋回しながら攻撃。"}, {"id": "t2_01", "name": "鎧牙ウルフ", "tier": 2, "unlock": 11, "hp": 0.9, "speed": 1.4, "damage": 1.14, "move": "chase", "shot": null, "rare": false, "detail": "まっすぐ追いかける。"}, {"id": "t2_02", "name": "槍持ちゴブリン", "tier": 2, "unlock": 11, "hp": 1.1, "speed": 1.6, "damage": 1.24, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t2_03", "name": "毒袋ガエル", "tier": 2, "unlock": 11, "hp": 0.8, "speed": 2, "damage": 1.34, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t2_04", "name": "茨の精霊", "tier": 2, "unlock": 11, "hp": 1.6, "speed": 0.65, "damage": 1.14, "move": "shoot", "shot": "ring", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t2_05", "name": "骸骨の射手", "tier": 2, "unlock": 11, "hp": 0.7, "speed": 2.2, "damage": 1.24, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t2_06", "name": "蒼晶ガメ", "tier": 2, "unlock": 11, "hp": 2, "speed": 0.7, "damage": 1.34, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t2_07", "name": "疾風ハーピー", "tier": 2, "unlock": 11, "hp": 1, "speed": 1.6, "damage": 1.14, "move": "orbit", "shot": "ring", "rare": false, "detail": "周囲を旋回して射撃。"}, {"id": "t2_08", "name": "鉄尾サソリ", "tier": 2, "unlock": 11, "hp": 1.3, "speed": 1.5, "damage": 1.24, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t2_09", "name": "森の呪術師", "tier": 2, "unlock": 11, "hp": 0.9, "speed": 0.9, "damage": 1.34, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t2_10", "name": "鋼牙グモ", "tier": 2, "unlock": 11, "hp": 1.2, "speed": 1.8, "damage": 1.14, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t2_11", "name": "翠玉の結晶狐", "tier": 2, "unlock": 11, "hp": 1.5, "speed": 2.4, "damage": 1.24, "move": "orbit", "shot": "fan", "rare": true, "detail": "結晶を多く落とすレア個体。旋回しながら攻撃。"}, {"id": "t3_01", "name": "黒鉄の騎士", "tier": 3, "unlock": 26, "hp": 0.9, "speed": 1.4, "damage": 1.26, "move": "chase", "shot": null, "rare": false, "detail": "まっすぐ追いかける。"}, {"id": "t3_02", "name": "獅蝎マンティコア", "tier": 3, "unlock": 26, "hp": 1.1, "speed": 1.6, "damage": 1.36, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t3_03", "name": "紫衣の刈り手", "tier": 3, "unlock": 26, "hp": 0.8, "speed": 2, "damage": 1.46, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t3_04", "name": "古木の巨人", "tier": 3, "unlock": 26, "hp": 1.6, "speed": 0.65, "damage": 1.26, "move": "shoot", "shot": "ring", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t3_05", "name": "蒼雷の幼竜", "tier": 3, "unlock": 26, "hp": 0.7, "speed": 2.2, "damage": 1.36, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t3_06", "name": "戦斧ミノタウロス", "tier": 3, "unlock": 26, "hp": 2, "speed": 0.7, "damage": 1.46, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t3_07", "name": "溶岩の巨兵", "tier": 3, "unlock": 26, "hp": 1, "speed": 1.6, "damage": 1.26, "move": "orbit", "shot": "ring", "rare": false, "detail": "周囲を旋回して射撃。"}, {"id": "t3_08", "name": "氷牙タイガー", "tier": 3, "unlock": 26, "hp": 1.3, "speed": 1.5, "damage": 1.36, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t3_09", "name": "魔眼の導師", "tier": 3, "unlock": 26, "hp": 0.9, "speed": 0.9, "damage": 1.46, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t3_10", "name": "刃腕カマキリ", "tier": 3, "unlock": 26, "hp": 1.2, "speed": 1.8, "damage": 1.26, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t3_11", "name": "蒼玉の結晶鹿", "tier": 3, "unlock": 26, "hp": 1.5, "speed": 2.4, "damage": 1.36, "move": "orbit", "shot": "fan", "rare": true, "detail": "結晶を多く落とすレア個体。旋回しながら攻撃。"}, {"id": "t4_01", "name": "深淵の処刑人", "tier": 4, "unlock": 46, "hp": 0.9, "speed": 1.4, "damage": 1.38, "move": "chase", "shot": null, "rare": false, "detail": "まっすぐ追いかける。"}, {"id": "t4_02", "name": "双頭の獄犬", "tier": 4, "unlock": 46, "hp": 1.1, "speed": 1.6, "damage": 1.48, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t4_03", "name": "黒曜ガーゴイル", "tier": 4, "unlock": 46, "hp": 0.8, "speed": 2, "damage": 1.58, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t4_04", "name": "紅血の魔導伯", "tier": 4, "unlock": 46, "hp": 1.6, "speed": 0.65, "damage": 1.38, "move": "shoot", "shot": "ring", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t4_05", "name": "氷獄リッチ", "tier": 4, "unlock": 46, "hp": 0.7, "speed": 2.2, "damage": 1.48, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t4_06", "name": "雷鎧サイ", "tier": 4, "unlock": 46, "hp": 2, "speed": 0.7, "damage": 1.58, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t4_07", "name": "虚空の監視者", "tier": 4, "unlock": 46, "hp": 1, "speed": 1.6, "damage": 1.38, "move": "orbit", "shot": "ring", "rare": false, "detail": "周囲を旋回して射撃。"}, {"id": "t4_08", "name": "蛇妃の近衛", "tier": 4, "unlock": 46, "hp": 1.3, "speed": 1.5, "damage": 1.48, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t4_09", "name": "火山の単眼鬼", "tier": 4, "unlock": 46, "hp": 0.9, "speed": 0.9, "damage": 1.58, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t4_10", "name": "堕翼の呪術王", "tier": 4, "unlock": 46, "hp": 1.2, "speed": 1.8, "damage": 1.38, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t4_11", "name": "紫晶の宝孔雀", "tier": 4, "unlock": 46, "hp": 1.5, "speed": 2.4, "damage": 1.48, "move": "orbit", "shot": "fan", "rare": true, "detail": "結晶を多く落とすレア個体。旋回しながら攻撃。"}, {"id": "t5_01", "name": "天鎧の破壊者", "tier": 5, "unlock": 71, "hp": 0.9, "speed": 1.4, "damage": 1.5, "move": "chase", "shot": null, "rare": false, "detail": "まっすぐ追いかける。"}, {"id": "t5_02", "name": "虚無キマイラ", "tier": 5, "unlock": 71, "hp": 1.1, "speed": 1.6, "damage": 1.6, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t5_03", "name": "六翼の堕天使", "tier": 5, "unlock": 71, "hp": 0.8, "speed": 2, "damage": 1.7, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t5_04", "name": "世界樹の巨神", "tier": 5, "unlock": 71, "hp": 1.6, "speed": 0.65, "damage": 1.5, "move": "shoot", "shot": "ring", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t5_05", "name": "深淵の鎧竜", "tier": 5, "unlock": 71, "hp": 0.7, "speed": 2.2, "damage": 1.6, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t5_06", "name": "太陽の獅子", "tier": 5, "unlock": 71, "hp": 2, "speed": 0.7, "damage": 1.7, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t5_07", "name": "蝕の鬼武者", "tier": 5, "unlock": 71, "hp": 1, "speed": 1.6, "damage": 1.5, "move": "orbit", "shot": "ring", "rare": false, "detail": "周囲を旋回して射撃。"}, {"id": "t5_08", "name": "冥馬の亡霊", "tier": 5, "unlock": 71, "hp": 1.3, "speed": 1.5, "damage": 1.6, "move": "charge", "shot": null, "rare": false, "detail": "停止後に突進。"}, {"id": "t5_09", "name": "古代の戦闘機神", "tier": 5, "unlock": 71, "hp": 0.9, "speed": 0.9, "damage": 1.7, "move": "shoot", "shot": "cross", "rare": false, "detail": "距離を保って弾を撃つ。"}, {"id": "t5_10", "name": "混沌の魔冠王", "tier": 5, "unlock": 71, "hp": 1.2, "speed": 1.8, "damage": 1.5, "move": "weave", "shot": null, "rare": false, "detail": "蛇行しながら接近。"}, {"id": "t5_11", "name": "虹晶の麒麟", "tier": 5, "unlock": 71, "hp": 1.5, "speed": 2.4, "damage": 1.6, "move": "orbit", "shot": "fan", "rare": true, "detail": "結晶を多く落とすレア個体。旋回しながら攻撃。"}];
const STAGE_ENEMIES=[...LEGACY_STAGE_ENEMIES.map(e=>({...e,tier:LEGACY_ENEMY_TIERS[e.id],unlock:Math.max(e.unlock,ENEMY_TIERS[LEGACY_ENEMY_TIERS[e.id]].unlock)})),...NEW_STAGE_ENEMIES];
function enemyRewardProfile(e){
 if(e.type==='boss')return {chance:.45,count:8};
 if(e.type==='treasure')return {chance:.65,count:3};
 const t=ENEMY_TIERS[e.strengthTier]||ENEMY_TIERS[1];
 return {chance:e.archetype?.rare?t.rareChance:t.chance,count:e.archetype?.rare?t.rareCount:t.count};
}
const STAGE_ENEMY_MAP = Object.fromEntries(STAGE_ENEMIES.map((e,i)=>[e.id,{...e,atlas:i}]));
const EXTRA_BOSSES = [
    {id:'thunder',name:'雷霆キリン',awakened:'天雷神キリン',unlock:15,atlas:0,hp:1,speed:1.1,bulletSpeed:1.05,damage:1.15,interval:.9,phaseSpeed:1.2,detail:'高速移動・時間差の雷槍',reward:15},
    {id:'sand',name:'砂帝スコーピオン',awakened:'双尾の砂漠皇帝',unlock:30,atlas:1,hp:1.8,speed:.45,bulletSpeed:.85,damage:1.45,interval:1.15,phaseSpeed:1.15,detail:'最高HP・重い尾針と砂嵐',reward:22},
    {id:'abyss',name:'深海クラーケン',awakened:'深淵王クラーケン',unlock:45,atlas:2,hp:1.5,speed:.6,bulletSpeed:.9,damage:1.1,interval:1,phaseSpeed:1.2,detail:'多方向・うねる触手弾',reward:24},
    {id:'moon',name:'月影の死神',awakened:'双鎌の月蝕王',unlock:60,atlas:3,hp:.85,speed:1.25,bulletSpeed:1.05,damage:1.35,interval:.9,phaseSpeed:1.25,detail:'低HP・高速旋回刃',reward:26},
    {id:'phoenix',name:'天翔フェニックス',awakened:'虹翼の不死鳥',unlock:75,atlas:4,hp:1.3,speed:.95,bulletSpeed:1,damage:1.2,interval:.95,phaseSpeed:1.3,detail:'翼から広がる羽弾・覚醒で3波',reward:30}
];
EXTRA_BOSSES.push(...[{"id": "oni", "name": "紅蓮の鬼将", "awakened": "四臂の獄炎鬼神", "unlock": 8, "atlas": 5, "hp": 1.35, "speed": 0.75, "bulletSpeed": 1, "damage": 1.4, "interval": 1.05, "phaseSpeed": 1.2, "detail": "重い扇状斬撃", "reward": 25, "theme": "fire"}, {"id": "frostfox", "name": "氷華の九尾", "awakened": "絶零の九尾姫", "unlock": 18, "atlas": 6, "hp": 0.9, "speed": 1.2, "bulletSpeed": 1, "damage": 1.05, "interval": 0.95, "phaseSpeed": 1.2, "detail": "曲がる氷の渦", "reward": 28, "theme": "ice"}, {"id": "hydra", "name": "翠毒の三頭蛇", "awakened": "五首の毒竜王", "unlock": 28, "atlas": 7, "hp": 1.45, "speed": 0.6, "bulletSpeed": 1, "damage": 1.1, "interval": 1.05, "phaseSpeed": 1.2, "detail": "多方向の毒牙", "reward": 31, "theme": "forest"}, {"id": "sunlion", "name": "天冠の獅子", "awakened": "日輪の翼獅子", "unlock": 39, "atlas": 8, "hp": 1.2, "speed": 1, "bulletSpeed": 1, "damage": 1.25, "interval": 0.95, "phaseSpeed": 1.2, "detail": "輪になって広がる光弾", "reward": 34, "theme": "thunder"}, {"id": "chronos", "name": "時詠みの魔女", "awakened": "時空の支配者", "unlock": 49, "atlas": 9, "hp": 1, "speed": 0.85, "bulletSpeed": 1, "damage": 1.15, "interval": 0.95, "phaseSpeed": 1.2, "detail": "時間差の回転弾", "reward": 37, "theme": "dark"}, {"id": "volcano", "name": "火山の巨亀", "awakened": "噴火の大地神", "unlock": 59, "atlas": 10, "hp": 2, "speed": 0.4, "bulletSpeed": 1, "damage": 1.45, "interval": 1.05, "phaseSpeed": 1.2, "detail": "巨大な溶岩弾", "reward": 40, "theme": "fire"}, {"id": "moth", "name": "月羽の女王", "awakened": "六翼の月光后", "unlock": 69, "atlas": 11, "hp": 0.9, "speed": 1.15, "bulletSpeed": 1, "damage": 1, "interval": 0.95, "phaseSpeed": 1.2, "detail": "うねる月光の羽", "reward": 43, "theme": "moon"}, {"id": "machine", "name": "遺跡の巨神兵", "awakened": "超臨界の機神", "unlock": 82, "atlas": 12, "hp": 1.65, "speed": 0.6, "bulletSpeed": 1, "damage": 1.3, "interval": 1.05, "phaseSpeed": 1.2, "detail": "十字の連続砲撃", "reward": 46, "theme": "sand"}, {"id": "cosmos", "name": "星喰いの竜帝", "awakened": "虚空の六翼竜帝", "unlock": 95, "atlas": 13, "hp": 1.5, "speed": 0.9, "bulletSpeed": 1, "damage": 1.35, "interval": 0.95, "phaseSpeed": 1.2, "detail": "星のらせんと連弾", "reward": 49, "theme": "dark"}]);

function stageStats(wave = currentWave) {
    const w = Math.max(1, Math.min(1000000, wave));
    return {
        count:Math.min(180,8+Math.floor((w-1)*1.35)),
        hp:(1+Math.max(0,w-5)*.032+Math.pow(Math.max(0,w-20)/80,1.4)*1.15)*routeMultipliers().hp,
        damage:(1+(w-1)*.075)*routeMultipliers().damage,
        speed:1+Math.min(.55,(w-1)*.008),
        time:Math.min(240,50+Math.floor(w*1.5))
    };
}
function stageSetSprite(element, atlas, boss = false, phase = 1) {
    if((boss && atlas>=5)||(!boss && atlas>=LEGACY_STAGE_ENEMIES.length)){
        const entry=!boss?STAGE_ENEMIES[atlas]:null;
        const cell=boss?atlas-5:atlas-LEGACY_STAGE_ENEMIES.length;
        const columns=boss?3:4, local=boss?cell:cell%11;
        element.classList.add('stage-sprite');
        element.style.backgroundImage=`url('${boss?'bosses_new_phase'+phase:'enemies_tier'+entry.tier}.png')`;
        element.style.backgroundSize=boss?'300% 300%':'400% 300%';
        element.style.backgroundPosition=`${local%columns*100/(columns-1)}% ${Math.floor(local/columns)*50}%`;
        element.style.backgroundRepeat='no-repeat';return;
    }
    element.classList.add('stage-sprite');
    element.style.backgroundImage = `url('${boss ? 'bosses_expansion.png' : 'enemies_expansion.png'}')`;
    element.style.backgroundSize = boss ? '500% 200%' : '500% 300%';
    element.style.backgroundPosition = `${(atlas%5)*25}% ${boss ? (phase-1)*100 : Math.floor(atlas/5)*50}%`;
    element.style.backgroundRepeat = 'no-repeat';
}
let stagePendingEnemies = [];
let stageNextSpawn = 0;
function stageChooseEnemy() {
 const maxTier=ENEMY_TIERS.reduce((n,t,i)=>t&&currentWave>=t.unlock?i:n,1);
 const tierPool=Array.from({length:maxTier},(_,i)=>i+1).flatMap(t=>Array(t===maxTier?6:t===maxTier-1?3:1).fill(t));
 const tier=tierPool[Math.floor(Math.random()*tierPool.length)];
 const eligible=STAGE_ENEMIES.filter(e=>e.unlock<=currentWave&&e.tier===tier);
 if(Math.random()<.02){const rare=eligible.filter(e=>e.rare);if(rare.length)return rare[Math.floor(Math.random()*rare.length)].id;}
 const old=Object.keys(LEGACY_ENEMY_TIERS).filter(id=>['minion','shooter','golem','rusher'].includes(id)&&LEGACY_ENEMY_TIERS[id]===tier);
 const pool=[...eligible.filter(e=>!e.rare).map(e=>e.id),...old];
 return pool[Math.floor(Math.random()*pool.length)]||'minion';
}
function stageFillEnemies(force = false) {
    if (!waveEventActive || isGameOver || isBossPhase || isPaused) return;
    const now=gameNow();
    if (!force && now<stageNextSpawn) return;
    stageNextSpawn=now+700;
    const cap=Math.min(getViewportSize().width<650?18:26,10+Math.floor(currentWave/4));
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
            const count=a.tier>=3?8:6;
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
    if(getBossType(boss).atlas>=5){newBossSignature(boss);return;}
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
        [signatures[id]||'fan',names[id]||getBossType(boss).detail,stageBossSignature],
        ['ring','拡散リング',circle],['aim','狙撃連射',bossAttackTripleAim],
        ['cross','回転十字',bossAttackRotatingCross],['vortex','渦の弾幕',spiral]
    ].map(([id,name,run])=>({id,name:(phase?'覚醒・':'')+name,run}));
}

function newBossSignature(boss){
 const info=getBossType(boss),stats=getBossAttackStats(boss),phase=boss.bossPhase===2;
 const base=boss.telegraphAngle??Math.atan2(playerY-boss.y,playerX-boss.x);
 const shot=(a,speed=1,curve=0,size=18)=>createBossBullet(boss,a,stats.speed*speed,stats.damage,{size,curve,lifetime:6000});
 const volley=(delay,fn)=>scheduleBossAttack(boss,fn,delay);
 if(info.id==='oni')for(let j=0;j<(phase?4:2);j++)volley(j*300,()=>[-.65,-.32,0,.32,.65].forEach(o=>shot(base+o+j*.08,.85,0,24)));
 if(info.id==='frostfox')for(let j=0;j<(phase?12:8);j++)volley(j*120,()=>{shot(base+j*.38,.85,.004);shot(base-j*.38+Math.PI,.85,-.004);});
 if(info.id==='hydra')for(let j=0;j<(phase?5:3);j++)volley(j*180,()=>[-.6,0,.6].forEach(o=>shot(base+o+j*.13,1)));
 if(info.id==='sunlion')for(let j=0;j<(phase?3:2);j++)volley(j*450,()=>{for(let k=0;k<16;k++)if(k!==j&&k!==j+8)shot(base+k*Math.PI/8+j*.15,.8);});
 if(info.id==='chronos')for(let j=0;j<(phase?7:4);j++)volley(j*260,()=>{for(let k=0;k<4;k++)shot(base+k*Math.PI/2+j*.24,.75);});
 if(info.id==='volcano')for(let j=0;j<(phase?4:2);j++)volley(j*400,()=>[-.75,-.25,.25,.75].forEach(o=>shot(base+o+j*.06,.65,0,30)));
 if(info.id==='moth')for(let j=0;j<(phase?10:6);j++)volley(j*150,()=>[-1,1].forEach(side=>shot(base+side*j*.18,.9,side*.007,16)));
 if(info.id==='machine')for(let j=0;j<(phase?6:3);j++)volley(j*210,()=>{for(let k=0;k<4;k++)shot(base+k*Math.PI/2+(j%2)*.22,1.05,0,20);});
 if(info.id==='cosmos')for(let j=0;j<(phase?14:9);j++)volley(j*130,()=>{for(let k=0;k<3;k++)shot(base+j*.35+k*Math.PI*2/3,.85,.003);});
}
