/* Boost Web Agency — envoi des formulaires (Contact + Appliquer)
   --------------------------------------------------------------
   Chaque formulaire envoie la demande par deux canaux, en parallèle :
     1) un VRAI e-mail, via Formspree (service externe, aucune clé secrète
        dans ce fichier : l'adresse du formulaire est publique par nature) ;
     2) WhatsApp, avec le message pré-rempli (comportement d'origine).

   Règles respectées ici :
   - le message de succès n'est affiché QUE si Formspree confirme la réception ;
   - WhatsApp est ouvert pendant le clic (sinon les navigateurs bloquent
     l'ouverture) et n'est jamais rouvert lors d'une nouvelle tentative ;
   - un identifiant d'envoi unique + un verrou empêchent les doublons.

   Réglage : content/form.json  →  "formspree_endpoint"
   (modifiable aussi depuis /admin/ → Paramètres du site → Formulaires).
   L'adresse e-mail qui REÇOIT les demandes se règle dans Formspree, pas ici. */

(function(){
  const ENDPOINT_RE = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/;
  const TIMEOUT_MS = 20000;

  const state = { ready: false, settings: null, endpoint: '' };

  const ready = (async ()=>{
    try{ state.settings = await Content.load('content/settings.json'); }
    catch(err){ console.error('[forms] settings.json', err); }
    try{
      const cfg = await Content.load('content/form.json');
      state.endpoint = String(cfg.formspree_endpoint || '').trim();
    }catch(err){ console.error('[forms] form.json', err); state.endpoint = ''; }
    state.ready = true;
  })();

  function newId(){
    if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  const MESSAGES = {
    not_configured: 'L’envoi par e-mail n’est pas encore activé sur ce site.',
    bad_config: 'L’adresse du service d’envoi par e-mail est mal configurée.',
    network: 'Impossible de joindre le service d’envoi. Vérifiez votre connexion internet.',
    timeout: 'Le service d’envoi n’a pas répondu à temps.',
    rejected: 'Le service d’envoi a refusé la demande. Vérifiez les informations saisies.',
    server: 'Le service d’envoi est momentanément indisponible.',
    unexpected: 'Le service d’envoi n’a pas confirmé la réception de la demande.'
  };

  /* Envoie le payload à Formspree. Ne rejette jamais : renvoie toujours
     { ok:true } ou { ok:false, code, message }. */
  async function sendEmail(payload){
    if(!state.endpoint) return { ok:false, code:'not_configured', message: MESSAGES.not_configured };
    if(!ENDPOINT_RE.test(state.endpoint)) return { ok:false, code:'bad_config', message: MESSAGES.bad_config };

    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), TIMEOUT_MS);
    try{
      const res = await fetch(state.endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
        keepalive: true
      });
      let data = null;
      try{ data = await res.json(); }catch(_){ /* corps non JSON */ }

      // Succès UNIQUEMENT si HTTP 2xx ET confirmation explicite {ok:true}
      if(res.ok && data && data.ok === true) return { ok:true };

      console.error('[forms] Réponse Formspree non confirmée', res.status, data);
      if(res.ok) return { ok:false, code:'unexpected', message: MESSAGES.unexpected };
      if(res.status >= 500) return { ok:false, code:'server', status:res.status, message: MESSAGES.server };
      return { ok:false, code:'rejected', status:res.status, message: MESSAGES.rejected };
    }catch(err){
      console.error('[forms] Envoi e-mail impossible', err);
      const code = err && err.name === 'AbortError' ? 'timeout' : 'network';
      return { ok:false, code, message: MESSAGES[code] };
    }finally{
      clearTimeout(timer);
    }
  }

  function whatsappUrl(text){
    const base = (state.settings && state.settings.whatsapp_link) || '';
    return base + (base.includes('?') ? '&' : '?') + 'text=' + encodeURIComponent(text);
  }

  /* À appeler directement dans le gestionnaire de clic (avant tout "await"),
     sinon le navigateur peut bloquer la fenêtre. Renvoie false si bloquée. */
  function openWhatsApp(url){
    try{
      const w = window.open(url, '_blank', 'noopener');
      return !!w;
    }catch(_){ return false; }
  }

  /* ---------- Affichage d'un état (message + boutons éventuels) ---------- */
  function renderStatus(el, opts){
    el.className = 'form-status is-' + opts.kind;
    el.textContent = '';
    const p = document.createElement('p');
    p.textContent = opts.message;
    el.appendChild(p);
    (opts.extra || []).forEach(t => { const q = document.createElement('p'); q.textContent = t; q.className = 'form-status-note'; el.appendChild(q); });
    const actions = document.createElement('div');
    actions.className = 'form-status-actions';
    if(opts.retry){
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn btn-outline form-retry';
      b.textContent = 'Réessayer l’envoi par e-mail';
      actions.appendChild(b);
    }
    if(opts.whatsappUrl){
      const a = document.createElement('a');
      a.href = opts.whatsappUrl; a.target = '_blank'; a.rel = 'noopener';
      a.className = 'btn btn-outline form-whatsapp';
      a.textContent = opts.whatsappLabel || 'Ouvrir WhatsApp';
      actions.appendChild(a);
    }
    if(actions.children.length) el.appendChild(actions);
  }

  /* ---------- Formulaire de la page Contact ---------- */
  function initContactForm(formId, statusId){
    const form = document.getElementById(formId);
    const status = document.getElementById(statusId);
    if(!form || !status) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    const idleLabel = submitBtn ? submitBtn.textContent : '';
    let inFlight = false;
    let attempt = null; // dernière tentative dont l'e-mail a échoué (pour réessayer sans doublon)

    function setBusy(busy){
      inFlight = busy;
      if(!submitBtn) return;
      submitBtn.disabled = busy;
      submitBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
      submitBtn.textContent = busy ? 'Envoi en cours…' : idleLabel;
    }

    function waNote(att){
      return att.waOpened
        ? { extra: ['WhatsApp s’est ouvert dans un nouvel onglet : envoyez-y le message pour une réponse plus rapide.'] }
        : { extra: ['Votre navigateur a bloqué l’ouverture de WhatsApp : utilisez le bouton ci-dessous.'], whatsappUrl: att.waUrl };
    }

    function showResult(result, att){
      if(result.ok){
        renderStatus(status, Object.assign({
          kind:'success',
          message:'Merci ! Votre message a bien été transmis par e-mail (réception confirmée).'
        }, waNote(att)));
        return;
      }
      const retryable = !['not_configured','bad_config'].includes(result.code);
      renderStatus(status, {
        kind:'error',
        message:'Votre message n’a PAS été envoyé par e-mail. ' + result.message,
        extra:[ att.waOpened
          ? 'WhatsApp s’est ouvert : vous pouvez y envoyer votre message pour nous joindre.'
          : 'Vous pouvez nous écrire directement sur WhatsApp avec le bouton ci-dessous.' ],
        retry: retryable,
        whatsappUrl: att.waOpened ? null : att.waUrl,
        whatsappLabel: 'Écrire sur WhatsApp'
      });
    }

    async function deliver(att, reopenWhatsApp){
      setBusy(true);
      renderStatus(status, { kind:'pending', message:'Envoi en cours…' });
      const emailPromise = sendEmail(att.payload);          // la requête part tout de suite
      if(reopenWhatsApp) att.waOpened = openWhatsApp(att.waUrl); // même clic : pas de blocage
      const result = await emailPromise;
      setBusy(false);
      if(result.ok){ attempt = null; form.reset(); }
      else { attempt = att; }
      showResult(result, att);
    }

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      if(inFlight) return; // anti double-clic / double « Entrée »
      const honey = form.querySelector('[name="_gotcha"]');
      if(honey && honey.value) return; // robot : on ignore silencieusement

      if(!state.ready){
        renderStatus(status, { kind:'pending', message:'Chargement en cours… réessayez dans un instant.' });
        return;
      }

      const d = new FormData(form);
      const v = k => String(d.get(k) || '').trim();
      const fields = { nom: v('name'), email: v('email'), telephone: v('phone'), entreprise: v('company'), message: v('message') };

      // Mêmes données qu'une tentative en échec → simple nouvel essai e-mail, sans rouvrir WhatsApp ni créer de doublon
      if(attempt && JSON.stringify(attempt.fields) === JSON.stringify(fields)){
        deliver(attempt, false);
        return;
      }

      const text = `Nouveau message — Boost Web Agency\nNom: ${fields.nom}\nEmail: ${fields.email}\nTéléphone: ${fields.telephone||'—'}\nEntreprise: ${fields.entreprise||'—'}\nMessage: ${fields.message}`;
      const att = {
        fields,
        waUrl: whatsappUrl(text),
        waOpened: false,
        payload: Object.assign({
          formulaire: 'Contact',
          submission_id: newId(),
          page: location.href,
          _subject: 'Nouveau message de contact — ' + (fields.nom || 'visiteur'),
          _gotcha: ''
        }, fields)
      };
      deliver(att, true);
    });

    status.addEventListener('click', (e)=>{
      if(!e.target.closest('.form-retry') || inFlight || !attempt) return;
      deliver(attempt, false);
    });
  }

  window.FormDelivery = { state, ready, newId, sendEmail, whatsappUrl, openWhatsApp, renderStatus, initContactForm, MESSAGES };
})();
