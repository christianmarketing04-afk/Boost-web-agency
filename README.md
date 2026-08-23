# Boost Web Agency — Site web

## 1. Fichiers créés

```
index.html, services.html, portfolio.html, a-propos.html, contact.html, appliquer.html
css/style.css                → design system complet (thème sombre/clair, aurora gradient, animations)
js/content.js                → charge le contenu JSON et affiche header/footer/sections
js/main.js                   → thème clair/sombre, menu mobile, animations au scroll
js/apply-form.js             → logique du formulaire multi-étapes "Appliquer"
content/*.json                → TOUT le contenu du site (voir ci-dessous)
admin/index.html, admin/config.yml → interface Decap CMS
assets/images/logo.png        → ton logo
assets/images/portfolio/*     → tes 3 vraies images de projets
```

## 2. Comment fonctionne le contenu

Chaque page charge son contenu depuis `content/*.json` au moment de l'affichage
(pas de rechargement de page nécessaire). Decap CMS **modifie ces mêmes
fichiers JSON** sur GitHub — donc tout ce que tu changes dans `/admin/`
apparaît automatiquement sur le site après publication.

- `content/home.json` → textes du Hero + intros de chaque section de l'accueil
- `content/services.json` → les 3 services (accueil + page Services)
- `content/process.json` → les 4 étapes du processus
- `content/portfolio.json` → tes 3 projets (Slow Coffee, Coach Jean Fit, Coin Cadeau)
- `content/testimonials.json` → témoignages
- `content/faq.json` → questions fréquentes
- `content/about.json` → page À propos
- `content/settings.json` → logo, email, WhatsApp, Instagram, copyright
- `content/navigation.json` → menu du site

## 3. Mettre le projet sur GitHub

```bash
cd site
git init
git add .
git commit -m "Site Boost Web Agency"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/TON-REPO.git
git push -u origin main
```

## 4. Déployer sur Netlify

1. Sur [netlify.com](https://netlify.com) → "Add new site" → "Import an existing project"
2. Connecte ton compte GitHub et choisis le repo
3. Build command : *(laisser vide)* — Publish directory : `.` (racine)
4. Déployer

## 5. Activer Decap CMS (obligatoire avant utilisation)

1. Ouvre `admin/config.yml` et remplace `VOTRE-COMPTE/VOTRE-REPO` par le nom
   exact de ton repo GitHub (ex : `jeandupont/boost-web-agency`)
2. Sur Netlify : **Site settings → Access control → OAuth → Install provider → GitHub**
   (suis les instructions Netlify pour créer une "OAuth App" sur GitHub — c'est
   gratuit et prend 2 minutes)
3. Une fois configuré, ouvre `https://ton-site.netlify.app/admin/`
4. Connecte-toi avec GitHub → tu arrives sur le tableau de bord Decap CMS

## 6. Comment ajouter du contenu (une fois connecté à /admin/)

- **Nouveau projet Portfolio** → 🏠 Page d'accueil → Portfolio → "Add" → remplir
  image, nom, catégorie, description, lien → Publier
- **Nouvelle FAQ** → 🏠 Page d'accueil → FAQ → "Add" → question/réponse → Publier
- **Nouveau témoignage** → 🏠 Page d'accueil → Témoignages → "Add" → Publier
- **Remplacer une image** → clique sur le champ image → "Choose an image" → upload
- **Modifier le Hero** → 🏠 Page d'accueil → Hero → modifier les champs → Publier
- **Modifier le Footer / contact** → ⚙️ Paramètres du site → Contact & réseaux → Publier
- Chaque "Publier" fait automatiquement un **commit sur GitHub** → Netlify
  redéploie le site tout seul en 1 à 2 minutes.

## 7. Formulaire "Appliquer" et formulaire Contact

Ces deux formulaires n'ont pas de serveur backend (site 100% statique). À la
soumission, ils ouvrent WhatsApp avec le message pré-rempli vers le numéro
défini dans `content/settings.json` (`whatsapp_link`). C'est la solution la
plus fiable sans backend — si tu préfères un vrai email automatique, on peut
brancher **Netlify Forms** ou un service comme Formspree ensuite.

## 8. Vérifier que tout fonctionne après déploiement

- [ ] Le site s'affiche correctement sur `https://ton-site.netlify.app`
- [ ] Les 6 pages sont accessibles depuis le menu
- [ ] Le formulaire "Appliquer" avance bien étape par étape jusqu'à la confirmation
- [ ] `https://ton-site.netlify.app/admin/` affiche l'écran de connexion Decap CMS
- [ ] Un changement fait dans `/admin/` apparaît sur le site après quelques minutes
