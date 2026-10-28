/* Félix Voz · Onboarding
   Usa tal cual el sign up / login del prototipo de Michu (houston-prototipos-app, /voz/),
   servido por el mismo dominio con rewrites de Vercel (vercel.json).
   Este script solo: (1) muestra el teléfono de Michu, (2) arranca en "Onboarding",
   (3) guarda el nombre que escribe el usuario y (4) al llegar al home lo manda al home de voz. */
(function () {
  "use strict";
  const q = new URLSearchParams(location.search);
  const frame = document.getElementById("michu");
  let name = q.get("name") || "";
  let started = false, sent = false;

  const HIDE_CSS = `
    body > *:not(#grid) { display: none !important; }
    body { background: transparent !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
    #grid { display: flex !important; justify-content: center !important; padding: 0 !important; margin: 0 !important; gap: 0 !important; }
    #grid > .pc:not(:first-child) { display: none !important; }
    .pc { width: auto !important; padding: 0 !important; margin: 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; }
    .pc > header, .pc > .pdesc, .pc > .tools, .pc > details, .pc .play { display: none !important; }
  `;

  function goHome() {
    if (sent) return; sent = true;
    const p = new URLSearchParams();
    if (q.get("code")) p.set("code", q.get("code"));
    // Solo pasamos el nombre si la persona lo escribió (Crear cuenta).
    // En Ingresar o WhatsApp no hay nombre: el home de voz lo pregunta antes de empezar.
    if (name.trim()) p.set("name", name.trim().split(" ")[0]);
    location.href = "/?" + p.toString();
  }

  function setup() {
    let doc;
    try { doc = frame.contentDocument; } catch (e) { return; }
    if (!doc || !doc.body) return;
    // CSS para dejar solo el teléfono
    if (!doc.getElementById("fx-hide")) {
      const s = doc.createElement("style"); s.id = "fx-hide"; s.textContent = HIDE_CSS; doc.head.appendChild(s);
    }
    // Arrancar en "Onboarding" (no en "Ya con sesión")
    const cfgBtn = [...doc.querySelectorAll("#cfg button")].find((b) => b.textContent.trim() === "Onboarding");
    if (cfgBtn && !cfgBtn.classList.contains("on") && !started) cfgBtn.click();
    // Guardar el nombre que escribe en el registro
    doc.addEventListener("input", (e) => {
      const el = e.target;
      if (el && el.tagName === "INPUT" && (/^juan$/i.test(el.placeholder || "") || /nombre|name/i.test(el.getAttribute("aria-label") || el.name || ""))) name = el.value;
    }, true);
    watch(doc);
  }

  function watch(doc) {
    setInterval(() => {
      const dev = doc.querySelector(".device");
      if (!dev) return;
      const onb = dev.querySelector(".ob");
      const lock = dev.querySelector(".lk");
      if (onb) {
        started = true;
        // Toma el nombre si ya aparece en pantalla ("Listo, Ana." o "Hola de nuevo, Ana.")
      }
      // Terminó el onboarding o el login: ya no hay pantalla de onboarding ni de bloqueo
      if (started && !onb && !lock) goHome();
    }, 300);
  }

  function fit() {
    const wrap = document.getElementById("phone-wrap");
    if (window.innerWidth <= 760) { wrap.style.removeProperty("--s"); return; }
    const avail = window.innerHeight - document.querySelector(".bar").offsetHeight - 24;
    wrap.style.setProperty("--s", Math.min(1, Math.max(0.6, avail / 844)).toFixed(3));
  }
  window.addEventListener("resize", fit); fit();
  frame.addEventListener("load", setup);
  document.getElementById("reset").addEventListener("click", () => { started = false; name = q.get("name") || ""; frame.src = "/voz"; });
})();
