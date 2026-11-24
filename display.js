// Écran projeté : demande un jeton à Apps Script toutes les N secondes et affiche le QR.
(function () {
  var cfg = window.CONFIG;
  var qrEl = document.getElementById("qr");
  var barEl = document.getElementById("bar");
  var statusEl = document.getElementById("status");
  var dur = cfg.ROTATION_SECONDS * 1000;

  // Clé organisateur : demandée une fois, gardée dans ce navigateur (jamais dans git).
  var key = localStorage.getItem("checkin_key");
  if (!key) {
    key = (prompt("Clé organisateur :") || "").trim();
    if (key) localStorage.setItem("checkin_key", key);
  }

  var scanUrl = new URL("scan.html", location.href).href;

  function draw(token) {
    var qr = qrcode(0, "M");
    qr.addData(scanUrl + "?t=" + encodeURIComponent(token));
    qr.make();
    qrEl.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    // relance l'animation de la barre
    barEl.classList.remove("run");
    void barEl.offsetWidth;
    barEl.style.setProperty("--dur", dur + "ms");
    barEl.classList.add("run");
  }

  function setStatus(msg, isErr) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (isErr ? " err" : "");
  }

  function tick() {
    var started = Date.now();
    fetch(cfg.API_URL + "?action=token&key=" + encodeURIComponent(key), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) {
          if (d.error === "unauthorized") {
            localStorage.removeItem("checkin_key");
            setStatus("Clé organisateur invalide — rechargez la page.", true);
            return;
          }
          throw new Error(d.error || "erreur");
        }
        draw(d.token);
        setStatus("");
        // on compte les N secondes à partir de l'affichage du QR
        setTimeout(tick, dur);
      })
      .catch(function () {
        setStatus("Connexion perdue — nouvelle tentative…", true);
        setTimeout(tick, 2000);
      });
  }

  if (!key) { setStatus("Clé organisateur manquante — rechargez la page.", true); return; }
  tick();
})();
