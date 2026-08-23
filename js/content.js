/* Boost Web Agency — content loader
   Fetches JSON content files (editable via Decap CMS) and renders shared
   pieces (nav, footer) plus page-specific dynamic sections. */

const ICONS = {
  layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1.2" fill="currentColor"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/><circle cx="15.5" cy="10.5" r="1.2" fill="currentColor"/><path d="M12 21a2 2 0 0 1-2-2c0-1 1-1.2 1-2.2 0-.7-.6-1.1-1.3-1.1H8a3 3 0 0 1-3-3"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 15l-2 5 5-2 8-8a4 4 0 0 0-3-3l-8 8z"/><path d="M13 5a10 10 0 0 1 6 6"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 4 3.4.6.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>'
};

const Content = {
  base: '',
  async load(path){
    const res = await fetch(this.base + path, { cache: 'no-store' });
    if(!res.ok) throw new Error('Impossible de charger ' + path);
    return res.json();
  }
};

function el(html){
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

async function renderHeader(activePage){
  try{
    const [settings, nav] = await Promise.all([
      Content.load('content/settings.json'),
      Content.load('content/navigation.json')
    ]);
    const mount = document.getElementById('site-header');
    if(!mount) return;
    const links = nav.items
      .filter(i => i.visible)
      .sort((a,b)=>a.order-b.order)
      .map(i => `<a href="${i.link}" class="${activePage===i.link ? 'active' : ''}">${i.label}</a>`)
      .join('');
    mount.innerHTML = `
      <div class="nav">
        <a href="index.html" class="nav-logo">
          <img src="${settings.logo}" alt="${settings.site_name}">
          <span>${settings.site_name}</span>
        </a>
        <nav class="nav-links" id="navLinks">
          ${links}
          <a href="${nav.cta_link}" class="btn btn-primary nav-cta-mobile">${nav.cta_label}</a>
        </nav>
        <div class="nav-actions">
          <button class="theme-toggle" id="themeToggle" aria-label="Changer de thème">
            <span class="icon-moon">${moonIcon()}</span>
            <span class="icon-sun">${sunIcon()}</span>
          </button>
          <a href="${nav.cta_link}" class="btn btn-primary">${nav.cta_label}</a>
          <button class="nav-toggle" id="navToggle" aria-label="Ouvrir le menu"><span></span><span></span><span></span></button>
        </div>
      </div>`;
  }catch(e){ console.error(e); }
}

function moonIcon(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'; }
function sunIcon(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'; }

async function renderFooter(){
  try{
    const settings = await Content.load('content/settings.json');
    const nav = await Content.load('content/navigation.json');
    const mount = document.getElementById('site-footer');
    if(!mount) return;
    const links = nav.items.filter(i=>i.visible).sort((a,b)=>a.order-b.order)
      .map(i=>`<a href="${i.link}">${i.label}</a>`).join('');
    mount.innerHTML = `
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <a href="index.html" class="nav-logo"><img src="${settings.logo}" alt="${settings.site_name}"><span>${settings.site_name}</span></a>
            <p>${settings.footer_text}</p>
          </div>
          <div class="footer-cols">
            <div class="footer-col">
              <h4>Navigation</h4>
              ${links}
            </div>
            <div class="footer-col">
              <h4>Contact</h4>
              <a href="mailto:${settings.contact_email}">${settings.contact_email}</a>
              <a href="${settings.whatsapp_link}" target="_blank" rel="noopener">${settings.whatsapp_number}</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>${settings.copyright}</p>
          <div class="socials">
            <a href="${settings.whatsapp_link}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICONS.whatsapp}</a>
            ${settings.instagram_link ? `<a href="${settings.instagram_link}" target="_blank" rel="noopener" aria-label="Instagram">${ICONS.instagram}</a>` : ''}
          </div>
        </div>
      </div>`;
  }catch(e){ console.error(e); }
}

/* ---- Dynamic section renderers (used by individual pages) ---- */

function renderServiceCards(items, targetId, detailed=false){
  const mount = document.getElementById(targetId);
  if(!mount) return;
  mount.innerHTML = items.sort((a,b)=>a.order-b.order).map((s,i)=>`
    <div class="card service-card reveal reveal-delay-${(i%3)+1}">
      <div class="icon-badge">${ICONS[s.icon] || ICONS.layout}</div>
      <h3>${s.title}</h3>
      <p>${s.short_description}</p>
    </div>`).join('');
  observeReveals();
}

function renderProcessCards(items, targetId){
  const mount = document.getElementById(targetId);
  if(!mount) return;
  mount.innerHTML = items.sort((a,b)=>a.order-b.order).map((p,i)=>`
    <div class="card process-card reveal reveal-delay-${(i%3)+1}">
      <span class="process-number">${p.number}</span>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
    </div>`).join('');
  observeReveals();
}

function renderPortfolioCards(items, targetId, limit){
  const mount = document.getElementById(targetId);
  if(!mount) return;
  let list = items.filter(p=>p.visible !== false).sort((a,b)=>a.order-b.order);
  if(limit) list = list.slice(0, limit);
  mount.innerHTML = list.map((p,i)=>`
    <div class="card portfolio-card reveal reveal-delay-${(i%3)+1}" data-category="${p.category}">
      <div class="portfolio-media"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="portfolio-body">
        <div class="portfolio-category">${p.category}</div>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        ${p.url ? `<a class="portfolio-link" href="${p.url}" target="_blank" rel="noopener">Voir le site ${ICONS.arrow}</a>` : `<span class="portfolio-link" style="opacity:.5;cursor:default">Projet interne</span>`}
      </div>
    </div>`).join('');
  observeReveals();
}

function renderTestimonials(items, targetId){
  const mount = document.getElementById(targetId);
  if(!mount) return;
  mount.innerHTML = items.filter(t=>t.visible !== false).sort((a,b)=>a.order-b.order).map((t,i)=>`
    <div class="card testimonial-card reveal reveal-delay-${(i%3)+1}">
      <div class="stars">${Array.from({length:t.rating||5}).map(()=>ICONS.star).join('')}</div>
      <blockquote>“${t.comment}”</blockquote>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${(t.name||'?').charAt(0)}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-role">${t.role}</div>
        </div>
      </div>
    </div>`).join('');
  observeReveals();
}

function renderFAQ(items, targetId){
  const mount = document.getElementById(targetId);
  if(!mount) return;
  mount.innerHTML = items.filter(f=>f.visible !== false).sort((a,b)=>a.order-b.order).map(f=>`
    <div class="faq-item">
      <button class="faq-question" type="button">
        <span>${f.question}</span>
        <span class="plus"></span>
      </button>
      <div class="faq-answer"><div class="faq-answer-inner">${f.answer}</div></div>
    </div>`).join('');
  mount.querySelectorAll('.faq-item').forEach(item=>{
    item.querySelector('.faq-question').addEventListener('click', ()=>{
      const isOpen = item.classList.contains('is-open');
      mount.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('is-open'));
      if(!isOpen) item.classList.add('is-open');
    });
  });
}

function observeReveals(){
  const els = document.querySelectorAll('.reveal:not(.is-visible)');
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  els.forEach(e=>io.observe(e));
}
