/**
 * Backend du check-in (Google Apps Script).
 * À coller dans le Google FORM lui-même : ouvrir le Form → ⋮ → Apps Script
 * (ou Extensions → Apps Script). Aucune Google Sheet n'est nécessaire :
 * les réponses restent dans l'onglet "Réponses" du Form.
 * Ne commitez pas votre vraie clé organisateur dans git.
 */

// --- À RENSEIGNER ---------------------------------------------------------
var FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScR-TfMYbDAkjio0t5_dj87E4AMlo0sT_MH_0rPm6iBKSqfzg/viewform"; // lien "envoyer" du Form
var CODE_ENTRY = "entry.513766561";   // identifiant du champ "Code" (lien pré-rempli)
var CODE_TITLE = "Code";              // intitulé exact du champ "Code" dans le Form
var DELETE_INVALID = true;            // supprime du Form les réponses Invalide/Doublon
var ORGANIZER_KEY = "CHANGE-MOI";     // clé saisie sur l'écran projeté
// --------------------------------------------------------------------------

var TOKEN_TTL = 20;        // secondes de validité d'un QR (rotation 5 s + délai de scan)
var SESSION_TTL = 21600;   // 6 h (max du CacheService) pour remplir le formulaire

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function rand_() {
  return Utilities.getUuid().replace(/-/g, "").slice(0, 16);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var cache = CacheService.getScriptCache();

  // 1) L'écran projeté demande un nouveau jeton (protégé par la clé organisateur)
  if (p.action === "token") {
    if (p.key !== ORGANIZER_KEY) return json_({ ok: false, error: "unauthorized" });
    var t = rand_();
    cache.put("t_" + t, "1", TOKEN_TTL);
    return json_({ ok: true, token: t });
  }

  // 2) Le téléphone de l'étudiant échange le jeton contre le lien du Form
  if (p.action === "verify") {
    var lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      var tk = "t_" + String(p.t || "");
      if (!p.t || !cache.get(tk)) return json_({ ok: false, error: "expired" });
      cache.remove(tk); // usage unique
      var code = rand_();
      cache.put("s_" + code, "1", SESSION_TTL);
      var url = FORM_URL + "?usp=pp_url&" + CODE_ENTRY + "=" + encodeURIComponent(code);
      return json_({ ok: true, url: url });
    } finally {
      lock.releaseLock();
    }
  }

  return json_({ ok: false, error: "bad_request" });
}

/** Déclencheur installable "Depuis un formulaire" → "À l'envoi du formulaire". */
function onFormSubmit(e) {
  var response = e.response;
  var code = "";
  response.getItemResponses().forEach(function (ir) {
    if (ir.getItem().getTitle() === CODE_TITLE) code = String(ir.getResponse()).trim();
  });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var status;
  try {
    var cache = CacheService.getScriptCache();
    if (code && cache.get("s_" + code)) {
      cache.remove("s_" + code);
      cache.put("u_" + code, "1", SESSION_TTL);
      status = "Valide";
    } else if (code && cache.get("u_" + code)) {
      status = "Doublon";
    } else {
      status = "Invalide";
    }
  } finally {
    lock.releaseLock();
  }

  if (status !== "Valide") {
    console.log(status + " — réponse " + response.getId() + " (code: " + code + ")");
    if (DELETE_INVALID) FormApp.getActiveForm().deleteResponse(response.getId());
  }
}
