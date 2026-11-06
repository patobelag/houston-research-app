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

  // El agente de Houston trae sus propias tools. Las conectamos a los flujos de este chat:
  // cuando Félix "prepara" algo, cerramos la llamada y abrimos ese flujo en pantalla.
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
  const NOOP = ["set_user_name", "confirm_pending", "cancel_pending", "show_profile", "show_product", "prepare_topup",
    "accept_terms", "save_identity", "start_id_check", "snpl_submit_application", "snpl_accept_terms"];
  function houstonTools(s) {
    const out = {};
    Object.entries(HOUSTON).forEach(([name, flujo]) => {
      out[name] = async () => {
        s.pending = flujo;
        setTimeout(() => { if (L === s) endLive(); }, 2600);
        return JSON.stringify({ status: "ok", nota: `En pantalla se abre ${FLOWS[flujo][0]}. La persona termina ahí. Despídete en una frase corta y no pidas más datos.` });
      };
    });
    NOOP.forEach((name) => { out[name] = async () => JSON.stringify({ status: "ok", nota: "Esto se hace en la pantalla del chat. Ofrece abrir el flujo que necesite." }); });
    return out;
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

  function contextString() {
    const people = (typeof PEOPLE !== "undefined" ? PEOPLE : []).map((p) => p.name).join(", ") || "ninguno";
    const bills = (st.bills || []).filter((b) => !b.paid).map((b) => `${b.name} $${b.amt} vence ${b.due}`).join("; ") || "ninguno";
    return [
      `Billetera Félix: ${st.hasAcct ? "abierta, saldo $" + (st.acct.bal || 0).toFixed(2) : "no la ha abierto"}.`,
      `Destinatarios guardados: ${people}.`,
      `Servicios pendientes: ${bills}.`,
      st.pending ? `Envío en proceso: $${st.pending.usd} a ${st.pending.p.first}.` : "Sin envíos en proceso.",
      st.loan ? "Tiene un préstamo activo." : "Sin préstamo activo.",
    ].join("\n");
  }

  async function startLive() {
    L = { lines: [], startedAt: Date.now(), muted: false, speaker: true, pending: null };
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
        ...houstonTools(s),
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
  if (/[?&]debug=1/.test(location.search)) window.__felixVoz = { FLOWS, endLive, get live() { return L; } };

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
    if (s.pending && FLOWS[s.pending] && st.mode !== "busy" && !S.res) {
      const [, run] = FLOWS[s.pending];
      closeBtns(); st.mode = "busy";
      await sleep(400);
      await run();
    }
  }
})();
