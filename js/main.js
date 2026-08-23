/* Boost Web Agency — shared behaviour (theme, nav, reveal) */

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
  document.querySelectorAll('.reveal').forEach(e=>{
    // in case content.js hasn't attached observers yet for static reveals
  });
  if(typeof observeReveals === 'function') observeReveals();
});
