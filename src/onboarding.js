/* Félix Voz · Onboarding (sign up, login y vincular WhatsApp)
   Basado en el prototipo de Michu en Houston. Al terminar abre el home de voz con el nombre. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const q = new URLSearchParams(location.search);
  const DEMO = { phone: "7135550142", otp: "482913", pin: "1234", name: "Juan", last: "García", email: "juan.garcia@correo.com" };
  const P = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    del: '<path d="M21 6H9l-6 6 6 6h12z"/><path d="M17 10l-4 4M13 10l4 4"/>',
    face: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9v1M15 9v1M12 9v4h-1M9.5 16a4 4 0 0 0 5 0"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    signal: '<path d="M3 18h2v-3H3zM8 18h2v-6H8zM13 18h2V9h-2zM18 18h2V6h-2z" fill="currentColor" stroke="none"/>',
    batt: '<rect x="2" y="7" width="18" height="10" rx="3"/><rect x="4" y="9" width="13" height="6" rx="1.5" fill="currentColor"/><path d="M22 10.5v3"/>',
  };
  const I = (n, s = 20, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;

  let st;
  function reset() {
    st = { path: null, screen: "welcome", stack: [], phone: "", otp: "", name: "", last: "", email: "", method: "face", pin: "", pin2: "", overlay: null };
    render();
  }
  const FLOWS = {
    signup: ["phone", "otp", "name", "access"],
    whatsapp: ["phone", "otp", "access"],
  };
  function go(screen) { st.stack.push(st.screen); st.screen = screen; st.overlay = null; render(); }
  function back() { st.screen = st.stack.pop() || "welcome"; if (st.screen === "welcome") st.path = null; st.overlay = null; if (st.screen === "otp") st.otp = ""; if (st.screen === "pin" || st.screen === "access") { st.pin = ""; st.pin2 = ""; } render(); }
  const userName = () => st.name.trim() || q.get("name") || DEMO.name;

  function goHome() {
    const p = new URLSearchParams();
    if (q.get("code")) p.set("code", q.get("code"));
    p.set("name", userName().split(" ")[0]);
    if (q.get("lang")) p.set("lang", q.get("lang"));
    location.href = "../?" + p.toString();
  }

  // ───────── Pantallas ─────────
  function header() {
    const f = FLOWS[st.path];
    if (!f) return `<div class="ob-top"><button class="ob-back" data-a="back">${I("back")}</button><span></span><span></span></div>`;
    let idx = f.indexOf(st.screen);
    if (idx < 0) idx = f.length - 1; // pin, pin2 cuentan como el último paso
    const n = idx + 1;
    return `<div class="ob-top"><button class="ob-back" data-a="back">${I("back")}</button><span class="ob-step">Paso ${n} de ${f.length}</span><span></span></div><div class="ob-prog"><i style="width:${(n / f.length) * 100}%"></i></div>`;
  }
  const keypad = () => `<div class="ob-kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button data-k="${d}">${d}</button>`).join("")}<span></span><button data-k="0">0</button><button data-k="del">${I("del", 22, 1.8)}</button></div>`;
  function fmtPhone(d) {
    if (!d) return "";
    const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 10);
    return "(" + a + (d.length > 3 ? ") " + b : "") + (d.length > 6 ? "-" + c : "");
  }

  const SCREENS = {
    welcome: () => `
      <div class="ob-hero"><span class="logo">Félix</span><div class="art"><span>✈️</span><span>📱</span><span>💵</span></div></div>
      <div class="ob-wel"><h1>Envía dinero a tu familia, paga y ahorra</h1><p class="ob-p">Todo desde tu celular y en español.</p></div>
      <div class="ob-foot">
        <button class="ob-btn cy" data-a="login">Ingresar</button>
        <button class="ob-btn ol" data-a="signup">Crear cuenta</button>
        <button class="ob-btn ol" data-a="whatsapp">Ya uso Félix en WhatsApp</button>
        <div class="ob-legal">Al continuar aceptas los Términos y el Aviso de privacidad.</div>
      </div>`,

    phone: () => `${header()}
      <div class="ob-body">
        <div class="ob-h">¿Cuál es tu número de celular?</div>
        <div class="ob-p">${st.path === "whatsapp" ? "Usa el mismo número con el que le escribes a Félix en WhatsApp." : "Te mandamos un código para confirmar que es tuyo."}</div>
        <div class="ob-field on" data-a="fillPhone"><span class="cc">🇺🇸 +1</span>${st.phone ? esc(fmtPhone(st.phone)) : '<span class="ph">(000) 000-0000</span>'}</div>
        <div class="ob-demo">Demo: toca el campo para llenarlo.</div>
      </div>
      <div class="ob-foot"><button class="ob-btn" data-a="phoneNext" ${st.phone.length === 10 ? "" : "disabled"}>Continuar</button></div>${keypad()}`,

    otp: () => `${header()}
      <div class="ob-body">
        <div class="ob-h">Escribe el código</div>
        <div class="ob-p">Te lo mandamos por ${st.path === "whatsapp" ? "WhatsApp" : "SMS"} al +1 ${esc(fmtPhone(st.phone))}.</div>
        <div class="ob-otp">${Array.from({ length: 6 }, (_, i) => `<div class="${i === st.otp.length ? "cur" : ""}">${st.otp[i] || ""}</div>`).join("")}</div>
        <div class="ob-demo">¿No te llegó? Reenviar en 0:29</div>
      </div>
      <button class="ob-sug" data-a="fillOtp"><small>Del mensaje</small><b>${DEMO.otp}</b></button>${keypad()}`,

    name: () => `${header()}
      <div class="ob-body">
        <div class="ob-h">¿Cómo te llamas?</div>
        <div class="ob-p">Usamos tu correo para mandarte tus recibos.</div>
        <div class="ob-lbl">Nombre</div><input class="ob-in" id="f-name" placeholder="${DEMO.name}" value="${esc(st.name)}" autocomplete="given-name">
        <div class="ob-lbl">Apellido</div><input class="ob-in" id="f-last" placeholder="${DEMO.last}" value="${esc(st.last)}" autocomplete="family-name">
        <div class="ob-lbl">Correo</div><input class="ob-in" id="f-email" placeholder="${DEMO.email}" value="${esc(st.email)}" type="email" autocomplete="email">
        <button class="ob-demo" style="text-align:left;text-decoration:underline" data-a="fillName">Demo: toca aquí para llenar lo que falte.</button>
      </div>
      <div class="ob-foot"><button class="ob-btn" data-a="nameNext">Continuar</button></div>`,

    access: () => `${header()}
      <div class="ob-body">
        <div class="ob-h">${st.path === "whatsapp" ? `Hola de nuevo, ${esc(userName())}. ` : ""}¿Cómo quieres entrar a la app?</div>
        <div class="ob-p">Lo usas cada vez que abres Félix y para confirmar tus envíos.</div>
        <button class="ob-opt ${st.method === "face" ? "on" : ""}" data-a="mFace"><span class="ic">${I("face", 20, 1.8)}</span><span><span class="t">Face ID <span class="ob-rec">Recomendado</span></span><span class="d">Entras con tu cara. Es lo más rápido.</span></span><span class="rd"></span></button>
        <button class="ob-opt ${st.method === "pin" ? "on" : ""}" data-a="mPin"><span class="ic">${I("shield", 20, 1.8)}</span><span><span class="t">PIN</span><span class="d">Un número de 4 dígitos que solo tú sepas.</span></span><span class="rd"></span></button>
      </div>
      <div class="ob-foot"><button class="ob-btn" data-a="accessNext">Continuar</button></div>
      ${st.overlay === "alert" ? `<div class="ob-veil"><div class="ob-alert"><div class="a1"><b>¿Usar Face ID con Félix?</b><small>Para entrar a la app y confirmar envíos.</small></div><div class="ab"><button data-a="alertNo">Ahora no</button><button data-a="alertYes">Usar Face ID</button></div></div></div>` : ""}`,

    pin: () => `${header()}
      <div class="ob-body" style="align-items:center">
        <div class="ob-h c">Crea tu PIN</div>
        <div class="ob-p c">4 números fáciles de recordar para ti y difíciles de adivinar.</div>
        <div class="ob-pin" data-a="fillPin">${[0, 1, 2, 3].map((i) => `<i class="${i < st.pin.length ? "f" : ""}"></i>`).join("")}</div>
        <div class="ob-demo">Demo: toca el campo para llenarlo.</div>
      </div>${keypad()}`,

    pin2: () => `${header()}
      <div class="ob-body" style="align-items:center">
        <div class="ob-h c">Confirma tu PIN</div>
        <div class="ob-p c">Escríbelo otra vez.</div>
        <div class="ob-pin" data-a="fillPin">${[0, 1, 2, 3].map((i) => `<i class="${i < st.pin2.length ? "f" : ""}"></i>`).join("")}</div>
        <div class="ob-demo">Demo: toca el campo para llenarlo.</div>
      </div>${keypad()}`,

    login: () => `${header()}
      <div class="ob-body" style="align-items:center">
        <div class="ob-h c">Ingresa tu PIN</div>
        <div class="ob-p c">O entra con Face ID.</div>
        <div class="ob-pin" data-a="fillPin">${[0, 1, 2, 3].map((i) => `<i class="${i < st.pin.length ? "f" : ""}"></i>`).join("")}</div>
        <div class="ob-demo">Demo: toca el campo para llenarlo.</div>
        <button class="ob-btn ol" style="width:auto;padding:8px 14px;font-size:13px;margin-top:12px;display:flex;gap:6px;align-items:center" data-a="faceLogin">${I("face", 16, 1.8)} Usar Face ID</button>
      </div>${keypad()}`,

    done: () => `
      <div class="ob-done">
        <div class="party">🎉</div>
        <div class="ob-h c">Listo, ${esc(userName().split(" ")[0])}. ${st.path === "whatsapp" ? "Conectamos tu cuenta." : "Tu cuenta está creada."}</div>
        <div class="ob-p c">${st.path === "whatsapp" ? "Tus familiares y tus envíos de WhatsApp ya están aquí." : "Ya puedes enviar dinero, cargar tu cuenta y ver tu saldo."}</div>
      </div>
      <div class="ob-foot"><button class="ob-btn" data-a="home">Empezar</button></div>`,
  };

  function faceOverlay(then) {
    st.overlay = "face"; render();
    const ob = $("#ob");
    ob.insertAdjacentHTML("beforeend", `<div class="ob-face" id="face"><div class="box">${I("face", 48, 1.6)}</div><b>Face ID</b><small>Mira tu celular para entrar</small></div>`);
    setTimeout(() => { const f = $("#face"); if (f) { f.classList.add("ok"); f.querySelector(".box").innerHTML = I("check", 48, 2.4); } }, 1100);
    setTimeout(then, 1800);
  }

  function render() {
    $("#sbar-icons").innerHTML = I("signal", 17) + I("batt", 22, 1.6);
    $("#ob").innerHTML = SCREENS[st.screen]();
  }

  function saveNameFields() {
    const n = $("#f-name"), l = $("#f-last"), e = $("#f-email");
    if (n) st.name = n.value.trim(); if (l) st.last = l.value.trim(); if (e) st.email = e.value.trim();
  }

  // ───────── Acciones ─────────
  function act(a) {
    switch (a) {
      case "back": return back();
      case "signup": st.path = "signup"; return go("phone");
      case "whatsapp": st.path = "whatsapp"; return go("phone");
      case "login": st.path = "login"; return go("login");
      case "fillPhone": st.phone = DEMO.phone; return render();
      case "phoneNext": if (st.phone.length === 10) go("otp"); return;
      case "fillOtp": st.otp = DEMO.otp; render(); return setTimeout(() => go(st.path === "signup" ? "name" : "access"), 450);
      case "fillName":
        saveNameFields();
        if (!st.name) st.name = DEMO.name; if (!st.last) st.last = DEMO.last; if (!st.email) st.email = DEMO.email;
        return render();
      case "nameNext": saveNameFields(); if (!st.name) { $("#f-name").focus(); return; } return go("access");
      case "mFace": st.method = "face"; return render();
      case "mPin": st.method = "pin"; return render();
      case "accessNext": if (st.method === "face") { st.overlay = "alert"; return render(); } return go("pin");
      case "alertNo": st.method = "pin"; st.overlay = null; return go("pin");
      case "alertYes": return faceOverlay(() => go("done"));
      case "fillPin":
        if (st.screen === "pin2") st.pin2 = DEMO.pin; else st.pin = DEMO.pin;
        render(); return setTimeout(afterPin, 350);
      case "faceLogin": return faceOverlay(goHome);
      case "home": return goHome();
    }
  }
  function afterPin() {
    if (st.screen === "pin" && st.pin.length === 4) return go("pin2");
    if (st.screen === "pin2" && st.pin2.length === 4) return go("done");
    if (st.screen === "login" && st.pin.length === 4) return goHome();
  }
  function key(k) {
    const s = st.screen;
    const field = s === "phone" ? "phone" : s === "otp" ? "otp" : s === "pin2" ? "pin2" : s === "pin" || s === "login" ? "pin" : null;
    if (!field) return;
    const max = { phone: 10, otp: 6, pin: 4, pin2: 4 }[field];
    if (k === "del") st[field] = st[field].slice(0, -1);
    else if (st[field].length < max) st[field] += k;
    render();
    if (field === "otp" && st.otp.length === 6) setTimeout(() => go(st.path === "signup" ? "name" : "access"), 350);
    if ((field === "pin" || field === "pin2") && st[field].length === 4) setTimeout(afterPin, 300);
  }

  document.addEventListener("click", (e) => {
    const k = e.target.closest("[data-k]"); if (k) return key(k.dataset.k);
    const a = e.target.closest("[data-a]"); if (a) act(a.dataset.a);
  });
  $("#reset").addEventListener("click", reset);

  function fit() {
    const wrap = $("#phone-wrap");
    if (window.innerWidth <= 760) { wrap.style.removeProperty("--s"); return; }
    const avail = window.innerHeight - $(".bar").offsetHeight - 24;
    wrap.style.setProperty("--s", Math.min(1, Math.max(0.6, avail / 844)).toFixed(3));
  }
  window.addEventListener("resize", fit);
  reset(); fit();
})();
