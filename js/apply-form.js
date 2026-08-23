/* Boost Web Agency — formulaire multi-étapes "Appliquer"
   Fonctionne comme une vraie application : pas de rechargement de page,
   conservation des données, validation par étape, récapitulatif, envoi. */

(function(){
  const state = {
    step: 1,
    totalSteps: 8, // 6 questions + récap + confirmation
    data: {
      siteType: '', siteTypeOther: '',
      goal: '', goalOther: '',
      features: [], featuresOther: '',
      hasSite: '',
      timeline: '',
      name: '', email: '', phone: '', city: ''
    }
  };

  const root = document.getElementById('applyForm');
  if(!root) return;

  const steps = Array.from(root.querySelectorAll('.form-step'));
  const progressWrap = document.getElementById('progressBar');

  function buildProgress(){
    const questionSteps = 6;
    let html = '';
    for(let i=1;i<=questionSteps;i++){
      html += `<div class="progress-step" data-step="${i}">${i}</div>`;
      if(i < questionSteps){
        html += `<div class="progress-line"><div class="progress-line-fill"></div></div>`;
      }
    }
    progressWrap.innerHTML = html;
  }
  buildProgress();

  function updateProgress(){
    const nodes = progressWrap.querySelectorAll('.progress-step');
    const fills = progressWrap.querySelectorAll('.progress-line-fill');
    nodes.forEach(n=>{
      const s = Number(n.dataset.step);
      n.classList.toggle('active', s === Math.min(state.step,6));
      n.classList.toggle('done', s < state.step);
    });
    fills.forEach((f,i)=>{ f.style.width = (i+1) < state.step ? '100%' : '0%'; });
    progressWrap.style.display = state.step <= 6 ? 'flex' : 'none';
  }

  function showStep(n){
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === n));
    updateProgress();
    root.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function setError(fieldEl, msg){
    fieldEl.classList.toggle('has-error', !!msg);
    const err = fieldEl.querySelector('.field-error');
    if(err) err.textContent = msg || '';
  }

  function validateStep(n){
    let ok = true;
    if(n===1){
      if(!state.data.siteType){ ok=false; flashChoiceError('step1'); }
      if(state.data.siteType === 'Autre' && !state.data.siteTypeOther.trim()){ ok=false; }
    }
    if(n===2){
      if(!state.data.goal){ ok=false; flashChoiceError('step2'); }
      if(state.data.goal === 'Autre' && !state.data.goalOther.trim()){ ok=false; }
    }
    if(n===3){
      if(state.data.features.includes('Autre') && !state.data.featuresOther.trim()){ ok=false; }
    }
    if(n===4){
      if(!state.data.hasSite){ ok=false; flashChoiceError('step4'); }
    }
    if(n===5){
      if(!state.data.timeline){ ok=false; flashChoiceError('step5'); }
    }
    if(n===6){
      const nameF = root.querySelector('[data-field="name"]');
      const emailF = root.querySelector('[data-field="email"]');
      const phoneF = root.querySelector('[data-field="phone"]');
      setError(nameF, '');
      setError(emailF, '');
      setError(phoneF, '');
      if(!state.data.name.trim()){ setError(nameF, 'Merci d’indiquer votre nom complet.'); ok=false; }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.data.email.trim());
      if(!emailOk){ setError(emailF, 'Merci d’indiquer un email valide.'); ok=false; }
      const phoneOk = state.data.phone.replace(/[^0-9+]/g,'').length >= 8;
      if(!phoneOk){ setError(phoneF, 'Merci d’indiquer un numéro valide.'); ok=false; }
    }
    return ok;
  }

  function flashChoiceError(stepKey){
    const grid = root.querySelector(`[data-choice-group="${stepKey}"]`);
    if(!grid) return;
    grid.style.outline = '1.5px solid #ff6b6b';
    grid.style.borderRadius = '14px';
    setTimeout(()=>{ grid.style.outline = 'none'; }, 900);
  }

  /* ---- Choice cards (single + multi) ---- */
  root.addEventListener('click', (e)=>{
    const card = e.target.closest('.choice-card');
    if(!card) return;
    const group = card.closest('[data-choice-group]');
    const isMulti = card.hasAttribute('data-multi');
    const value = card.dataset.value;
    const key = group.dataset.key;

    if(isMulti){
      card.classList.toggle('selected');
      const checked = card.classList.contains('selected');
      if(checked){ if(!state.data[key].includes(value)) state.data[key].push(value); }
      else{ state.data[key] = state.data[key].filter(v=>v!==value); }
    } else {
      group.querySelectorAll('.choice-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      state.data[key] = value;
    }
    toggleOtherField(key, group);
  });

  function toggleOtherField(key, group){
    const otherWrap = root.querySelector(`[data-other-for="${key}"]`);
    if(!otherWrap) return;
    let show = false;
    if(Array.isArray(state.data[key])) show = state.data[key].includes('Autre');
    else show = state.data[key] === 'Autre';
    otherWrap.style.display = show ? 'block' : 'none';
  }

  /* ---- Text inputs ---- */
  root.addEventListener('input', (e)=>{
    const field = e.target.dataset.field;
    if(!field) return;
    state.data[field] = e.target.value;
  });

  /* ---- Navigation ---- */
  root.addEventListener('click', (e)=>{
    const next = e.target.closest('[data-action="next"]');
    const prev = e.target.closest('[data-action="prev"]');
    const submit = e.target.closest('[data-action="submit"]');
    const restart = e.target.closest('[data-action="restart"]');

    if(next){
      if(!validateStep(state.step)) return;
      if(state.step === 6){ buildRecap(); }
      state.step = Math.min(state.step+1, state.totalSteps);
      showStep(state.step);
    }
    if(prev){
      state.step = Math.max(state.step-1, 1);
      showStep(state.step);
    }
    if(submit){
      sendApplication();
      state.step = 8;
      showStep(state.step);
    }
    if(restart){
      window.location.href = 'index.html';
    }
  });

  function buildRecap(){
    const mount = document.getElementById('recapList');
    if(!mount) return;
    const d = state.data;
    const rows = [
      ['Type de site', d.siteType === 'Autre' ? d.siteTypeOther : d.siteType],
      ['Objectif principal', d.goal === 'Autre' ? d.goalOther : d.goal],
      ['Fonctionnalités souhaitées', d.features.length ? d.features.map(f=> f==='Autre' ? d.featuresOther : f).join(', ') : '—'],
      ['Site existant', d.hasSite],
      ['Lancement souhaité', d.timeline],
      ['Coordonnées', `${d.name} · ${d.email} · ${d.phone}${d.city ? ' · ' + d.city : ''}`]
    ];
    mount.innerHTML = rows.map(([label,value])=>`
      <div class="recap-item">
        <div class="recap-label">${label}</div>
        <div class="recap-value">${value}</div>
      </div>`).join('');
  }

  async function sendApplication(){
    try{
      const settings = await Content.load('content/settings.json');
      const d = state.data;
      const netlifyPayload = {
        'form-name': 'appliquer',
        siteType: d.siteType === 'Autre' ? d.siteTypeOther : d.siteType,
        goal: d.goal === 'Autre' ? d.goalOther : d.goal,
        features: d.features.map(f=> f==='Autre' ? d.featuresOther : f).join(', ') || '—',
        hasSite: d.hasSite,
        timeline: d.timeline,
        name: d.name,
        email: d.email,
        phone: d.phone,
        city: d.city || '—'
      };

      // 1) Enregistre la demande dans Netlify Forms (visible dans ton
      //    tableau de bord Netlify > Forms, notification email possible).
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(netlifyPayload).toString()
      }).catch(err => console.error('Netlify Forms', err));

      // 2) Ouvre aussi WhatsApp avec la demande pré-remplie.
      const lines = [
        `Nouvelle demande de projet — Boost Web Agency`,
        `Type de site: ${netlifyPayload.siteType}`,
        `Objectif: ${netlifyPayload.goal}`,
        `Fonctionnalités: ${netlifyPayload.features}`,
        `Site existant: ${netlifyPayload.hasSite}`,
        `Lancement souhaité: ${netlifyPayload.timeline}`,
        `Nom: ${netlifyPayload.name}`,
        `Email: ${netlifyPayload.email}`,
        `Téléphone: ${netlifyPayload.phone}`,
        `Ville/Pays: ${netlifyPayload.city}`
      ].join('\n');
      const waLink = `${settings.whatsapp_link}?text=${encodeURIComponent(lines)}`;
      window.open(waLink, '_blank');
    }catch(err){ console.error('Envoi impossible', err); }
  }

  showStep(1);
})();
