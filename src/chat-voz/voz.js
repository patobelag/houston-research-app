/* ─────────────────────────────────────────────────────────────
   Félix · Voz
   Se carga después del script principal del proto y reemplaza la demo:
   1) Nota de voz: graba de verdad, se puede escuchar, se transcribe y entra
      al mismo cerebro que el texto escrito.
   2) Voz en vivo: llamada con el agente de ElevenLabs (WebRTC). Si el servidor
      no tiene ElevenLabs configurado, usa la voz del navegador (modo demo).
   Usa las funciones globales del proto: st, bot, bubble, norm, INTENTS, menu,
   setMode, closeBtns, qoUse, do*, handoff, etc.
   ───────────────────────────────────────────────────────────── */
(() => {
  const SDK_URL = "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.28.0/+esm";
  const MAX_REC = 120; // segundos
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Código de acceso opcional (?code=XXXX en el link), se recuerda en este navegador
  let accessCode = null;
  try {
    const q = new URLSearchParams(location.search).get("code");
    if (q) localStorage.setItem("felixCode", q);
    accessCode = localStorage.getItem("felixCode");
  } catch (e) {}
  const authHeaders = () => (accessCode ? { "x-access-code": accessCode } : {});

  // ¿Qué hay configurado en el servidor?
  let server = { live: false, stt: false };
  const ready = fetch("/api/el-token?check=1")
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => { const on = !!j.configured; server = { live: j.live ?? on, stt: j.stt ?? on }; })
    .catch(() => {});

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ───────── estilos extra ───────── */
  const css = document.createElement("style");
  css.textContent = `
  .vn-tx{display:block;margin-top:6px;font-size:13.5px;line-height:1.35;color:var(--mut);font-style:italic;max-width:260px}
  .vn-tx.wait{font-style:normal}
  #lv svg{width:24px;height:24px}
  .call .cav{transition:transform .08s linear}
  .call.speaking .rings i{animation-duration:1.2s}
  .call.listening .rings i{animation-play-state:paused;opacity:0}
  .cnote.mode{color:#2bf2f1}
  .ccap{min-height:44px;font-size:16px;line-height:1.35;color:#d6ecea;text-align:center;max-width:300px;margin-top:6px}
  .callsep{align-self:center;margin:10px auto 4px;font-size:12.5px;color:var(--mut);background:#fff8;padding:3px 10px;border-radius:999px}
  `;
  document.head.appendChild(css);

  /* ═════════════ 1) NOTA DE VOZ ═════════════ */
  let rec = null, chunks = [], recStream = null, recognizer = null, srText = "", recCancelled = false;

  function pickMime() {
    if (!window.MediaRecorder) return "";
    for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) if (MediaRecorder.isTypeSupported(m)) return m;
    return "";
  }

  // Reemplaza la demo de grabación del proto
  window.startRec = async function () {
    if (st.mode === "busy" || rec) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      await bot("Tu navegador no permite grabar audio. Escríbenos tu mensaje.");
      return;
    }
    try {
      recStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      await bot("Necesitamos permiso para usar tu micrófono. Actívalo en tu navegador y vuelve a intentarlo.");
      return;
    }
    chunks = []; srText = ""; recCancelled = false;
    const mime = pickMime();
    rec = new MediaRecorder(recStream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
    rec.start(250);

    // Respaldo de transcripción con el navegador, por si el servidor no tiene ElevenLabs
    if (SR) {
      try {
        recognizer = new SR();
        recognizer.lang = "es-MX"; recognizer.continuous = true; recognizer.interimResults = false;
        recognizer.onresult = (ev) => {
          for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) srText += " " + ev.results[i][0].transcript;
        };
        recognizer.onerror = () => {};
        recognizer.start();
      } catch (e) { recognizer = null; }
    }

    recS = 0; $("#rt").textContent = "0:00";
    $(".recpill span").textContent = "Grabando… toca enviar cuando termines";
    $("#cLine").hidden = true; $("#rLine").hidden = false; lv.hidden = true;
    clearInterval(recT);
    recT = setInterval(() => {
      recS++; $("#rt").textContent = mmss(recS);
      if (recS >= MAX_REC) $("#rs").click();
    }, 1000);
  };

  function finishRec() {
    return new Promise((resolve) => {
      clearInterval(recT);
      $("#rLine").hidden = true; $("#cLine").hidden = false; lv.hidden = false;
      if (recognizer) { try { recognizer.stop(); } catch (e) {} }
      const r = rec; rec = null;
      if (!r) return resolve(null);
      r.onstop = () => {
        recStream && recStream.getTracks().forEach((t) => t.stop());
        recStream = null;
        resolve(chunks.length ? new Blob(chunks, { type: r.mimeType || "audio/webm" }) : null);
      };
      try { r.stop(); } catch (e) { resolve(null); }
    });
  }

  window.stopRec = () => { recCancelled = true; finishRec(); };
  $("#rx").onclick = window.stopRec;

  $("#rs").onclick = async () => {
    const secs = Math.max(recS, 1);
    const blob = await finishRec();
    // El navegador entrega la última frase un instante después de parar
    await sleep(SR ? 600 : 0);
    if (!blob || recCancelled) return;
    if (st.mode === "busy") return;
    const m = st.mode;
    if (m !== "agent") closeBtns();
    qoUse && qoUse();
    st.mode = "busy";
    const row = realVoiceBubble(blob, secs);
    const tx = document.createElement("span");
    tx.className = "vn-tx wait"; tx.textContent = "Transcribiendo…";
    row.querySelector(".vn").after(tx); toEnd();

    const text = await transcribe(blob);
    if (text) { tx.className = "vn-tx"; tx.textContent = "“" + text + "”"; }
    else tx.remove();
    toEnd();
    await routeVoice(m, text);
  };

  async function transcribe(blob) {
    await ready;
    if (server.stt) {
      try {
        const r = await fetch("/api/stt", { method: "POST", headers: { "content-type": "application/octet-stream", "x-audio-type": blob.type, ...authHeaders() }, body: blob });
        if (r.ok) { const j = await r.json(); if (j.text) return j.text; }
        else console.warn("STT", r.status);
      } catch (e) { console.warn("STT", e); }
    }
    return srText.trim();
  }

  // Burbuja con el audio real: play/pausa y la onda avanza con la reproducción
  function realVoiceBubble(blob, secs) {
    const bars = Array.from({ length: 28 }, () => `<i style="height:${6 + Math.round(Math.random() * 20)}px"></i>`).join("");
    const play = '<svg class="i" width="18" height="18" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M7 4.5v15l13-7.5z"/></svg>';
    const pause = '<svg class="i" width="18" height="18" viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
    const r = bubble("u", `<div class="vn"><button class="pl" aria-label="Reproducir nota de voz">${play}</button><div class="wv">${bars}</div><span class="du">${mmss(secs)}</span></div>`);
    const pl = r.querySelector(".pl"), is = [...r.querySelectorAll(".wv i")];
    const audio = new Audio(URL.createObjectURL(blob));
    let raf = 0;
    const paint = () => {
      const d = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : secs;
      const k = Math.round((audio.currentTime / d) * is.length);
      is.forEach((b, i) => b.classList.toggle("on", i < k));
      if (!audio.paused) raf = requestAnimationFrame(paint);
    };
    audio.onended = () => { cancelAnimationFrame(raf); pl.innerHTML = play; pl.setAttribute("aria-label", "Reproducir nota de voz"); is.forEach((b) => b.classList.remove("on")); };
    pl.onclick = () => {
      if (audio.paused) { audio.play(); pl.innerHTML = pause; pl.setAttribute("aria-label", "Pausar"); paint(); }
      else { audio.pause(); pl.innerHTML = play; pl.setAttribute("aria-label", "Reproducir nota de voz"); }
    };
    return r;
  }

  // La transcripción entra al mismo cerebro que el texto escrito
  async function routeVoice(m, text) {
    if (!text) {
      await bot("No logramos escuchar bien tu nota de voz. ¿Nos la mandas otra vez o la escribes?");
      return setMode(m);
    }
    const t = norm(text);
    if (m === "menu") {
      const hit = INTENTS.find((i) => i.re.test(t));
      if (hit) return hit.run();
      return menu("No logramos entender tu nota de voz. Elige una opción o cuéntanos de otra forma.");
    }
    if (m === "agent") {
      if (/cancel/.test(t)) return agentCancel();
      return agentReply();
    }
    if (m === "phone" || m === "code") {
      // Dictar el número o el código: lo ponemos en el campo para que la persona confirme
      const d = text.replace(/\D/g, "");
      if (d) {
        ci.value = m === "phone" ? fmtPhone(d.slice(-10)) : d.slice(0, 6);
        syncBtn(); setMode(m);
        await bot("Lo escribimos por ti. Revisa que esté bien y toca enviar.");
        return setMode(m);
      }
    }
    await bot("Por ahora necesitamos que lo escribas.");
    setMode(m);
  }

  /* ═════════════ 2) VOZ EN VIVO ═════════════ */
  // Botón nuevo junto al micrófono
  const WAVE = '<path d="M3 10v4M7 6v12M11 3v18M15 8v8M19 5v14M23 10v4" stroke-linecap="round"/>';
  const lv = document.createElement("button");
  lv.className = "snd gh"; lv.id = "lv"; lv.type = "button";
  lv.setAttribute("aria-label", "Hablar con Félix en vivo");
  lv.innerHTML = svg(WAVE, 24);
  $("#cLine").insertBefore(lv, $("#cb"));

  // El marco del teléfono (#dev) no debe desplazarse: si el foco de un campo lo mueve, la llamada se ve cortada
  const dev = $("#dev");
  if (dev) dev.addEventListener("scroll", () => { if (dev.scrollTop) dev.scrollTop = 0; });

  const callEl = $("#call"), cstat = $("#cstat"), cnote = $(".call .cnote"), cav = $(".call .cav");
  const cap = document.createElement("div"); cap.className = "ccap"; cap.setAttribute("aria-live", "polite");
  $(".call .cmid").appendChild(cap);

  const FLOWS = {
    enviar: ["Enviar dinero", () => doSend()],
    pagar_servicio: ["Pagar servicios", () => doPay()],
    prestamo: ["Pedir un préstamo", () => doLoan()],
    billetera: ["Abrir billetera", () => doCuenta()],
    calcular: ["Calcular un envío", () => doCalc()],
    historial: ["Ver mis envíos", () => doHistory()],
    resumen: ["Resumen de mi cuenta", () => doSummary()],
    depositar: ["Ingresar dinero", () => doDeposit()],
    retirar: ["Retirar dinero", () => doWithdraw()],
    invitar: ["Invita y gana", () => doInvite()],
    tarjetas: ["Mis tarjetas", () => doCards()],
    destinatarios: ["Mis destinatarios", () => doRecipients()],
    alertas: ["Alerta de tipo de cambio", () => doAlert()],
    cancelar_envio: ["Cancelar un envío", () => doCancel()],
    hablar_con_persona: ["Hablar con una persona", () => handoff()],
  };

  let L = null; // sesión en vivo activa

  // ── Cerebro de la llamada: las mismas tools de Houston (src/core.js) ──
  // Félix completa todo por voz: prepara, pide confirmación y ejecuta, sin salir de la llamada.
  // Solo si la persona pide verlo en pantalla o escribir, cerramos la llamada y abrimos el flujo del chat.
  const C = window.FelixCore;
  let core = null; // { state, tools, people, billIdx } de la llamada actual

  // ── Sincronización: el chat escrito es la fuente de verdad ──
  // Al iniciar la llamada, el estado del chat (billetera, saldo, familiares, servicios, historial)
  // se convierte al formato de Houston. Al colgar, lo que Félix hizo por voz se escribe de vuelta.
  const RELKEY = { "mamá": "mama", "papá": "papa", "hermano": "hermano", "hermana": "hermana", "tía": "tia", "tío": "tio",
    "esposa": "esposa", "esposo": "esposo", "hija": "hija", "hijo": "hijo", "abuela": "abuela", "abuelo": "abuelo" };
  const COREC = { mx: "MX", co: "CO", gt: "GT", hn: "HN" };
  const xferLinks = []; // envíos hechos por voz: { state, tid, x } para marcar "entregado" cuando llegue
  const syncNum = (n) => Math.round((Number(n) || 0) * 100) / 100;

  function buildCore() {
    if (!C) return null;
    // Mismos tipos de cambio que muestra el chat
    Object.entries(COREC).forEach(([k, K]) => { if (CTRY[k] && C.CONFIG.rates[K]) C.CONFIG.rates[K].rate = CTRY[k].rate; });
    const state = C.seedState("steady", "Juan");
    const people = PEOPLE.filter((pp) => COREC[pp.flag]);
    state.recipients = people.map((pp, i) => ({
      id: "r" + i, rel: RELKEY[norm(pp.rel || "")] || RELKEY[(pp.rel || "").toLowerCase()] || null,
      name: pp.name, short: { es: pp.rel ? `${pp.rel} (${pp.first})` : pp.first, en: pp.first },
      city: pp.city, country: COREC[pp.flag], method: pp.dest || "",
    }));
    state.account = st.hasAcct ? { open: true, balance: syncNum(st.acct.bal), card: { last4: "3307", frozen: false } } : { open: false, balance: 0, card: null };
    state.credit = { limit: typeof LIMIT !== "undefined" ? LIMIT : 300, used: syncNum(st.acct.owed) };
    state.loan = null; state.loan8 = null;
    const debit = CARDS.find((c) => c.debit);
    state.debitCard = debit ? { brand: debit.brand, last4: debit.last } : null;
    const billIdx = [];
    state.bills = (st.bills || []).map((b, i) => {
      billIdx.push(i);
      const prov = (b.name.split("·")[1] || b.name).trim();
      return { id: "b" + i, kind: norm(b.key || "").replace(/^(la|el) /, ""), provider: prov, rid: null,
        label: { es: b.name.split("·")[0].trim(), en: b.name.split("·")[0].trim() }, amount: b.amt, due: { es: b.due, en: b.due }, paid: !!b.paid };
    });
    state.movements = (st.hist || []).map((h, i) => ({ id: "h" + i, kind: h.a < 0 ? "out" : "in", title: { es: h.t, en: h.t }, date: { es: h.d, en: h.d }, amount: h.a }));
    state.phones = {}; state.payday = null;
    const hooks = {
      card() { return "c" + Date.now(); },
      update() { markDelivered(); },
      later(ms, fn) { setTimeout(fn, ms); },
      notify(txt) {
        markDelivered();
        // Avisos que llegan después (por ejemplo "tu envío ya llegó")
        if (L && L.conv) { try { L.conv.sendContextualUpdate(txt.en); } catch (e) {} }
        else bubble("f", esc(txt.es));
      },
      lang() { return "es"; },
    };
    return { state, tools: C.makeTools(state, hooks), people, billIdx,
      before: { movs: state.movements.length, recs: state.recipients.length, tids: Object.keys(state.transfers), used: state.credit.used } };
  }
  function getCore() { if (!core) core = buildCore(); return core; }

  function markDelivered() {
    xferLinks.forEach((k) => {
      const t = k.state.transfers[k.tid];
      if (t && t.step === 2 && k.x.status === "process") {
        k.x.status = "delivered";
        if (st.pending === k.x) st.pending = null;
      }
    });
  }

  // Escribe en el chat lo que pasó en la llamada
  function syncBack(c) {
    if (!c) return;
    const x = c.state;
    if (x.account.open) { st.hasAcct = true; st.acct.bal = syncNum(x.account.balance); }
    st.acct.owed = syncNum(st.acct.owed + (x.credit.used - c.before.used));
    // Movimientos nuevos → historial del chat
    x.movements.slice(0, Math.max(0, x.movements.length - c.before.movs)).reverse()
      .forEach((m) => st.hist.unshift({ t: C.tr(m.title, "es"), d: dShort(), a: m.amount }));
    // Servicios pagados
    x.bills.forEach((b, i) => { if (b.paid && st.bills[c.billIdx[i]]) st.bills[c.billIdx[i]].paid = true; });
    // Familiares nuevos
    x.recipients.slice(c.before.recs).forEach((r) => {
      const flag = Object.keys(COREC).find((k) => COREC[k] === r.country);
      if (!flag || PEOPLE.some((pp) => norm(pp.name) === norm(r.name))) return;
      try {
        const np = mkP(r.name, C.tr(r.short, "es") || "Familiar", flag, r.city, r.cash ? "cash" : "bank");
        PEOPLE.push(np); c.people.push(np);
      } catch (e) {}
    });
    // Envíos nuevos → aparecen en "Mis envíos" del chat
    Object.keys(x.transfers).filter((tid) => !c.before.tids.includes(tid)).forEach((tid) => {
      const t = x.transfers[tid];
      const idx = x.recipients.findIndex((r) => r.id === t.rid);
      const pp = c.people[idx];
      if (!pp) return;
      const fee = C.CONFIG.fee;
      const card = t.pay === "balance" || (!t.pay && x.account.open) ? { brand: "Billetera Félix", last: "", bal: true } : (CARDS.find((cc) => cc.debit) || CARDS[0]);
      const xr = { p: pp, usd: t.amount, fee, tot: syncNum(t.amount + fee), got: t.receive != null ? t.receive : null, card, cost: 0,
        folio: "FX-" + (48000000 + Math.floor(Math.random() * 999999)), status: t.step === 2 ? "delivered" : "process", date: dateTxt(), voz: true };
      st.xfers.push(xr);
      if (xr.status === "process") st.pending = xr;
      xferLinks.push({ state: x, tid, x: xr });
    });
    try { renderZone(); } catch (e) {}
    try { refreshDrawer(); } catch (e) {}
  }

  // Qué flujo del chat corresponde a cada tool (solo se usa si la persona pide verlo en pantalla)
  const HOUSTON = {
    prepare_transfer: "enviar", show_quote: "calcular", review_transfer: "enviar", payment_options: "enviar",
    offer_pay_later: "enviar", snpl_start: "enviar",
    show_balance: "resumen", show_movements: "historial", show_rates: "calcular",
    list_recipients: "destinatarios", add_recipient: "destinatarios",
    show_bills: "pagar_servicio", prepare_bill_payment: "pagar_servicio",
    offer_loan: "prestamo", offer_cash_loan: "prestamo", prepare_installment_payment: "prestamo",
    prepare_deposit: "depositar", prepare_open_account: "billetera", open_account: "billetera",
    show_card: "tarjetas", set_card_frozen: "tarjetas", add_debit_card: "tarjetas",
    talk_to_human: "hablar_con_persona",
  };

  function coreTools(s) {
    const c = getCore();
    const out = {};
    if (!c) return out;
    Object.keys(c.tools).forEach((name) => {
      out[name] = async (params) => {
        const p = Object.assign({}, params || {});
        if (name === "save_payday" && typeof p.payday === "string") p.payday = { es: p.payday, en: p.payday };
        if (HOUSTON[name]) s.lastFlow = HOUSTON[name];
        let res;
        try { res = c.tools[name](p); } catch (e) { console.error(e); res = { status: "error" }; }
        return JSON.stringify(res === undefined ? { status: "ok" } : res);
      };
    });
    return out;
  }

  // ¿La persona pidió verlo en pantalla o escribir?
  const WANTS_SCREEN = /(en (la )?pantalla|en el chat|por escrito|prefiero (escribir|verlo|leerlo)|quiero (verlo|leerlo|escribir)|(muestra|ensena|abre)(me|melo|lo)?\b.*\b(pantalla|chat|app|aplicacion))/;
  const KEYFLOW = {
    enviar: /envi|mand|remes|giro/, pagar_servicio: /pag.*(luz|agua|internet|servicio|recibo)|luz|cfe|izzi/,
    prestamo: /prestamo|credito/, billetera: /billetera|abrir.*cuenta/, calcular: /calcul|tipo de cambio|cuanto (llega|recibe)/,
    historial: /historial|movimient/, resumen: /resumen|saldo/, depositar: /ingresar|depositar|recargar mi cuenta/,
    retirar: /retirar|sacar/, tarjetas: /tarjeta/, destinatarios: /destinatari|contacto/, hablar_con_persona: /persona|agente|humano/,
  };
  function screenRequest(s, text) {
    const t = norm(text);
    if (!WANTS_SCREEN.test(t)) return false;
    s.pending = Object.keys(KEYFLOW).find((k) => KEYFLOW[k].test(t)) || s.lastFlow || null;
    try { s.conv && s.conv.sendContextualUpdate("The user asked to continue on screen. Say in one short sentence that you are opening it on screen now, then stop."); } catch (e) {}
    setTimeout(() => { if (L === s) endLive(); }, 2600);
    return true;
  }

  lv.onclick = async () => {
    if (L || rec) return;
    if (!st.authed) { await bot("Para hablar con Félix en vivo, primero entra a tu cuenta."); return; }
    if (st.mode === "busy" || S.res) return;
    startLive();
  };

  function setCall(state, text) {
    callEl.classList.toggle("speaking", state === "speaking");
    callEl.classList.toggle("listening", state === "listening");
    cstat.textContent = text;
  }

  // Contexto para el agente, con el mismo formato que usa Houston
  function contextString() {
    const c = getCore();
    if (!c) return "";
    const x = c.state, tr = C.tr;
    const recs = x.recipients.map((r) => `${r.name} (${tr(r.short, "es")}, id ${r.id}, ${r.city}, ${r.country})`).join("; ") || "ninguno";
    return [
      `Nombre: ${x.user.name}. Idioma de la interfaz: español.`,
      `Escenario: ${x.account.open ? "usuario con billetera Félix" : "usuario sin billetera Félix: paga los envíos con tarjeta de débito " + (x.debitCard ? x.debitCard.brand + " ••" + x.debitCard.last4 : "") + " o Apple Pay"}. account_open = ${x.account.open}.`,
      x.account.open ? `Saldo: $${x.account.balance}. Tarjeta débito •••• ${x.account.card ? x.account.card.last4 : "-"}${x.account.card && x.account.card.frozen ? " (congelada)" : ""}.` : "Aún no tiene cuenta.",
      `Crédito disponible: $${(x.credit.limit - x.credit.used).toFixed(2)}.`,
      `Familiares guardados: ${recs}.`,
      x.loan ? `Préstamo activo: cuota ${x.loan.paid + 1} de ${x.loan.n}, $${x.loan.installment}, vence ${x.loan.due.es}.` : "Sin préstamo activo.",
      `Servicios pendientes: ${(x.bills || []).filter((b) => !b.paid).map((b) => `${b.label.es} (${b.provider}) $${b.amount}, vence ${b.due.es}`).join("; ") || "ninguno"}.`,
      `Día de pago: ${x.payday ? tr(x.payday, "es") : "no definido"}.`,
      "Esta es una llamada de voz: completa todo por voz, pide confirmación antes de ejecutar y no mandes a la persona a la pantalla. Si la persona pide verlo en pantalla o escribir, la app lo abre sola.",
    ].join("\n");
  }

  async function startLive() {
    core = buildCore();
    const c0 = core;
    L = { lines: [], startedAt: Date.now(), muted: false, speaker: true, pending: null, lastFlow: null, movesBefore: c0 ? c0.state.movements.length : 0 };
    $("#cmute").classList.remove("on"); $("#cspk").classList.remove("on");
    cap.textContent = "";
    setCall("", "Conectando…");
    callEl.classList.add("on");
    await ready;
    if (server.live) {
      try { await startEleven(); return; }
      catch (e) { console.warn("ElevenLabs", e); }
    }
    startBrowser();
  }

  /* ── ElevenLabs Agents (WebRTC) ── */
  async function startEleven() {
    cnote.textContent = "Habla con naturalidad. Félix te escucha.";
    cnote.classList.remove("mode");
    const r = await fetch("/api/el-token", { headers: authHeaders() });
    if (r.status === 401) { cnote.textContent = "Este link necesita un código de acceso."; throw new Error("code"); }
    if (!r.ok) throw new Error("token " + r.status);
    const { token } = await r.json();
    const mod = await import(SDK_URL);
    const s = L;
    s.conv = await mod.Conversation.startSession({
      conversationToken: token,
      connectionType: "webrtc",
      dynamicVariables: { user_context: contextString(), first_message: "Hola, soy Félix. ¿En qué te ayudo hoy?" },
      clientTools: {
        ...coreTools(s),
        abrir_flujo: async ({ flujo }) => {
          if (!FLOWS[flujo]) return JSON.stringify({ ok: false, error: "flujo desconocido", disponibles: Object.keys(FLOWS) });
          s.pending = flujo;
          // Deja que Félix termine su frase y luego abre el flujo en el chat
          setTimeout(() => endLive(), 2200);
          return JSON.stringify({ ok: true, nota: "El flujo se abre en pantalla al colgar. Despídete en una frase corta." });
        },
      },
      onMessage: (m) => {
        const who = (m.source || m.role) === "user" ? "u" : "f";
        const text = String(m.message || "").replace(/\[[a-z _-]{2,24}\]\s*/gi, "").trim();
        if (!text || /^[.\s…]*$/.test(text)) return;
        s.lines.push([who, text]);
        cap.textContent = text;
        if (who === "u") screenRequest(s, text);
      },
      onModeChange: ({ mode }) => {
        if (L !== s) return;
        setCall(mode, mode === "speaking" ? "Félix está hablando" : s.muted ? "Micrófono en silencio" : "Te escucho…");
      },
      onDisconnect: () => { if (L === s) endLive(); },
      onError: (e) => console.error("ElevenLabs", e),
    });
    if (L !== s) { try { s.conv.endSession(); } catch (e) {} return; }
    setCall("listening", "Te escucho…");
    const loop = async () => {
      if (L !== s) return;
      try {
        const v = s.conv.getMode && s.conv.getMode() === "speaking" ? await s.conv.getOutputVolume() : await s.conv.getInputVolume();
        cav.style.transform = `scale(${1 + Math.min(0.25, v * 0.5)})`;
      } catch (e) {}
      s.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  /* ── Modo demo: voz del navegador ── */
  function startBrowser() {
    const s = L;
    cnote.textContent = "Modo demo: voz del navegador. La voz natural se activa al conectar ElevenLabs.";
    cnote.classList.add("mode");
    if (!SR || !window.speechSynthesis) {
      setCall("", "Tu navegador no soporta voz en vivo");
      cap.textContent = "Prueba en Chrome o Safari.";
      return;
    }
    const say = (text) => new Promise((res) => {
      s.lines.push(["f", text]); cap.textContent = text;
      setCall("speaking", "Félix está hablando");
      try { s.recog && s.recog.abort(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-MX"; u.rate = 1.05; u.volume = s.speaker ? 1 : 0;
      const v = speechSynthesis.getVoices().find((x) => /^es(-|_)(MX|US|419)/i.test(x.lang)) || speechSynthesis.getVoices().find((x) => /^es/i.test(x.lang));
      if (v) u.voice = v;
      u.onend = u.onerror = () => { res(); if (L === s) listen(); };
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    });
    const listen = () => {
      if (L !== s) return;
      if (s.muted) { setCall("listening", "Micrófono en silencio"); return; }
      setCall("listening", "Te escucho…");
      const r = new SR();
      r.lang = "es-MX"; r.interimResults = true; r.continuous = false;
      s.recog = r;
      let finalText = "";
      r.onresult = (ev) => {
        const res = ev.results[ev.results.length - 1];
        cap.textContent = res[0].transcript;
        if (res.isFinal) finalText = res[0].transcript;
      };
      r.onend = () => {
        if (L !== s || s.recog !== r) return;
        if (!finalText.trim()) return listen();
        s.lines.push(["u", finalText.trim()]);
        answer(finalText.trim());
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed") { setCall("", "Necesitamos permiso para usar tu micrófono"); s.recog = null; }
      };
      try { r.start(); } catch (e) {}
    };
    s.listen = listen;
    const KEY = {
      enviar: /envi|mand|remes|giro/, pagar_servicio: /pag|luz|cfe|internet|izzi|servicio|recibo/,
      prestamo: /prestamo|credito|dinero extra/, billetera: /billetera|abrir.*cuenta/, calcular: /calcul|cuanto (llega|recibe)/,
      historial: /historial|movimient|ultimos envios/, resumen: /resumen|saldo/, depositar: /ingresar|depositar|recargar/,
      retirar: /retirar|sacar/, invitar: /invit|referid/, tarjetas: /tarjeta/, destinatarios: /destinatari|contacto/,
      alertas: /alerta|avis/, cancelar_envio: /cancel/, hablar_con_persona: /persona|agente|humano/,
    };
    async function answer(text) {
      const t = norm(text);
      if (/adios|gracias|eso es todo|colgar|nada mas/.test(t)) { await say("Con gusto. Aquí sigo en el chat cuando me necesites."); return endLive(); }
      const k = Object.keys(KEY).find((x) => KEY[x].test(t));
      if (k) { s.pending = k; await say(`Va, te ayudo con eso. Te lo abro en pantalla.`); return endLive(); }
      await say("No te entendí bien. Puedes pedirme enviar dinero, pagar un servicio, ver tu saldo o pedir un préstamo.");
    }
    say("Hola, soy Félix. ¿En qué te ayudo hoy?");
  }

  /* ── controles de la llamada ── */
  $("#cmute").onclick = (e) => {
    if (!L) return;
    L.muted = !L.muted;
    e.currentTarget.classList.toggle("on", L.muted);
    if (L.conv) { try { L.conv.setMicMuted(L.muted); } catch (err) {} }
    else if (L.muted) { try { L.recog && L.recog.abort(); } catch (err) {} L.recog = null; setCall("listening", "Micrófono en silencio"); }
    else if (L.listen && !speechSynthesis.speaking) L.listen(); // modo demo: vuelve a escuchar
    if (L.conv) setCall("listening", L.muted ? "Micrófono en silencio" : "Te escucho…");
  };

  $("#cspk").onclick = (e) => {
    if (!L) return;
    L.speaker = !L.speaker;
    e.currentTarget.classList.toggle("on", !L.speaker);
    if (L.conv) { try { L.conv.setVolume({ volume: L.speaker ? 1 : 0 }); } catch (err) {} }
  };

  $("#cend").onclick = () => endLive();

  // Solo para pruebas (?debug=1): permite simular una llamada sin micrófono
  if (/[?&]debug=1/.test(location.search)) window.__felixVoz = { FLOWS, endLive, coreTools, getCore, screenRequest, get live() { return L; } };

  async function endLive() {
    const s = L; if (!s) return;
    L = null;
    cancelAnimationFrame(s.raf); cav.style.transform = "";
    try { s.recog && s.recog.abort(); } catch (e) {}
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
    if (s.conv) { try { await s.conv.endSession(); } catch (e) {} }
    callEl.classList.remove("on", "speaking", "listening");

    // La conversación queda en el chat
    const lines = s.lines.filter(([, t]) => t);
    if (lines.length) {
      const secs = Math.round((Date.now() - s.startedAt) / 1000);
      const sep = document.createElement("div");
      sep.className = "callsep"; sep.textContent = `Llamada con Félix · ${mmss(secs)}`;
      chat.appendChild(sep);
      lastFrom = null;
      lines.forEach(([who, t]) => bubble(who, esc(t)));
      toEnd();
    }
    // Resumen de lo que Félix hizo durante la llamada
    const c = core;
    syncBack(c);
    if (c) {
      const fresh = c.state.movements.slice(0, Math.max(0, c.state.movements.length - s.movesBefore));
      if (fresh.length) {
        const fmt = (n) => (n < 0 ? "−" : "+") + "$" + Math.abs(n).toFixed(2);
        const items = fresh.map((m) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0"><span>${esc(C.tr(m.title, "es"))}</span><b style="font-weight:600">${fmt(m.amount)}</b></div>`).join("");
        bubble("f", `<div style="min-width:230px"><div style="font-weight:600;margin-bottom:6px">Listo por voz</div>${items}<div style="margin-top:6px;font-size:13.5px;color:var(--mut)">Saldo: $${c.state.account.balance.toFixed(2)} USD</div></div>`, { wide: true });
        toEnd();
      }
    }
    if (s.pending && FLOWS[s.pending] && st.mode !== "busy" && !S.res) {
      const [, run] = FLOWS[s.pending];
      closeBtns(); st.mode = "busy";
      await sleep(400);
      await run();
    }
  }
})();
