function openGameHelp(sectionId) {
 const dialog=document.getElementById('play-guide');
 if(!dialog)return;
 if(!dialog.open)dialog.showModal();
 const section=sectionId && document.getElementById(sectionId);
 if(section){section.open=true;section.scrollIntoView({block:'start'});section.querySelector('summary')?.focus();}
 else dialog.scrollTop=0;
}
/* The HTML version describes the displayed release, not an online update check. */
(() => {
    'use strict';
    const version = document.querySelector('meta[name="app-version"]')?.content || '不明';
    document.querySelectorAll('.app-version').forEach(el => { el.textContent = 'Ver.' + version; });
    document.querySelectorAll('[data-info-dialog]').forEach(button => {
        const dialog = document.getElementById(button.dataset.infoDialog);
        if (!dialog) return;
        button.addEventListener('click', () => {
            if (button.dataset.infoDialog === 'release-guide' &&
                !(typeof isDeveloper !== 'undefined' && isDeveloper && typeof auth !== 'undefined' && auth?.currentUser)) return;
            if(button.dataset.infoDialog==='play-guide'){openGameHelp(button.dataset.guideSection);return;}
            if (!dialog.open) { dialog.showModal(); dialog.scrollTop = 0; }
        });
    });
})();

(() => {
 const dialog=document.getElementById('overview-guide');
 const frame=dialog?.querySelector('.overview-image-scroll');
 const button=document.getElementById('overview-zoom');
 if(!dialog||!frame||!button)return;
 function setZoom(zoomed){
  frame.classList.toggle('is-zoomed',zoomed);
  button.setAttribute('aria-pressed',String(zoomed));
  button.textContent=zoomed?'全体表示に戻す':'拡大する';
  frame.scrollTop=0;frame.scrollLeft=0;
 }
 button.addEventListener('click',()=>setZoom(button.getAttribute('aria-pressed')!=='true'));
 dialog.addEventListener('close',()=>setZoom(false));
})();
