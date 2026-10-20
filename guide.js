/* The HTML version describes the displayed release, not an online update check. */
(() => {
    'use strict';
    const version = document.querySelector('meta[name="app-version"]')?.content || '不明';
    document.querySelectorAll('.app-version').forEach(el => { el.textContent = 'Ver.' + version; });
    document.querySelectorAll('[data-info-dialog]').forEach(button => {
        const dialog = document.getElementById(button.dataset.infoDialog);
        if (!dialog) return;
        button.addEventListener('click', () => {
            if (!dialog.open) { dialog.showModal(); dialog.scrollTop = 0; }
        });
    });
})();
