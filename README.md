# Check-in Forum — QR rotatif + Google Forms

L'écran à l'entrée affiche un QR qui change **toutes les 5 secondes**. L'étudiant le scanne,
est redirigé vers le Google Form (code de session pré-rempli, à usage unique), le remplit, et le
script ne garde dans le Form que les réponses valides (code de session unique).

```
display.html ──token──▶ Apps Script ◀──verify── scan.html (téléphone) ──▶ Google Form (réponses valides)
```

Le site (GitHub Pages) est statique et ne contient aucun secret ; la validation est dans Apps Script.

## Mise en place

### 1. Google Form
Créez le formulaire (Nom, Prénom, Établissement, Semestre…) et ajoutez une question **texte court** intitulée exactement `Code`
(obligatoire). Menu ⋮ → *Obtenir le lien pré-rempli*, remplissez `Code` avec `test`, cliquez *Obtenir le lien* :
dans l'URL repérez `entry.XXXXXXXXX=test` → notez `entry.XXXXXXXXX`.
Copiez aussi le lien du formulaire (`https://docs.google.com/forms/d/e/…/viewform`).

### 2. Apps Script (attaché au Form, pas de Sheet)
Dans le Form : ⋮ (en haut à droite) → **Apps Script**. Collez `apps-script/Code.gs`
et renseignez en haut `FORM_URL`, `CODE_ENTRY` et **changez `ORGANIZER_KEY`** (ne commitez pas votre vraie clé dans git).
Les réponses restent dans l'onglet *Réponses* du Form.

### 3. Déployer le Web App
*Déployer → Nouveau déploiement → Application Web* : exécuter en tant que **moi**, accès **tout le monde**.
Copiez l'URL (`…/exec`) dans [config.js](config.js) (`API_URL`).
À chaque modification de `Code.gs`, refaites *Gérer les déploiements → Nouvelle version*.

### 4. Déclencheur
Apps Script → ⏰ *Déclencheurs* → Ajouter : fonction `onFormSubmit`, source **Depuis un formulaire**, événement *Lors de l'envoi du formulaire*.

> Sans Sheet, il n'y a pas de colonne « Statut » : les réponses `Invalide` (pas de code ou code expiré) et `Doublon`
> (code déjà utilisé) sont **supprimées automatiquement** du Form. Il ne reste que les vraies présences.
> Pour les conserver à la place, mettez `DELETE_INVALID = false` (elles seront seulement notées dans les journaux d'exécution).

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
- Le QR de 5 s empêche le partage à distance ; le code de session à usage unique empêche de réutiliser un lien.
  Un étudiant présent peut toujours passer son lien à un ami *dans la salle* avant de l'avoir soumis.
- Les réponses restantes dans le Form = la liste officielle des présents (export CSV possible depuis l'onglet Réponses).
