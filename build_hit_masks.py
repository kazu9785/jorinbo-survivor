"""Rebuild the static silhouette table from the game's own PNGs (Pillow, NumPy, SciPy and Node).
Usage: python build_masks.py /path/to/game; no network, no runtime image reads."""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import base64, json, math, re, sys, subprocess
import numpy as np
p=Path(sys.argv[1]).resolve()
stages=json.loads(subprocess.check_output(['node','-e',"""const fs=require('fs'),vm=require('vm');let c=vm.createContext({});vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);console.log(vm.runInContext('JSON.stringify({units:STAGE_ENEMIES,legacy:LEGACY_STAGE_ENEMIES.length,extra:EXTRA_BOSSES})',c));""",str(p/'stages.js')]))
heroes=json.loads(re.search(r'const HERO_MOTION_FRAMES=(\{[^\n]+\});',(p/'heroes.js').read_text()).group(1))
shapes={};alphas={}
def alpha(name):
 if name not in alphas:
  with Image.open(p/name) as im:
   im.load();alphas[name]=im.getchannel('A')
 return alphas[name]
def add(key,name,w,h,box=None,contain=False,effect=False):
 im=alpha(name);nx=max(2,math.ceil(w/1.5));ny=max(2,math.ceil(h/1.5))
 if contain:
  ratio=min(nx/im.width,ny/im.height);ww=max(1,round(im.width*ratio));hh=max(1,round(im.height*ratio))
  src=im.resize((ww,hh),Image.Resampling.BOX);canvas=Image.new('L',(nx,ny));canvas.paste(src,((nx-ww)//2,(ny-hh)//2));small=canvas
 else:small=im.resize((nx,ny),Image.Resampling.BOX,box=box)
 mask=np.asarray(small)>=(108 if effect else 96)
 # Detached specks of light are not a physical part of the sprite.
 labels,ct=ndimage.label(mask,np.ones((3,3),int));sizes=np.bincount(labels.ravel());keep=(sizes>= (3 if effect else 2));keep[0]=False;mask=keep[labels]
 assert mask.any(),key
 yy,xx=np.where(mask);cy,cx=float(yy.mean()),float(xx.mean())
 dist=ndimage.distance_transform_edt(np.pad(mask,1))[1:-1,1:-1]
 ys,xs=np.where(dist>=max(1,.55*dist.max())); j=int(np.argmin((xs-cx)**2+(ys-cy)**2))
 # Merge equal horizontal runs between adjacent rows. Holes remain holes.
 rectangles=[];opened={}
 for y,row in enumerate(mask):
  edge=np.diff(np.r_[0,row.astype(np.int8),0]);runs=list(zip(np.flatnonzero(edge==1).tolist(),np.flatnonzero(edge==-1).tolist()))
  for run,y0 in opened.items():
   if run not in runs:rectangles.extend((run[0],y0,run[1]-run[0],y-y0))
  opened={s:opened.get(s,y) for s in runs}
 for (x,x2),y0 in opened.items():rectangles.extend((x,y0,x2-x,ny-y0))
 assert max(rectangles)<=255 and len(rectangles)>0
 shapes[key]=[round(w,4),round(h,4),nx,ny,int(xs[j]),int(ys[j]),base64.b64encode(bytes(rectangles)).decode()]
def cell(name,cols,rows,idx):
 im=alpha(name);x=idx%cols;y=idx//cols
 return (im.width*x/cols,im.height*y/rows,im.width*(x+1)/cols,im.height*(y+1)/rows)
for ident,h in heroes.items():
 for k,(x,y,w,height,*_) in enumerate(h['frames']):
  rh={9:86,10:80,11:85,12:85}.get(k//5,88)
  add(f'hero/{ident}/{k}',h.get('file',f'motion_{ident}.png'),w*rh/height,rh,(x,y,x+w,y+height))
for i,ident in enumerate(('rookie','balance','power','speed','tank')):
 for col in (1,3):
  add(f'shot/{ident}/{col}','hero_effects.png',50,50,cell('hero_effects.png',4,5,i*4+col),effect=True)
for id,name,w,h in [('minion','slime.png',60,60),('treasure','slime.png',60,60),('shooter','のび太.png',50,70),('golem','ゴーレム.png',80,80),('rusher','常林暴.png',60,60)]:
 add('mob/'+id,name,w,h,contain=True)
for i,e in enumerate(stages['units']):
 if i<stages['legacy']:name='enemies_expansion.png';box=cell(name,5,3,i)
 else:name=f"enemies_tier{e['tier']}.png";box=cell(name,4,3,(i-stages['legacy'])%11)
 add('mob/'+e['id'],name,72,72,box)
for ix,b in enumerate([{}, {}, {}, {}, *stages['extra']]):
 for phase,size in [(1,150),(2,185)]:
  if ix<4:
   name=f'boss{ix+1}'+('_phase2' if phase==2 else '')+'.png'
   add(f'boss/{ix}/{phase}',name,size,size,contain=True)
  else:
   idx=b['atlas']
   if idx<5:name='bosses_expansion.png';box=cell(name,5,2,idx+(phase-1)*5)
   else:name=f'bosses_new_phase{phase}.png';box=cell(name,3,3,idx-5)
   add(f'boss/{ix}/{phase}',name,size,size,box)
turns=json.loads(re.search(r'const FOE_TURNS=(\{[^\n]+\});',(p/'motion-art.js').read_text()).group(1))
for key,(filename,row,rows) in turns.items():
 w,h=shapes[key][:2]
 for direction in range(8):
  add('turn/'+key+'/'+str(direction),filename,w,h,cell(filename,8,rows,row*8+direction))
table='const SPRITE_COLLISION_DATA = {\n'+',\n'.join('  '+json.dumps(k)+':'+json.dumps(v,separators=(',',':')) for k,v in shapes.items())+'\n};'
f=p/'collision.js';s=f.read_text()
start='/* BEGIN GENERATED SPRITE MASKS */';end='/* END GENERATED SPRITE MASKS */'
a=s.index(start)+len(start);b=s.index(end)
f.write_text(s[:a]+'\n'+table+'\n'+s[b:])
print('Masks:',len(shapes),'hero:',sum(len(h['frames']) for h in heroes.values()),'enemies:',5+len(stages['units']),'boss phases:',(4+len(stages['extra']))*2,'projectiles:',10,'table bytes:',len(table))
