/**
 * Backend du check-in (Google Apps Script).
 * À coller dans le Google FORM lui-même : ouvrir le Form → ⋮ → Apps Script.
 * Aucune Google Sheet n'est nécessaire : les réponses restent dans l'onglet "Réponses" du Form.
 * Ne commitez pas votre vraie clé organisateur dans git.
 *
 * Rôle : fournir à l'écran projeté un jeton qui change toutes les 5 s, et ne donner
 * le lien du Form qu'aux téléphones qui scannent un jeton encore valide.
 */

// --- À RENSEIGNER ---------------------------------------------------------
var FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScR-TfMYbDAkjio0t5_dj87E4AMlo0sT_MH_0rPm6iBKSqfzg/viewform"; // lien "envoyer" du Form
var ORGANIZER_KEY = "CHANGE-MOI";     // clé saisie sur l'écran projeté
// --------------------------------------------------------------------------

var TOKEN_TTL = 20;        // secondes de validité d'un QR (rotation 5 s + délai de scan)

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

  // 2) Le téléphone de l'étudiant échange le jeton (usage unique) contre le lien du Form
  if (p.action === "verify") {
    var lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      var tk = "t_" + String(p.t || "");
      if (!p.t || !cache.get(tk)) return json_({ ok: false, error: "expired" });
      cache.remove(tk);
      return json_({ ok: true, url: FORM_URL });
    } finally {
      lock.releaseLock();
    }
  }

  return json_({ ok: false, error: "bad_request" });
}
