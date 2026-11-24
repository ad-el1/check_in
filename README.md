# Check-in Forum — QR rotatif + Google Forms

L'écran à l'entrée affiche un QR qui change **toutes les 5 secondes**. L'étudiant le scanne,
est redirigé vers le Google Form et le remplit.
script ne garde dans le Form que les réponses valides (code de session unique).

```
display.html ──token──▶ Apps Script ◀──verify── scan.html (téléphone) ──▶ Google Form
```

Le site (GitHub Pages) est statique et ne contient aucun secret ; la validation est dans Apps Script.

## Mise en place

### 1. Google Form
Créez le formulaire (Nom, Prénom, Établissement, Semestre…). Copiez son lien (Envoyer → 🔗, il finit par `/viewform`).

### 2. Apps Script (attaché au Form, pas de Sheet)
Dans le Form : ⋮ (en haut à droite) → **Apps Script**. Collez `apps-script/Code.gs`,
renseignez `FORM_URL` et **changez `ORGANIZER_KEY`** dans l'éditeur Google (ne commitez pas votre vraie clé dans git).
Les réponses restent dans l'onglet *Réponses* du Form.

### 3. Déployer le Web App
*Déployer → Nouveau déploiement → Application Web* : exécuter en tant que **moi**, accès **tout le monde**.
Copiez l'URL (`…/exec`) dans [config.js](config.js) (`API_URL`).
À chaque modification de `Code.gs` : *Gérer les déploiements → ✏️ → Nouvelle version* (l'URL ne change pas).

### 5. GitHub Pages
Poussez sur la branche `dev`, puis *Settings → Pages → Branch : dev / (root)*.
Le jour J, ouvrez `https://<user>.github.io/<repo>/display.html` sur l'écran projeté, saisissez la clé organisateur
(mémorisée dans ce navigateur), passez en plein écran (F11).

## Test local
```
python -m http.server 8000     # puis http://localhost:8000/display.html
```
(`config.js` doit déjà contenir l'URL du Web App.)

## Limites
- Le QR de 5 s (jeton à usage unique) empêche de partager le QR à distance. En revanche, le lien du Form lui-même
  n'est pas protégé : quelqu'un qui le copie depuis son téléphone peut le remplir sans passer par le QR.
