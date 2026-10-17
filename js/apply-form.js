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

  // État d'envoi : verrous anti-doublon + dernière tentative en échec
  const send = { inFlight: false, done: false, attempt: null };

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
      submitApplication(submit);
    }
    if(e.target.closest('.apply-retry')){
      retryEmail();
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

  /* ---------- Envoi : e-mail (Formspree) + WhatsApp ---------- */
  function applicationFields(){
    const d = state.data;
    return {
      type_de_site: d.siteType === 'Autre' ? d.siteTypeOther : d.siteType,
      objectif: d.goal === 'Autre' ? d.goalOther : d.goal,
      fonctionnalites: d.features.map(f=> f==='Autre' ? d.featuresOther : f).join(', ') || '—',
      site_existant: d.hasSite,
      lancement_souhaite: d.timeline,
      nom: d.name.trim(),
      email: d.email.trim(),
      telephone: d.phone.trim(),
      ville_pays: d.city.trim() || '—'
    };
  }

  function whatsappText(f){
    return [
      `Nouvelle demande de projet — Boost Web Agency`,
      `Type de site: ${f.type_de_site}`,
      `Objectif: ${f.objectif}`,
      `Fonctionnalités: ${f.fonctionnalites}`,
      `Site existant: ${f.site_existant}`,
      `Lancement souhaité: ${f.lancement_souhaite}`,
      `Nom: ${f.nom}`,
      `Email: ${f.email}`,
      `Téléphone: ${f.telephone}`,
      `Ville/Pays: ${f.ville_pays}`
    ].join('\n');
  }

  const ui = {
    box: () => document.getElementById('applyConfirm'),
    icon: () => document.getElementById('applyIcon'),
    title: () => document.getElementById('applyTitle'),
    msg: () => document.getElementById('applyMessage'),
    note: () => document.getElementById('applyNote'),
    actions: () => document.getElementById('applyActions')
  };

  const ICON_ERROR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>';

  function paint(kind, title, message, note, buttons){
    ui.box().className = 'confirm-screen is-' + kind;
    ui.icon().innerHTML = kind === 'success' ? ICONS.check : (kind === 'error' ? ICON_ERROR : '');
    ui.title().textContent = title;
    ui.msg().innerHTML = '';
    String(message).split('\n').forEach((line, i)=>{
      if(i) ui.msg().appendChild(document.createElement('br'));
      ui.msg().appendChild(document.createTextNode(line));
    });
    ui.note().textContent = note || '';
    const box = ui.actions();
    box.innerHTML = '';
    (buttons || []).forEach(b => box.appendChild(b));
  }

  function retryButton(){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-outline apply-retry';
    b.textContent = 'Réessayer l’envoi par e-mail';
    return b;
  }
  function whatsappButton(url, label){
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.className = 'btn btn-outline'; a.textContent = label;
    return a;
  }

  function showOutcome(result, att){
    if(result.ok){
      send.done = true; send.attempt = null;
      paint('success', 'Merci !',
        'Votre demande a été envoyée avec succès.\nNous avons bien reçu votre projet et nous vous contacterons dans les 2 heures.',
        att.waOpened
          ? 'WhatsApp s’est ouvert dans un nouvel onglet : envoyez-y aussi le message pour une réponse plus rapide.'
          : 'Votre navigateur a bloqué l’ouverture de WhatsApp : utilisez le bouton ci-dessous pour nous écrire aussi par WhatsApp.',
        att.waOpened ? [] : [whatsappButton(att.waUrl, 'Ouvrir WhatsApp')]);
      return;
    }
    send.attempt = att;
    const retryable = !['not_configured','bad_config'].includes(result.code);
    const buttons = [];
    if(retryable) buttons.push(retryButton());
    if(!att.waOpened) buttons.push(whatsappButton(att.waUrl, 'Écrire sur WhatsApp'));
    paint('error', 'Votre demande n’a pas été envoyée par e-mail',
      result.message,
      att.waOpened
        ? 'WhatsApp s’est ouvert : vous pouvez y envoyer votre demande pour nous joindre.'
        : 'Vous pouvez aussi nous envoyer votre demande directement sur WhatsApp.',
      buttons);
  }

  async function submitApplication(submitBtn){
    if(send.inFlight || send.done) return;       // anti double-clic
    send.inFlight = true;
    if(submitBtn) submitBtn.disabled = true;

    // WhatsApp doit s'ouvrir pendant le clic : on s'assure que la config est déjà chargée
    if(!FormDelivery.state.ready) await FormDelivery.ready;

    const f = applicationFields();
    const att = {
      waUrl: FormDelivery.whatsappUrl(whatsappText(f)),
      waOpened: false,
      payload: Object.assign({
        formulaire: 'Appliquer (projet)',
        submission_id: FormDelivery.newId(),
        page: location.href,
        _subject: 'Nouvelle demande de projet — ' + (f.nom || 'visiteur'),
        _gotcha: ''
      }, f)
    };

    state.step = 8; showStep(8);
    paint('pending', 'Envoi en cours…', 'Nous transmettons votre demande, merci de patienter.', '', []);

    const emailPromise = FormDelivery.sendEmail(att.payload); // la requête part immédiatement
    att.waOpened = FormDelivery.openWhatsApp(att.waUrl);       // dans le même clic
    const result = await emailPromise;

    send.inFlight = false;
    if(submitBtn) submitBtn.disabled = false;
    showOutcome(result, att);
  }

  async function retryEmail(){
    if(send.inFlight || send.done || !send.attempt) return;
    send.inFlight = true;
    const att = send.attempt;                    // même submission_id, WhatsApp NON rouvert
    paint('pending', 'Envoi en cours…', 'Nous transmettons votre demande, merci de patienter.', '', []);
    const result = await FormDelivery.sendEmail(att.payload);
    send.inFlight = false;
    showOutcome(result, att);
  }

  showStep(1);
})();
