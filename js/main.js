/* Boost Web Agency — shared behaviour (theme, nav, reveal, header scroll state) */

(function initTheme(){
  const saved = localStorage.getItem('bwa-theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const theme = saved || (prefersLight ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', theme);
})();

document.addEventListener('click', (e)=>{
  const toggle = e.target.closest('#themeToggle');
  if(toggle){
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bwa-theme', next);
  }
  const navToggle = e.target.closest('#navToggle');
  if(navToggle){
    const links = document.getElementById('navLinks');
    navToggle.classList.toggle('is-open');
    links.classList.toggle('is-open');
  }
  const link = e.target.closest('#navLinks a');
  if(link){
    document.getElementById('navToggle')?.classList.remove('is-open');
    document.getElementById('navLinks')?.classList.remove('is-open');
  }
});

window.addEventListener('DOMContentLoaded', ()=>{
  if(typeof observeReveals === 'function') observeReveals();
});

/* Header transparent en haut de page, opaque dès qu'on scroll */
function updateHeaderScrollState(){
  const header = document.getElementById('site-header');
  if(!header) return;
  header.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', updateHeaderScrollState, { passive: true });
window.addEventListener('DOMContentLoaded', updateHeaderScrollState);
