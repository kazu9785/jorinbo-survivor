const HERO_IDS = ['rookie','balance','power','speed','tank', ...Object.keys(OATH_RECRUITS)];
const HERO_ROSTER_TAG = 2 ** HERO_IDS.length;
function validRoster(roster) {
    return roster?.version === 1 && Object.keys(roster).every(k=>['version','owned'].includes(k))
        && Array.isArray(roster.owned) && roster.owned.includes('rookie')
        && new Set(roster.owned).size === roster.owned.length && roster.owned.every(id=>HERO_IDS.includes(id));
}
function packRoster(roster) {
    return HERO_ROSTER_TAG + roster.owned.reduce((bits,id)=>bits | (1 << HERO_IDS.indexOf(id)),0);
}
function repairRoster(saved) {
    if (Number.isInteger(saved) && (saved & 1) && (saved>=1 && saved<=31 || saved>HERO_ROSTER_TAG && saved<2*HERO_ROSTER_TAG)) {
        return {version:1,owned:HERO_IDS.filter((id,i)=>saved & (1 << i))};
    }
    return validRoster(saved) ? {version:1,owned:[...saved.owned]} : {version:1,owned:['rookie']};
}
function heroOwned(id) { return gameData.roster?.owned.includes(id) === true; }
function heroEquipmentCharacter() { return gameData.character==='rookie' ? 'balance' : heroFamily(); }
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
const HERO_MOTION_FRAMES={"rookie":{"size":[1254,1254],"frames":[[92,46,114,256,47.8],[325,46,112,257,48.7],[588,47,57,256,49.1],[814,47,99,256,46.0],[1056,48,112,255,50.4],[75,323,127,244,52.0],[308,322,133,245,49.6],[529,324,174,240,49.7],[797,324,126,242,40.9],[1055,325,132,240,38.8],[89,577,114,231,52.6],[317,576,122,232,50.8],[580,578,89,228,35.0],[808,578,112,229,35.3],[1058,578,122,230,38.9],[79,816,122,224,50.8],[312,814,133,225,51.5],[529,819,174,219,50.3],[790,818,143,221,44.8],[1060,818,120,221,45.8],[65,1053,143,193,49.7],[287,1053,151,193,47.4],[491,1056,191,190,45.8],[744,1055,191,190,49.5],[1026,1054,169,191,49.7]]},"balance":{"size":[1254,1254],"frames":[[68,11,144,256,46.9],[309,10,144,257,45.8],[564,11,81,256,56.8],[798,11,122,256,49.2],[1047,10,133,257,53.0],[59,276,135,241,57.0],[299,276,142,242,51.1],[533,279,170,237,50.0],[798,279,138,237,38.8],[1058,278,138,237,39.9],[76,524,118,229,55.9],[306,524,136,230,53.3],[565,525,104,229,44.7],[797,526,130,227,37.7],[1059,526,126,227,42.9],[67,759,127,233,54.7],[305,759,139,232,52.5],[531,763,168,226,49.4],[783,762,154,231,41.6],[1060,762,126,231,45.2],[43,1004,160,241,48.1],[268,1005,186,240,40.6],[470,1009,251,236,38.8],[735,1010,217,235,48.2],[1028,1010,183,233,50.0]]},"power":{"size":[1254,1254],"frames":[[74,11,132,241,50.8],[311,11,127,241,53.1],[550,11,104,241,46.2],[785,10,118,243,47.9],[1031,11,125,242,49.2],[72,258,141,240,39.8],[313,260,136,235,39.3],[531,259,135,232,52.2],[764,261,141,232,51.4],[1029,261,126,236,63.5],[75,506,130,232,37.7],[313,508,126,230,39.3],[532,507,123,232,60.6],[771,507,133,232,60.2],[1030,508,122,231,65.2],[75,750,137,234,33.6],[309,750,141,229,38.1],[522,751,135,232,62.6],[772,750,133,233,54.9],[1019,751,135,233,66.3],[56,998,165,235,51.8],[289,999,158,234,60.8],[487,1004,230,228,38.3],[727,1004,227,227,43.2],[1002,1001,176,231,46.0]]},"speed":{"size":[1254,1254],"frames":[[87,10,126,266,45.6],[309,9,122,267,49.7],[548,10,115,267,45.7],[791,9,116,267,53.4],[1030,10,114,264,54.8],[86,282,127,261,45.3],[302,282,133,261,48.5],[525,283,161,259,49.4],[771,282,141,261,58.5],[1033,281,117,261,52.1],[92,547,113,244,42.9],[315,546,112,244,42.9],[544,546,117,243,38.9],[776,547,124,243,54.8],[1042,546,100,243,52.0],[90,794,117,238,42.3],[313,794,120,239,47.9],[529,794,151,238,49.0],[778,794,128,238,57.8],[1035,794,109,238,55.0],[71,1038,144,212,49.7],[295,1038,149,214,45.6],[512,1039,180,213,43.3],[758,1039,159,213,44.3],[1010,1038,158,213,49.7]]},"tank":{"size":[1254,1254],"frames":[[65,9,154,245,52.5],[309,8,150,246,49.3],[574,9,97,245,41.2],[799,9,132,244,48.9],[1036,9,151,244,45.7],[52,260,170,246,53.8],[299,260,161,245,52.2],[544,262,162,243,49.4],[790,260,156,246,45.8],[1034,260,159,246,48.1],[67,511,148,238,47.3],[317,510,142,238,56.7],[575,511,104,237,34.1],[796,512,138,236,34.4],[1037,513,155,235,51.3],[60,754,156,239,56.1],[298,754,161,239,54.4],[536,755,169,233,49.4],[797,756,152,237,39.1],[1034,756,155,237,44.9],[45,999,178,248,59.0],[292,994,180,254,44.7],[505,997,205,249,50.0],[758,1005,195,240,40.5],[1021,1003,186,242,52.7]]},"scout":{"size":[780,1000],"file":"oath_scout.webp","frames":[[33,11,90,179,56.06],[191,11,85,179,55.04],[365,11,50,179,51.67],[508,11,75,179,42.23],[659,11,85,179,45.04],[33,211,89,181,55.43],[192,211,83,179,54.31],[365,211,50,179,51.18],[509,211,74,180,41.81],[660,211,84,181,43.29],[33,411,90,179,56.06],[191,411,85,179,55.04],[365,411,50,179,51.67],[508,411,75,179,42.23],[659,411,85,179,45.04],[32,611,92,181,57.17],[190,611,87,181,56.0],[364,611,51,181,53.79],[507,611,77,180,42.96],[658,611,87,181,47.26],[32,811,90,179,57.17],[188,811,85,179,58.57],[362,811,51,179,56.54],[504,811,77,179,46.33],[658,811,85,179,46.21]]},"medic":{"size":[780,1000],"file":"oath_medic.webp","frames":[[41,11,73,179,49.96],[201,11,66,179,43.91],[365,11,49,179,52.44],[515,11,62,179,52.23],[666,11,70,179,49.49],[42,211,71,181,48.64],[201,211,66,179,43.65],[366,211,47,180,52.17],[516,211,61,179,50.42],[667,211,69,181,47.51],[41,411,73,179,49.96],[201,411,66,179,43.91],[365,411,49,179,52.44],[515,411,62,179,52.23],[666,411,70,179,49.49],[40,611,75,181,51.86],[200,611,68,180,44.42],[365,611,50,181,52.57],[514,611,64,181,54.09],[665,611,72,181,51.35],[40,811,73,179,51.33],[198,811,67,179,47.73],[363,811,50,179,55.39],[514,811,61,179,54.72],[665,811,71,179,50.21]]},"duelist":{"size":[780,1000],"file":"oath_duelist.webp","frames":[[29,11,98,179,55.28],[184,11,99,179,52.21],[370,11,40,179,49.43],[508,11,76,179,60.6],[660,11,83,179,57.12],[30,211,97,181,53.96],[187,211,95,179,50.66],[370,211,40,179,49.04],[508,211,75,179,59.87],[660,211,82,180,56.41],[29,411,98,179,55.28],[184,411,99,179,52.21],[370,411,40,179,49.43],[508,411,76,179,60.6],[660,411,83,179,57.12],[28,611,99,181,57.07],[181,611,103,181,53.78],[370,611,40,181,50.63],[507,611,78,181,62.32],[659,611,85,181,58.3],[29,811,98,179,55.28],[184,811,96,179,53.84],[368,811,40,179,54.43],[506,811,75,179,64.08],[659,811,83,179,58.33]]},"tide":{"size":[780,1000],"file":"oath_tide.webp","frames":[[36,11,85,179,45.95],[194,11,80,179,47.4],[358,11,63,179,51.75],[511,11,69,179,50.59],[660,11,84,179,52.58],[36,211,84,181,44.15],[194,211,79,180,46.13],[360,211,61,179,49.2],[513,211,67,180,47.56],[660,211,84,181,50.64],[36,411,85,179,45.95],[194,411,80,179,47.4],[358,411,63,179,51.75],[511,411,69,179,50.59],[660,411,84,179,52.58],[35,611,86,181,48.64],[194,611,81,181,48.22],[356,611,66,181,55.23],[508,611,72,181,55.42],[659,611,86,181,55.04],[35,811,85,179,47.13],[192,811,80,179,49.9],[357,811,63,179,53.34],[510,811,68,179,52.8],[658,811,85,179,54.31]]},"falcon":{"size":[780,1000],"file":"oath_falcon.webp","frames":[[40,11,74,179,56.56],[198,11,71,179,51.49],[358,11,63,179,47.95],[513,11,66,179,47.09],[665,11,74,179,43.64],[41,211,73,181,54.56],[198,211,71,179,50.67],[358,211,63,180,48.27],[513,211,65,180,48.15],[666,211,72,181,42.31],[40,411,74,179,56.56],[198,411,71,179,51.49],[358,411,63,179,47.95],[513,411,66,179,47.09],[665,411,74,179,43.64],[39,611,76,181,57.96],[197,611,73,181,52.12],[358,611,64,180,47.63],[512,611,68,181,48.31],[665,611,74,181,44.95],[39,811,75,179,57.14],[194,811,75,179,54.08],[357,811,62,179,50.34],[509,811,67,179,52.35],[664,811,74,179,44.99]]},"bastion":{"size":[780,1000],"file":"oath_bastion.webp","frames":[[35,11,87,179,42.72],[194,11,78,179,42.71],[366,11,47,179,46.62],[515,11,63,179,42.46],[657,11,89,179,56.55],[35,211,86,182,42.13],[195,211,77,179,41.95],[367,211,46,180,45.92],[515,211,62,180,43.62],[658,211,88,181,55.28],[35,411,87,179,42.72],[194,411,78,179,42.71],[366,411,47,179,46.62],[515,411,63,179,42.46],[657,411,89,179,56.55],[33,611,90,181,44.96],[193,611,80,181,43.67],[366,611,48,180,46.04],[514,611,64,181,44.69],[657,611,91,181,56.67],[33,811,88,179,44.5],[191,811,79,179,45.97],[364,811,47,179,50.88],[512,811,64,179,46.49],[656,811,89,179,57.67]]},"spark":{"size":[780,1000],"file":"oath_spark.webp","frames":[[37,11,82,179,45.77],[197,11,75,179,52.3],[363,11,54,179,56.91],[515,11,60,179,49.09],[662,11,80,179,47.98],[37,211,82,181,44.45],[197,211,75,181,51.58],[363,211,54,179,56.09],[515,211,60,180,48.5],[663,211,78,181,46.33],[37,411,82,179,45.77],[197,411,75,179,52.3],[363,411,54,179,56.91],[515,411,60,179,49.09],[662,411,80,179,47.98],[35,611,84,181,49.24],[196,611,76,180,55.21],[362,611,55,181,59.67],[515,611,62,181,49.78],[661,611,82,181,49.84],[35,811,84,179,47.06],[193,811,77,179,56.13],[360,811,55,179,61.33],[514,811,59,179,51.62],[661,811,80,179,49.23]]},"frost":{"size":[780,1000],"file":"oath_frost.webp","frames":[[33,11,91,179,52.08],[195,11,77,179,54.4],[363,11,54,179,53.2],[511,11,69,179,47.23],[666,11,72,179,50.71],[34,211,89,181,50.68],[196,211,75,181,53.7],[364,211,53,179,51.67],[512,211,67,180,46.78],[667,211,70,181,49.38],[33,411,91,179,52.08],[195,411,77,179,54.4],[363,411,54,179,53.2],[511,411,69,179,47.23],[666,411,72,179,50.71],[31,611,94,181,53.62],[194,611,78,180,56.92],[362,611,55,180,55.29],[510,611,70,181,49.51],[665,611,73,181,52.94],[31,811,92,179,53.69],[192,811,77,179,58.3],[362,811,53,179,56.09],[509,811,68,179,50.86],[665,811,73,179,51.38]]},"storm":{"size":[780,1000],"file":"oath_storm.webp","frames":[[37,11,82,179,56.55],[198,11,71,179,56.61],[366,11,46,179,56.75],[510,11,72,179,48.63],[663,11,77,179,43.92],[38,211,80,181,55.34],[201,211,68,181,53.55],[367,211,44,179,56.48],[511,211,69,180,48.88],[663,211,77,181,42.78],[37,411,82,179,56.55],[198,411,71,179,56.61],[366,411,46,179,56.75],[510,411,72,179,48.63],[663,411,77,179,43.92],[36,611,83,181,58.5],[196,611,75,180,57.97],[365,611,50,181,56.26],[509,611,75,180,49.44],[662,611,79,181,45.7],[37,811,81,179,57.25],[198,811,69,179,58.25],[364,811,48,179,58.55],[508,811,73,179,50.7],[662,811,78,179,44.64]]},"thorn":{"size":[780,1000],"file":"oath_thorn.webp","frames":[[38,11,81,179,43.18],[197,11,73,179,39.89],[364,11,52,179,43.98],[514,11,64,179,55.7],[661,11,81,179,56.79],[38,211,80,181,42.52],[198,211,72,180,39.48],[364,211,52,180,44.6],[514,211,64,179,54.8],[662,211,79,180,55.85],[38,411,81,179,43.18],[197,411,73,179,39.89],[364,411,52,179,43.98],[514,411,64,179,55.7],[661,411,81,179,56.79],[36,611,84,181,45.37],[196,611,75,180,40.4],[364,611,52,180,44.22],[513,611,66,181,57.42],[660,611,83,181,57.9],[36,811,81,179,45.65],[194,811,73,179,44.0],[362,811,52,179,47.83],[510,811,66,179,60.07],[660,811,81,179,58.03]]},"echo":{"size":[780,1000],"file":"oath_echo.webp","frames":[[41,11,74,179,46.98],[199,11,70,179,41.72],[365,11,49,179,51.86],[516,11,59,179,56.41],[665,11,74,179,53.87],[42,211,72,181,45.52],[200,211,68,179,41.52],[365,211,48,180,52.94],[516,211,59,179,55.27],[666,211,72,180,52.86],[41,411,74,179,46.98],[199,411,70,179,41.72],[365,411,49,179,51.86],[516,411,59,179,56.41],[665,411,74,179,53.87],[41,611,75,181,48.22],[199,611,71,180,41.61],[364,611,50,181,54.35],[515,611,62,181,57.21],[664,611,75,181,55.62],[40,811,74,179,48.33],[196,811,72,179,44.72],[363,811,48,179,57.11],[513,811,60,179,60.47],[664,811,74,179,55.23]]},"solar":{"size":[780,1000],"file":"oath_solar.webp","frames":[[39,11,77,179,47.73],[199,11,69,179,42.48],[364,11,52,179,50.03],[514,11,63,179,54.49],[666,11,71,179,49.15],[40,211,76,181,45.87],[200,211,67,180,42.48],[364,211,51,180,51.1],[515,211,62,179,53.29],[667,211,69,181,48.04],[39,411,77,179,47.73],[199,411,69,179,42.48],[364,411,52,179,50.03],[514,411,63,179,54.49],[666,411,71,179,49.15],[38,611,78,181,49.78],[199,611,70,180,41.95],[363,611,53,181,52.07],[513,611,64,181,56.68],[666,611,71,181,50.26],[38,811,78,179,48.4],[196,811,71,179,45.51],[361,811,52,179,55.8],[512,811,63,179,57.67],[666,811,70,179,49.85]]},"lunar":{"size":[780,1000],"file":"oath_lunar.webp","frames":[[26,11,104,179,45.22],[189,11,88,179,41.33],[362,11,56,179,52.82],[503,11,85,179,53.41],[652,11,100,179,56.2],[26,211,104,181,44.28],[189,211,87,179,41.48],[364,211,52,179,51.65],[504,211,84,179,51.16],[652,211,100,181,55.05],[26,411,104,179,45.22],[189,411,88,179,41.33],[362,411,56,179,52.82],[503,411,85,179,53.41],[652,411,100,179,56.2],[25,611,105,181,46.78],[189,611,90,180,40.86],[359,611,62,180,53.59],[502,611,86,181,56.92],[651,611,101,181,57.96],[25,811,105,179,45.74],[188,811,88,179,42.47],[362,811,56,179,52.82],[501,811,87,179,54.48],[651,811,101,179,56.63]]},"tempest":{"size":[780,1000],"file":"oath_tempest.webp","frames":[[24,11,107,179,53.29],[173,11,121,179,40.62],[361,11,57,179,35.86],[495,11,103,179,53.34],[643,11,118,179,50.4],[25,211,105,181,52.38],[174,211,119,180,40.93],[362,211,55,181,37.26],[496,211,101,180,52.8],[643,211,118,181,49.54],[24,411,107,179,53.29],[173,411,121,179,40.62],[361,411,57,179,35.86],[495,411,103,179,53.34],[643,411,118,179,50.4],[23,611,108,182,54.75],[172,611,123,180,40.77],[361,611,57,180,35.03],[494,611,105,181,54.59],[642,611,120,181,51.21],[24,811,107,179,53.29],[171,811,121,179,42.27],[359,811,57,179,39.37],[493,811,103,179,55.29],[642,811,119,179,50.82]]},"phoenix":{"size":[780,1000],"file":"oath_phoenix.webp","frames":[[30,11,95,179,46.2],[188,11,91,179,40.83],[363,11,53,179,57.14],[502,11,87,179,57.32],[657,11,89,179,52.36],[30,211,95,181,44.38],[190,211,87,179,39.79],[365,211,50,179,54.94],[504,211,85,179,54.34],[658,211,88,181,50.25],[30,411,95,179,46.2],[188,411,91,179,40.83],[363,411,53,179,57.14],[502,411,87,179,57.32],[657,411,89,179,52.36],[29,611,97,181,48.43],[186,611,95,180,42.11],[361,611,57,181,59.08],[499,611,91,181,59.92],[656,611,91,181,56.15],[29,811,96,179,46.76],[187,811,91,179,41.93],[363,811,53,179,57.14],[501,811,87,179,58.47],[656,811,90,179,52.89]]},"void":{"size":[780,1000],"file":"oath_void.webp","frames":[[37,10,81,180,47.75],[195,11,78,180,45.67],[363,11,54,180,48.74],[512,11,68,179,51.84],[660,11,83,180,55.26],[38,210,79,182,46.5],[197,211,75,179,44.7],[364,211,53,180,47.7],[512,211,66,179,52.81],[661,211,82,181,53.24],[37,410,81,180,47.75],[195,411,78,180,45.67],[363,411,54,180,48.74],[512,411,68,179,51.84],[660,411,83,180,55.26],[36,610,83,182,48.98],[193,611,81,181,47.3],[361,611,57,181,50.61],[511,611,71,181,52.61],[659,611,85,181,56.47],[37,810,80,180,48.35],[194,811,76,180,48.19],[362,811,53,180,51.55],[508,811,72,179,54.51],[658,811,85,180,56.31]]},"astral":{"size":[780,1000],"file":"oath_astral.webp","frames":[[37,11,81,180,50.47],[193,11,81,179,46.0],[366,11,47,180,56.91],[511,11,70,179,53.61],[664,11,76,179,51.58],[38,211,80,182,48.67],[195,211,78,179,44.86],[367,211,45,180,56.05],[512,211,67,179,53.4],[664,211,75,181,50.76],[37,411,81,180,50.47],[193,411,81,179,46.0],[366,411,47,180,56.91],[511,411,70,179,53.61],[664,411,76,179,51.58],[36,611,83,182,51.72],[190,611,86,181,47.18],[364,611,51,181,58.34],[509,611,75,181,54.32],[663,611,78,181,53.09],[37,811,81,180,50.47],[193,811,80,179,46.57],[365,811,48,180,57.81],[510,811,71,179,54.27],[663,811,77,179,52.21]]}};
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
 Object.assign(el.style,{width:box[2]*scale+'px',height:height+'px',backgroundImage:heroArtBackground(atlas.file || 'motion_'+frame.id+'.png'),backgroundSize:`${atlas.size[0]*scale}px ${atlas.size[1]*scale}px`,backgroundPosition:`${-box[0]*scale}px ${-box[1]*scale}px`,opacity:String(opacity),transformOrigin:`${box[4]}% 90%`,transform:`translate(${-box[4]}%,-100%) translate(${recoil.x}px,${30+bob+recoil.y}px) rotate(${lean}deg) scaleX(${frame.flip?-1:1})`});
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
 const row=HERO_IDS.indexOf(id);
 const hue=getSelectedCharacter().effectHue || 0;
 el.style.filter=hue?'hue-rotate('+hue+'deg)':'';
 el.style.backgroundImage="url('hero_effects.png')";el.style.backgroundSize='400% 500%';el.style.backgroundPosition=`${column*100/3}% ${row*25}%`;
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
 const kit=getSelectedCharacter(),id=heroFamily(),range=kit.range || (id==='tank'?420:600);if(!closest||dist>range*range)return;
 const target=hitEnemyAim(closest),angle=Math.atan2(target.y-playerY,target.x-playerX);heroAttackAngle=angle;heroShotUntil=gameNow()+Math.min(160,getPlayerStats().shotInterval*.55);heroShots++;
 const signature=!!kit.every && heroShots%kit.every===0;
 const strong=signature && !!kit.strike || gameData.character==='balance' && heroShots%5===0;
 if(signature && kit.heal) {
  playerCurrentHp=Math.min(playerMaxHp,playerCurrentHp+kit.heal);updateHpDisplay();
  heroFx(id,2,playerX,playerY,0,64);
 }
 const awakened=heroAscended()&&gameNow()-heroLastAwakened>=12000;
 const trained=(activeTraining?.level||0)>=3;
 const speed=id==='speed'?15:id==='power'?7:id==='tank'?6:9;
 for(let i=0;i<Math.min(40,count);i++){
  if(bullets.length>=220)break;
  const a=angle+(count>1?-.15+.3*i/(count-1):0),el=acquireBulletElement();el.className='bullet hero-bullet';
  const visual=Math.min(68,Math.max(id==='tank'?36:22,size*1.8));
  Object.assign(el.style,{width:visual+'px',height:visual+'px',left:playerX+'px',top:playerY+'px',transform:`translate(-50%,-50%) rotate(${a}rad)`});heroEffect(el,id,strong||trained?3:1);worldLayer.appendChild(el);
  bullets.push({element:el,x:playerX,y:playerY,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage:damage*(strong?(kit.strike||1.75):1),hero:id,kit,pulse:signature&&i===0?kit.pulse:0,hitShape:hitPose('shot/'+id+'/'+(strong||trained?3:1),visual,visual,.5,.5,a),hit:new Set(),remaining:kit.pierce || (id==='speed'?2:1),expiresAt:gameNow()+range/speed*1000/60});
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
 const kit=b.kit || {};
 if(b.hero==='power')for(const other of [...enemies])if(other!==e&&hitEnemyArea(other,x,y,kit.splash || 65))damageEnemy(other,b.damage*(kit.splashPower || .3));
 if(b.pulse) {
  const radius=b.pulse;b.pulse=0;heroFx(b.hero,2,x,y,0,Math.min(240,radius*1.3));
  for(const target of [...enemies]) if(hitEnemyArea(target,x,y,radius)) damageEnemy(target,b.damage*kit.power);
 }
 if(b.hero==='tank'&&e.type!=='boss'&&enemies.includes(e)){
  const a=Math.atan2(b.vy,b.vx),arena=getArenaSize();e.x=Math.max(25,Math.min(arena.width-25,e.x+Math.cos(a)*20));e.y=Math.max(25,Math.min(arena.height-25,e.y+Math.sin(a)*20));
  e.hitPrevX=e.x;e.hitPrevY=e.y;positionEnemy(e);enemySpatialVersion++;
 }
}
