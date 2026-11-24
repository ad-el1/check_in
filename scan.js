// Page ouverte par le scan : valide le jeton auprès d'Apps Script puis redirige vers le Google Form.
(function () {
  var view = document.getElementById("view");
  var token = new URLSearchParams(location.search).get("t");

  function fail(title, msg) {
    view.innerHTML =
      '<p class="big">⚠️</p><h1 class="err-t"></h1><p></p>';
    view.querySelector("h1").textContent = title;
    view.querySelector("p:last-child").textContent = msg;
  }

  if (!token) {
    fail("QR invalide", "Scannez le QR code affiché sur l'écran à l'entrée.");
    return;
  }

  fetch(window.CONFIG.API_URL + "?action=verify&t=" + encodeURIComponent(token), { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok && d.url) {
        location.replace(d.url);
      } else {
        fail("QR expiré", "Ce code n'est plus valide. Scannez à nouveau le QR affiché sur l'écran.");
      }
    })
    .catch(function () {
      fail("Connexion impossible", "Vérifiez votre connexion internet puis rescannez le QR.");
    });
})();
